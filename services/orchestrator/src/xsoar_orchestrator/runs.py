import json
import logging
from dataclasses import dataclass
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from xsoar_common import outbox
from xsoar_common.envelope import make_envelope
from xsoar_common.mq import Publisher, playbook_queue
from xsoar_common.mq.topology import TASKS_EXCHANGE
from xsoar_contracts.task_playbook import TaskPlaybook

from xsoar_orchestrator.routing import ANALYZED, PLAYBOOKS, START, next_step
from xsoar_orchestrator.transitions import ROUTE_END_EVENTS, transition

log = logging.getLogger(__name__)

SCHEMA = "orchestrator"


@dataclass
class Context:
    sessions: async_sessionmaker[AsyncSession]
    publisher: Publisher
    task_deadline_s: int


async def set_alert_status(
    session: AsyncSession,
    alert_id: UUID,
    event: str,
    report: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    row = (
        await session.execute(
            text("SELECT status FROM orchestrator.alerts WHERE alert_id = :id FOR UPDATE"),
            {"id": alert_id},
        )
    ).first()
    new_status = transition(row.status, event) if row else None
    if new_status is None:
        return
    await session.execute(
        text(
            "UPDATE orchestrator.alerts SET status = :status, updated_at = now(), "
            "report = COALESCE(CAST(:report AS jsonb), report), error = COALESCE(:error, error) "
            "WHERE alert_id = :id"
        ),
        {
            "id": alert_id,
            "status": new_status,
            "report": json.dumps(report) if report is not None else None,
            "error": error,
        },
    )


def next_input(
    task_input: dict[str, Any], playbook: str, output: dict[str, Any] | None
) -> dict[str, Any]:
    return {**task_input, playbook: output}


async def queue_task(
    session: AsyncSession,
    ctx: Context,
    alert_id: UUID,
    run_id: UUID,
    playbook: str,
    task_input: dict[str, Any],
) -> outbox.OutboxMessage:
    task_id = uuid4()
    await session.execute(
        text(
            "INSERT INTO orchestrator.tasks (task_id, run_id, playbook, status, input, deadline_at) "
            "VALUES (:task_id, :run_id, :playbook, 'QUEUED', CAST(:input AS jsonb), "
            "now() + make_interval(secs => :deadline))"
        ),
        {
            "task_id": task_id,
            "run_id": run_id,
            "playbook": playbook,
            "input": json.dumps(task_input),
            "deadline": ctx.task_deadline_s,
        },
    )
    task = TaskPlaybook(
        task_id=task_id, run_id=run_id, alert_id=alert_id, playbook=playbook, input=task_input
    )
    envelope = make_envelope("task.playbook", alert_id, task, run_id, task_id)
    return await outbox.add(session, SCHEMA, TASKS_EXCHANGE, playbook_queue(playbook), envelope)


async def start_run(
    session: AsyncSession, ctx: Context, alert_id: UUID, lines: list[str]
) -> list[outbox.OutboxMessage]:
    run_id = uuid4()
    await session.execute(
        text(
            "INSERT INTO orchestrator.runs (run_id, alert_id, status) "
            "VALUES (:run_id, :alert_id, 'RUNNING')"
        ),
        {"run_id": run_id, "alert_id": alert_id},
    )
    message = await queue_task(session, ctx, alert_id, run_id, START, {"lines": lines})
    await set_alert_status(session, alert_id, "analysis_started")
    return [message]


async def finish_task(
    session: AsyncSession,
    ctx: Context,
    task_id: UUID,
    status: str,
    output: dict[str, Any] | None,
    error: str | None,
) -> list[outbox.OutboxMessage]:
    """Records the result of a QUEUED task and moves the run along its route.

    Shared by results, the DLQ and the sweeper, so the three can never disagree.
    Returns the messages to publish after commit.
    """
    task = (
        await session.execute(
            text(
                "SELECT t.run_id, t.playbook, t.status, t.input::text AS input, r.alert_id "
                "FROM orchestrator.tasks t JOIN orchestrator.runs r USING (run_id) "
                "WHERE t.task_id = :id FOR UPDATE OF t"
            ),
            {"id": task_id},
        )
    ).first()
    if task is None or task.status != "QUEUED":
        log.info("ignoring result for task %s: %s", task_id, task.status if task else "unknown")
        return []

    await session.execute(
        text(
            "UPDATE orchestrator.tasks SET status = :status, output = CAST(:output AS jsonb), "
            "error = :error, finished_at = now() WHERE task_id = :id"
        ),
        {
            "id": task_id,
            "status": status.upper(),
            "output": json.dumps(output) if output is not None else None,
            "error": error,
        },
    )

    target = next_step(task.playbook, status, output)
    if target in PLAYBOOKS:
        message = await queue_task(
            session,
            ctx,
            task.alert_id,
            task.run_id,
            target,
            next_input(json.loads(task.input), task.playbook, output),
        )
        return [message]

    await session.execute(
        text(
            "UPDATE orchestrator.runs SET status = 'FINISHED', result = :result, "
            "finished_at = now() WHERE run_id = :id"
        ),
        {"id": task.run_id, "result": target},
    )
    analyzed = target == ANALYZED
    await set_alert_status(
        session,
        task.alert_id,
        ROUTE_END_EVENTS[target],
        report=output if analyzed else None,
        error=None if analyzed else error or f"{task.playbook} ended in {target}",
    )
    return []
