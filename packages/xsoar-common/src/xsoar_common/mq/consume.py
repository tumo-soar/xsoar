from collections.abc import Awaitable, Callable

from aio_pika.abc import AbstractChannel, AbstractIncomingMessage

Handler = Callable[[bytes], Awaitable[None]]


async def consume(channel: AbstractChannel, queue: str, handler: Handler, prefetch: int) -> None:
    """Acks after the handler returns. An exception requeues the message; the delivery limit moves it to the DLQ."""
    await channel.set_qos(prefetch_count=prefetch)
    q = await channel.get_queue(queue, ensure=False)

    async def on_message(message: AbstractIncomingMessage) -> None:
        async with message.process(requeue=True):
            await handler(message.body)

    await q.consume(on_message)
