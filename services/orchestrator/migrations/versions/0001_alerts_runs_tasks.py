from alembic import op

revision = "0001"
down_revision = None

STATUSES = (
    "RECEIVED",
    "ANALYZING",
    "ANALYZED",
    "MANUAL_CHECK_REQUIRED",
    "DISMISSED",
    "ESCALATED",
    "SUPPRESSED",
)


def upgrade() -> None:
    statuses = ", ".join(f"'{s}'" for s in STATUSES)
    op.execute(f"""
        CREATE TABLE orchestrator.alerts (
            alert_id    uuid PRIMARY KEY,
            number      bigint      NOT NULL UNIQUE,
            source      text        NOT NULL,
            labels      jsonb       NOT NULL,
            filename    text,
            status      text        NOT NULL CHECK (status IN ({statuses})),
            report      jsonb,
            error       text,
            received_at timestamptz NOT NULL,
            updated_at  timestamptz NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ON orchestrator.alerts (source, received_at DESC)")

    op.execute("""
        CREATE TABLE orchestrator.runs (
            run_id        uuid PRIMARY KEY,
            alert_id      uuid        NOT NULL REFERENCES orchestrator.alerts,
            route_id      text        NOT NULL,
            route_version int         NOT NULL,
            status        text        NOT NULL,
            result        text,
            started_at    timestamptz NOT NULL DEFAULT now(),
            finished_at   timestamptz
        )
    """)
    op.execute("""
        CREATE TABLE orchestrator.tasks (
            task_id     uuid PRIMARY KEY,
            run_id      uuid        NOT NULL REFERENCES orchestrator.runs,
            playbook    text        NOT NULL,
            status      text        NOT NULL,
            input       jsonb       NOT NULL,
            output      jsonb,
            error       text,
            queued_at   timestamptz NOT NULL DEFAULT now(),
            deadline_at timestamptz NOT NULL,
            finished_at timestamptz,
            UNIQUE (run_id, playbook)
        )
    """)
    op.execute("CREATE INDEX ON orchestrator.tasks (deadline_at) WHERE status = 'QUEUED'")

    op.execute("""
        CREATE TABLE orchestrator.outbox (
            message_id   uuid PRIMARY KEY,
            exchange     text        NOT NULL,
            routing_key  text        NOT NULL,
            body         jsonb       NOT NULL,
            created_at   timestamptz NOT NULL DEFAULT now(),
            published_at timestamptz
        )
    """)
    op.execute("CREATE INDEX ON orchestrator.outbox (created_at) WHERE published_at IS NULL")
    op.execute("""
        CREATE TABLE orchestrator.inbox (
            consumer     text        NOT NULL,
            message_id   uuid        NOT NULL,
            processed_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (consumer, message_id)
        )
    """)


def downgrade() -> None:
    for table in ("inbox", "outbox", "tasks", "runs", "alerts"):
        op.execute(f"DROP TABLE orchestrator.{table}")
