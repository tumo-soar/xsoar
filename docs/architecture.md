# X SOAR Architecture

X SOAR receives logs, runs them through playbooks and shows the analyst a report. Every fact in the report references a log line, and the system checks that the line exists.

The core requirement: an alert is never lost. If something breaks along the way, the alert gets the `MANUAL_CHECK_REQUIRED` status and goes to a human.

## Diagram

![X SOAR architecture](schema.png)

What on the diagram already works and what comes later:

- There is no nginx yet. The browser talks to web (port 5173), api (3000) and collector (8000) directly.
- collector currently accepts a manually uploaded log. Polling Wazuh comes later.
- api does not publish to RabbitMQ or hold a WebSocket yet. It only reads alerts from the database.
- `worker-ai` is the only worker so far.
- The database schema is called `api` (`control: api` on the diagram).

## Services

| Service        | What it does                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `web`          | User interface (React)                                                                                                                                             |
| `api`          | Application control: everything the user does in the UI goes through api. Currently serves the alert list and reports; later users, source connections, analyst decisions |
| `collector`    | Receives logs and stores them as is                                                                                                                                |
| `orchestrator` | Drives the alert: creates tasks, decides which playbook is next, changes the status                                                                                |
| `worker-ai`    | Runs playbooks that need an LLM                                                                                                                                    |
| `worker`       | Runs playbooks that don't need an LLM                                                                                                                              |
| PostgreSQL     | All data                                                                                                                                                           |
| RabbitMQ       | Carries messages between services                                                                                                                                  |

Services don't call each other over HTTP. One puts a message in a queue, another picks it up. So any service can be restarted, and its messages will wait for it.

## Path of a single log

```
                collector           RabbitMQ                        orchestrator              worker-ai              LLM
                    │                   │                                 │                       │                   │
HTTP POST /alerts   │                   │                                 │                       │                   │
───────────────────▶│                   │                                 │                       │                   │
                    │ DB table          │                                 │                       │                   │
                    │ collector.alerts: │                                 │                       │                   │
                    │ log               │                                 │                       │                   │
                    │                   │                                 │                       │                   │
                    │ message           │                                 │                       │                   │
                    │ alert.created     │                                 │                       │                   │
                    ├──────────────────▶│                                 │                       │                   │
                    │                   │ queue orchestrator.alerts       │                       │                   │
                    │                   ├────────────────────────────────▶│                       │                   │
                    │                   │                                 │ DB table              │                   │
                    │                   │                                 │ orchestrator.alerts:  │                   │
                    │                   │                                 │ status ANALYZING      │                   │
                    │                   │                                 │                       │                   │
                    │                   │ queue                           │                       │                   │
                    │                   │ playbook.p01_ai_validation      │                       │                   │
                    │                   │◀────────────────────────────────┤                       │                   │
                    │                   │ queue                           │                       │                   │
                    │                   │ playbook.p01_ai_validation      │                       │                   │
                    │                   ├────────────────────────────────────────────────────────▶│                   │
                    │                   │                                 │                       │ HTTP, log         │
                    │                   │                                 │                       ├──────────────────▶│
                    │                   │                                 │                       │ JSON              │
                    │                   │                                 │                       │◀──────────────────┤
                    │                   │                                 │                       │ fact check        │
                    │                   │                                 │                       │                   │
                    │                   │ queue playbooks.done            │                       │                   │
                    │                   │◀────────────────────────────────────────────────────────┤                   │
                    │                   │ queue playbooks.done            │                       │                   │
                    │                   ├────────────────────────────────▶│                       │                   │
                    │                   │                                 │ DB table              │                   │
                    │                   │                                 │ orchestrator.alerts:  │                   │
                    │                   │                                 │ ANALYZED + report     │                   │
```

Messages between services always go through RabbitMQ. "Queue" is a RabbitMQ queue, "DB table" is a PostgreSQL table. The `orchestrator.alerts` queue and the `orchestrator.alerts` table share a name, but they are different things. The browser fetches the report separately: `GET /api/alerts` → api → database (`orchestrator` schema).

1. collector stores the log and sends an `alert.created` message. The browser immediately gets the alert number, e.g. `ALR-000123`.
2. orchestrator creates the alert with status `ANALYZING` and puts a task in the `playbook.p01_ai_validation` queue. The log lines are passed inside the task: the worker has no database access.
3. worker-ai runs the playbook and sends the result to the `playbooks.done` queue.
4. orchestrator saves the report and sets the status to `ANALYZED`. If the playbook returned an error, the status is `MANUAL_CHECK_REQUIRED`.

## Playbooks and routing

A playbook is a self-contained check, e.g. "AI log analysis". In code it is a single Python function in the worker. All its steps run in sequence, and the whole playbook is sent to the queue.

Each playbook has its own queue `playbook.<id>`. If several worker instances are running, RabbitMQ distributes tasks between them.

Where an alert goes after a playbook is decided by the `next_step` function in `services/orchestrator/src/xsoar_orchestrator/routing.py` ([ADR-005](adr/ADR-005-route-as-code.md)):

```python
START = "p01_ai_validation"
PLAYBOOKS = {"p01_ai_validation"}

def next_step(playbook: str, status: str, output: dict[str, Any] | None) -> str:
    match playbook:
        case "p01_ai_validation":
            if status == "failed":
                return MANUAL_CHECK_REQUIRED
            return ANALYZED
    log.warning("no route after %s", playbook)
    return MANUAL_CHECK_REQUIRED
```

An alert starts at `START`. After each playbook orchestrator calls `next_step` with its status (`ok` or `failed`) and output. The function returns either the id of the next playbook (the `playbook.<id>` queue follows from it) or a final status: `ANALYZED` or `MANUAL_CHECK_REQUIRED`.

Example of a chain that branches on output:

```python
case "p01_ai_validation":
    if status == "failed":
        return MANUAL_CHECK_REQUIRED
    if output["verdict"] == "benign":
        return ANALYZED
    return "p02_enrich_ip"
case "p02_enrich_ip":
    ...
```

A new playbook is added to `PLAYBOOKS`: orchestrator creates queues from this list. If `next_step` doesn't know what to do after a playbook, it logs a warning and returns `MANUAL_CHECK_REQUIRED`.

The next playbook receives the previous playbook's input plus its output under the playbook's id. The input accumulates: p02 gets `{lines, p01_ai_validation: {...}}`, p03 additionally gets `p02_...: {...}`.

## How AI analysis works

The `p01_ai_validation` playbook does the following:

1. Numbers the log lines.
2. Sends the log to the LLM. The log is marked as data, not instructions, so a line like "ignore previous instructions" in the log doesn't redirect the model.
3. Checks that the response is JSON in the expected format. If not, the task fails.
4. Drops facts that reference non-existent lines. The line text in the report is taken from the log itself, not from the model's response.

The report contains a short summary, a verdict (`suspicious`, `benign` or `unclear`), confidence, a list of facts with log lines, questions for manual review and the model name.

## Where data is stored

| Where                 | What                                             | Who writes   |
| --------------------- | ------------------------------------------------ | ------------ |
| `collector` schema    | raw log                                          | collector    |
| `orchestrator` schema | alerts, statuses, reports, tasks                 | orchestrator |
| `api` schema          | empty for now, later users and analyst decisions | api          |
| RabbitMQ              | only messages in transit                         |              |

Only the owning service writes to each schema. This is enforced by database permissions: each service has its own role and cannot write to another service's schema.

api reads alerts through the `orchestrator.api_alerts` view, not from the tables directly. Columns can be added to the view, but not removed or renamed, otherwise api breaks.

Workers have no database at all. Everything they need comes in the task.

## Why an alert is never lost

- **Database first, then queue.** A service writes the data and the outgoing message to the database in one transaction and sends it afterwards. If RabbitMQ is down, the message waits in the `outbox` table and is sent when the broker is back.
- **Ack after the result.** A worker acknowledges a task only after RabbitMQ has accepted the result. If a worker crashes mid-task, another instance picks it up.
- **Retries are safe.** The same message may arrive twice. The `inbox` table remembers processed messages, so a duplicate changes nothing.
- **Three attempts.** If a task fails three times, it goes to a separate `playbook.<id>.dlq` queue and the alert moves to `MANUAL_CHECK_REQUIRED`.
- **Task deadline.** Every task has a deadline (11 minutes). Once a minute orchestrator looks for overdue tasks and also moves their alerts to `MANUAL_CHECK_REQUIRED`.

The only place an alert can get stuck: an `alert.created` message that orchestrator failed to process three times. It sits in the `orchestrator.alerts.dlq` queue, and the log is stored in the `collector` schema. Such cases are handled manually for now.

## Alert statuses

```
RECEIVED ──▶ ANALYZING ──▶ ANALYZED
                  │
                  └──────▶ MANUAL_CHECK_REQUIRED
```

All transitions are defined in one place: `services/orchestrator/src/xsoar_orchestrator/transitions.py`. A transition not in the table is not performed.

Analyst decisions (`DISMISSED`, `ESCALATED`) and suppression rules (`SUPPRESSED`) will come later.

## Messages

The format of each message is described by a JSON Schema in `contracts/`. Python and TypeScript code is generated from these schemas and is never edited by hand.

| Message         | From → to                |
| --------------- | ------------------------ |
| `alert.created` | collector → orchestrator |
| `task.playbook` | orchestrator → worker    |
| `task.result`   | worker → orchestrator    |

An optional field can be added to a format. A field can be removed or renamed only with a new format version.

## Extending

**New playbook.** Describe the input and output in `contracts/playbooks/` (the input has `lines` and the outputs of the required previous playbooks under their ids), generate the code, add a function with the `@playbook` decorator to the worker (see `p01_ai_validation` as an example), add its id to `PLAYBOOKS` and a branch to `next_step` (`services/orchestrator/src/xsoar_orchestrator/routing.py`).

**Another LLM.** If the provider has an OpenAI-compatible API (Ollama, vLLM, OpenAI), it's enough to add its URL to `make_llm` in `services/worker-ai/src/xsoar_worker_ai/llm.py` and the environment variables. The provider is selected with the `LLM_PROVIDER` variable.

**New log source.** The source stores the log in `collector.alerts` and sends `alert.created`, as `services/collector/src/xsoar_collector/app.py` does. orchestrator and api don't need to change.

## Not done yet

Incidents (grouping related alerts), Wazuh polling, analyst decisions in the UI, WebSocket, a regular worker without an LLM, monitoring.
