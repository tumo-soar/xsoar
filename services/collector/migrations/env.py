import asyncio
import os

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

SCHEMA = "collector"


def run_migrations(connection) -> None:
    context.configure(connection=connection, version_table_schema=SCHEMA)
    with context.begin_transaction():
        context.run_migrations()


async def main() -> None:
    engine = create_async_engine(os.environ["DATABASE_URL"], poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(run_migrations)
    await engine.dispose()


asyncio.run(main())
