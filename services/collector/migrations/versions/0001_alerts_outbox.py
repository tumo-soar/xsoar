from alembic import op

revision = "0001"
down_revision = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE collector.alerts (
            alert_id     uuid PRIMARY KEY DEFAULT uuidv7(),
            number       bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
            source       text        NOT NULL,
            host         text,
            submitted_by text,
            labels       jsonb       NOT NULL DEFAULT '{}',
            filename     text,
            sha256       text        NOT NULL,
            size_bytes   int         NOT NULL,
            line_count   int         NOT NULL,
            content      text        NOT NULL,
            received_at  timestamptz NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE TABLE collector.outbox (
            message_id   uuid PRIMARY KEY,
            exchange     text        NOT NULL,
            routing_key  text        NOT NULL,
            body         jsonb       NOT NULL,
            created_at   timestamptz NOT NULL DEFAULT now(),
            published_at timestamptz
        )
    """)
    op.execute("CREATE INDEX ON collector.outbox (created_at) WHERE published_at IS NULL")


def downgrade() -> None:
    op.execute("DROP TABLE collector.outbox")
    op.execute("DROP TABLE collector.alerts")
