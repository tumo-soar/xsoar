from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def claim(session: AsyncSession, schema: str, consumer: str, message_id: UUID) -> bool:
    """False means the message was already processed: a duplicate."""
    result = await session.execute(
        text(
            f"INSERT INTO {schema}.inbox (consumer, message_id) VALUES (:consumer, :message_id) "
            "ON CONFLICT DO NOTHING"
        ),
        {"consumer": consumer, "message_id": message_id},
    )
    return result.rowcount == 1
