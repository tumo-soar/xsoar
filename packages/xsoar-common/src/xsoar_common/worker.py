import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel
from xsoar_contracts.envelope import Envelope
from xsoar_contracts.task_playbook import TaskPlaybook
from xsoar_contracts.task_result import TaskResult

from xsoar_common.envelope import make_envelope
from xsoar_common.lifecycle import wait_for_stop
from xsoar_common.mq import Publisher, connect, consume, declare_topology, playbook_queue
from xsoar_common.mq.topology import RESULTS_EXCHANGE

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Playbook:
    id: str
    timeout: float
    input: type[BaseModel]
    run: Callable[[Any], Awaitable[BaseModel]]


def playbook(id: str, timeout: float, input: type[BaseModel]) -> Callable[..., Playbook]:
    def register(run: Callable[[Any], Awaitable[BaseModel]]) -> Playbook:
        return Playbook(id, timeout, input, run)

    return register


async def execute(pb: Playbook, task: TaskPlaybook) -> TaskResult:
    """Never raises: any failure becomes a result with status failed."""
    base = {"task_id": task.task_id, "run_id": task.run_id, "playbook": task.playbook}
    try:
        output = await asyncio.wait_for(
            pb.run(pb.input.model_validate(task.input)), timeout=pb.timeout
        )
        return TaskResult(**base, status="ok", output=output.model_dump(mode="json"))
    except TimeoutError:
        return TaskResult(**base, status="failed", error=f"timeout after {pb.timeout:.0f}s")
    except Exception as exc:
        log.exception("playbook %s failed, task %s", pb.id, task.task_id)
        return TaskResult(**base, status="failed", error=f"{type(exc).__name__}: {exc}")


async def handle_task(pb: Playbook, publisher: Publisher, body: bytes) -> None:
    """Returns after the result is confirmed by the broker; only then the caller acks the task."""
    envelope = Envelope.model_validate_json(body)
    task = TaskPlaybook.model_validate(envelope.payload)
    result = await execute(pb, task)
    out = make_envelope("task.result", task.alert_id, result, task.run_id, task.task_id)
    await publisher.publish(RESULTS_EXCHANGE, "playbook.done", out.model_dump_json(), out.message_id)


async def run_worker(playbooks: list[Playbook], rabbitmq_url: str, prefetch: int) -> None:
    by_id = {pb.id: pb for pb in playbooks}
    async with await connect(rabbitmq_url) as connection:
        setup = await connection.channel()
        await declare_topology(setup, by_id)
        publisher = Publisher(await connection.channel())

        for pb in playbooks:
            channel = await connection.channel()

            async def handler(body: bytes, pb: Playbook = pb) -> None:
                await handle_task(pb, publisher, body)

            await consume(channel, playbook_queue(pb.id), handler, prefetch)
            log.info("consuming %s, prefetch %d", playbook_queue(pb.id), prefetch)

        await wait_for_stop()
        log.info("stopping")
