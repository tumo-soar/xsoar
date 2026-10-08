from alembic import op

revision = "0003"
down_revision = "0002"


def upgrade() -> None:
    op.execute("ALTER TABLE orchestrator.runs DROP COLUMN route_id, DROP COLUMN route_version")


def downgrade() -> None:
    op.execute("""
        ALTER TABLE orchestrator.runs
            ADD COLUMN route_id      text NOT NULL DEFAULT 'alert_triage',
            ADD COLUMN route_version int  NOT NULL DEFAULT 2
    """)
