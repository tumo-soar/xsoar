from uuid import UUID

import aio_pika
from aio_pika.abc import AbstractChannel, AbstractExchange


class Publisher:
    """Persistent messages; publish returns only after the broker has confirmed."""

    def __init__(self, channel: AbstractChannel) -> None:
        self._channel = channel
        self._exchanges: dict[str, AbstractExchange] = {}

    async def publish(
        self, exchange: str, routing_key: str, body: str, message_id: UUID | None = None
    ) -> None:
        if exchange not in self._exchanges:
            self._exchanges[exchange] = await self._channel.get_exchange(exchange, ensure=False)
        message = aio_pika.Message(
            body.encode(),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            message_id=str(message_id) if message_id else None,
        )
        await self._exchanges[exchange].publish(message, routing_key=routing_key)
