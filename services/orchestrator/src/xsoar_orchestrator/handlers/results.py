import logging

from xsoar_common import inbox, outbox
from xsoar_contracts.envelope import Envelope
from xsoar_contracts.task_playbook import TaskPlaybook
from xsoar_contracts.task_result import TaskResult

from xsoar_orchestrator.runs import SCHEMA, Context, finish_task

log = logging.getLogger(__name__)

CONSUMER = "orchestrator.results"


async def handle_result(ctx: Context, body: bytes) -> None:
    envelope = Envelope.model_validate_json(body)
    result = TaskResult.model_validate(envelope.payload)

    async with ctx.sessions() as session, session.begin():
        if not await inbox.claim(session, SCHEMA, CONSUMER, envelope.message_id):
            log.info("duplicate message %s ignored", envelope.message_id)
            return
        messages = await finish_task(
            session, ctx, result.task_id, result.status, result.output, result.error
        )

    await outbox.publish_now(ctx.sessions, SCHEMA, ctx.publisher, messages)


async def handle_dead_task(ctx: Context, body: bytes) -> None:
    """A task message that reached the DLQ after the delivery limit."""
    envelope = Envelope.model_validate_json(body)
    task = TaskPlaybook.model_validate(envelope.payload)

    async with ctx.sessions() as session, session.begin():
        messages = await finish_task(session, ctx, task.task_id, "failed", None, "delivery limit")

    await outbox.publish_now(ctx.sessions, SCHEMA, ctx.publisher, messages)
