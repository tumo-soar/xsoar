# X SOAR: Playbook_00 + Playbook_01

Put a `.log` file into `data/inbox/`. Playbook_00 (orchestrator) picks it up and sends it to
Playbook_01 (AI Alert Validation). The worker masks secrets, asks an OpenRouter model for a summary
and checks that every fact cited by the model exists in the log. The report is written to `data/results/`.

```
data/inbox/*.log -> Playbook_00 -> HTTP -> Playbook_01 -> OpenRouter
                         |
                         v
               data/results/<id>.md + .json
```

More details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## data/

| Folder | Purpose |
|---|---|
| `inbox/` | Input. Put `.log` files here, checked every 3 seconds |
| `processing/` | File currently being processed |
| `processed/` | Processed logs, prefixed with a timestamp |
| `failed/` | Empty or broken files |
| `results/` | Output: `<id>.md` report and `<id>.json` |

The system name comes from the file name before the first `_`
(`orders-api_config-change.log` -> `orders-api`).

## Setup

```bash
cp .env.example .env
# set AI_API_KEY and AI_MODEL, e.g. google/gemma-4-31b-it:free
```

Without a key the AI is disabled and every alert gets `MANUAL_CHECK_REQUIRED`.

## Run

```bash
docker compose up -d --build   # start in background
docker compose logs -f         # follow logs
docker compose ps              # status
docker compose down            # stop
```

After editing `.env`: `docker compose up -d --force-recreate`

## Test

```bash
cp samples/orders-api_config-change.log data/inbox/   # one file
cp samples/*.log data/inbox/                          # all samples

# worker down -> MANUAL_CHECK_REQUIRED
docker compose stop playbook_01
cp samples/orders-api_missing-info.log data/inbox/
docker compose start playbook_01
```

PowerShell: `Copy-Item samples\*.log data\inbox\`

Worker API: http://localhost:8001/docs

Unit tests (no network or key needed):

```bash
docker compose run --rm playbook_01 pytest
docker compose run --rm playbook_00 pytest
```

## Samples

| File | Scenario |
|---|---|
| `orders-api_config-change.log` | Payment verification disabled at night without a ticket |
| `orders-api_routine-deploy.log` | Planned deploy with an approved ticket |
| `orders-api_missing-info.log` | Config change with no author and no ticket |
| `auth-server_ssh-bruteforce.log` | SSH brute force followed by a successful login |
| `orders-api_prompt-injection.log` | Log line tries to make the AI answer "benign" |

Free OpenRouter models are rate-limited. On `429 Too Many Requests` wait or switch `AI_MODEL`
to another `:free` model.
