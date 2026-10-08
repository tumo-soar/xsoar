import asyncio
import logging

from sqlalchemy import text
from xsoar_common import outbox

from xsoar_orchestrator.runs import SCHEMA, Context, finish_task

log = logging.getLogger(__name__)


async def sweep_once(ctx: Context) -> int:
    async with ctx.sessions() as session, session.begin():
        task_ids = (
            await session.execute(
                text(
                    "SELECT task_id FROM orchestrator.tasks "
                    "WHERE status = 'QUEUED' AND deadline_at < now() "
                    "ORDER BY deadline_at LIMIT 100 FOR UPDATE SKIP LOCKED"
                )
            )
        ).scalars().all()
        messages = []
        for task_id in task_ids:
            log.warning("task %s missed its deadline", task_id)
            messages += await finish_task(session, ctx, task_id, "failed", None, "deadline")

    await outbox.publish_now(ctx.sessions, SCHEMA, ctx.publisher, messages)
    return len(task_ids)


async def sweep_loop(ctx: Context, interval_s: int) -> None:
    while True:
        try:
            await sweep_once(ctx)
        except Exception:
            log.exception("sweeper failed")
        await asyncio.sleep(interval_s)
