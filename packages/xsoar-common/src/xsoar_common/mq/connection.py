import asyncio
import logging

import aio_pika
from aio_pika.abc import AbstractRobustConnection
from aio_pika.exceptions import AMQPConnectionError

log = logging.getLogger(__name__)


async def connect(url: str) -> AbstractRobustConnection:
    delay = 1.0
    while True:
        try:
            return await aio_pika.connect_robust(url)
        except (AMQPConnectionError, ConnectionError, OSError) as exc:
            log.warning("rabbitmq unavailable (%s), retry in %.0fs", exc, delay)
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30)
