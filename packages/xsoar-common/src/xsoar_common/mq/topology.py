from collections.abc import Iterable

from aio_pika import ExchangeType
from aio_pika.abc import AbstractChannel

ALERTS_EXCHANGE = "xsoar.alerts"
TASKS_EXCHANGE = "xsoar.tasks"
RESULTS_EXCHANGE = "xsoar.results"
COMMANDS_EXCHANGE = "xsoar.commands"
EVENTS_EXCHANGE = "xsoar.events"
DEAD_LETTER_EXCHANGE = "xsoar.dlx"

ALERTS_QUEUE = "orchestrator.alerts"
RESULTS_QUEUE = "playbooks.done"
COMMANDS_QUEUE = "orchestrator.commands"
EVENTS_QUEUE = "api.events"

# Changing queue arguments breaks redeclaration of an existing queue (PRECONDITION_FAILED).
DELIVERY_LIMIT = 3

EXCHANGES = {
    ALERTS_EXCHANGE: ExchangeType.DIRECT,
    TASKS_EXCHANGE: ExchangeType.DIRECT,
    RESULTS_EXCHANGE: ExchangeType.DIRECT,
    COMMANDS_EXCHANGE: ExchangeType.DIRECT,
    EVENTS_EXCHANGE: ExchangeType.TOPIC,
    DEAD_LETTER_EXCHANGE: ExchangeType.DIRECT,
}


def playbook_queue(playbook_id: str) -> str:
    return f"playbook.{playbook_id}"


async def declare_topology(channel: AbstractChannel, playbooks: Iterable[str]) -> None:
    for name, kind in EXCHANGES.items():
        await channel.declare_exchange(name, kind, durable=True)

    await _declare_queue(channel, ALERTS_QUEUE, ALERTS_EXCHANGE, ["alert.created"])
    await _declare_queue(channel, RESULTS_QUEUE, RESULTS_EXCHANGE, ["playbook.done"])
    await _declare_queue(
        channel, COMMANDS_QUEUE, COMMANDS_EXCHANGE, ["decision.made", "reanalysis.requested"]
    )
    await _declare_queue(channel, EVENTS_QUEUE, EVENTS_EXCHANGE, ["incident.*", "run.*"])

    # The publisher declares playbook queues too: RabbitMQ drops messages with no bound queue.
    for playbook_id in sorted(set(playbooks)):
        name = playbook_queue(playbook_id)
        await _declare_queue(channel, name, TASKS_EXCHANGE, [name])


async def _declare_queue(
    channel: AbstractChannel, name: str, exchange: str, routing_keys: list[str]
) -> None:
    queue = await channel.declare_queue(
        name,
        durable=True,
        arguments={
            "x-queue-type": "quorum",
            "x-delivery-limit": DELIVERY_LIMIT,
            "x-dead-letter-exchange": DEAD_LETTER_EXCHANGE,
            "x-dead-letter-routing-key": name,
        },
    )
    for routing_key in routing_keys:
        await queue.bind(exchange, routing_key=routing_key)

    dlq = await channel.declare_queue(
        f"{name}.dlq", durable=True, arguments={"x-queue-type": "quorum"}
    )
    await dlq.bind(DEAD_LETTER_EXCHANGE, routing_key=name)
