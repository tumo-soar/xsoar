import asyncio
import logging
from dataclasses import asdict, dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from xsoar_contracts.envelope import Envelope

from xsoar_common.mq.publish import Publisher

log = logging.getLogger(__name__)

RELAY_INTERVAL_S = 0.5
RELAY_MIN_AGE_S = 3
RETENTION_DAYS = 7
BATCH = 100

Sessions = async_sessionmaker[AsyncSession]


@dataclass
class OutboxMessage:
    message_id: UUID
    exchange: str
    routing_key: str
    body: str


async def add(
    session: AsyncSession, schema: str, exchange: str, routing_key: str, envelope: Envelope
) -> OutboxMessage:
    message = OutboxMessage(envelope.message_id, exchange, routing_key, envelope.model_dump_json())
    await session.execute(
        text(
            f"INSERT INTO {schema}.outbox (message_id, exchange, routing_key, body) "
            "VALUES (:message_id, :exchange, :routing_key, CAST(:body AS jsonb))"
        ),
        asdict(message),
    )
    return message


async def publish_now(
    sessions: Sessions, schema: str, publisher: Publisher, messages: list[OutboxMessage]
) -> None:
    """Call after the transaction that wrote the messages has committed."""
    for message in messages:
        try:
            await publisher.publish(
                message.exchange, message.routing_key, message.body, message.message_id
            )
            async with sessions() as session, session.begin():
                await session.execute(
                    text(f"UPDATE {schema}.outbox SET published_at = now() WHERE message_id = :id"),
                    {"id": message.message_id},
                )
        except Exception:
            log.warning("immediate publish failed, relay will retry", exc_info=True)


async def relay_loop(sessions: Sessions, schema: str, publisher: Publisher) -> None:
    while True:
        try:
            sent = await _relay_batch(sessions, schema, publisher)
            await asyncio.sleep(0 if sent == BATCH else RELAY_INTERVAL_S)
        except Exception:
            log.exception("outbox relay failed")
            await asyncio.sleep(5)


async def _relay_batch(sessions: Sessions, schema: str, publisher: Publisher) -> int:
    async with sessions() as session, session.begin():
        rows = (
            await session.execute(
                text(
                    f"SELECT message_id, exchange, routing_key, body::text AS body "
                    f"FROM {schema}.outbox "
                    f"WHERE published_at IS NULL "
                    f"AND created_at < now() - make_interval(secs => {RELAY_MIN_AGE_S}) "
                    f"ORDER BY created_at LIMIT {BATCH} FOR UPDATE SKIP LOCKED"
                )
            )
        ).all()
        for row in rows:
            await publisher.publish(row.exchange, row.routing_key, row.body, row.message_id)
        if rows:
            await session.execute(
                text(f"UPDATE {schema}.outbox SET published_at = now() WHERE message_id = ANY(:ids)"),
                {"ids": [r.message_id for r in rows]},
            )
    return len(rows)


async def cleanup_loop(sessions: Sessions, schema: str, has_inbox: bool) -> None:
    age = f"now() - interval '{RETENTION_DAYS} days'"
    while True:
        try:
            async with sessions() as session, session.begin():
                await session.execute(text(f"DELETE FROM {schema}.outbox WHERE published_at < {age}"))
                if has_inbox:
                    await session.execute(text(f"DELETE FROM {schema}.inbox WHERE processed_at < {age}"))
        except Exception:
            log.exception("outbox cleanup failed")
        await asyncio.sleep(24 * 3600)
