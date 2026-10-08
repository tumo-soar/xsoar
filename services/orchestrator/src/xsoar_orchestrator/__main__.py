import asyncio
import logging
from functools import partial

from xsoar_common import outbox
from xsoar_common.db import make_sessionmaker
from xsoar_common.lifecycle import wait_for_stop
from xsoar_common.logging import setup_logging
from xsoar_common.mq import Publisher, connect, consume, declare_topology, playbook_queue
from xsoar_common.mq.topology import ALERTS_QUEUE, RESULTS_QUEUE

from xsoar_orchestrator.handlers.alerts import handle_alert_created
from xsoar_orchestrator.handlers.results import handle_dead_task, handle_result
from xsoar_orchestrator.routing import PLAYBOOKS, START
from xsoar_orchestrator.runs import SCHEMA, Context
from xsoar_orchestrator.settings import Settings
from xsoar_orchestrator.sweeper import sweep_loop

log = logging.getLogger("xsoar_orchestrator")


async def main() -> None:
    settings = Settings()  # type: ignore[call-arg]
    setup_logging(settings.log_level)

    if START not in PLAYBOOKS:
        raise RuntimeError(f"start playbook {START} is not in PLAYBOOKS")

    sessions = make_sessionmaker(settings.database_url)
    async with await connect(str(settings.rabbitmq_url)) as connection:
        setup = await connection.channel()
        await declare_topology(setup, PLAYBOOKS)
        await setup.close()

        publisher = Publisher(await connection.channel())
        ctx = Context(
            sessions=sessions,
            publisher=publisher,
            task_deadline_s=settings.task_deadline_s,
        )

        queues = {
            ALERTS_QUEUE: handle_alert_created,
            RESULTS_QUEUE: handle_result,
            **{f"{playbook_queue(p)}.dlq": handle_dead_task for p in PLAYBOOKS},
        }
        for queue, handler in queues.items():
            await consume(await connection.channel(), queue, partial(handler, ctx), settings.prefetch)
            log.info("consuming %s", queue)

        background = [
            asyncio.create_task(outbox.relay_loop(sessions, SCHEMA, publisher)),
            asyncio.create_task(outbox.cleanup_loop(sessions, SCHEMA, has_inbox=True)),
            asyncio.create_task(sweep_loop(ctx, settings.sweep_interval_s)),
        ]
        await wait_for_stop()
        log.info("stopping")
        for task in background:
            task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
