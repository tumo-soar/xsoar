from alembic import op

revision = "0002"
down_revision = "0001"


def upgrade() -> None:
    op.execute("""
        -- Read-only contract for the api service. Add columns freely;
        -- removing or renaming a column breaks the api.
        CREATE VIEW orchestrator.api_alerts AS
        SELECT alert_id, number, source, labels, filename, status, report, error,
               received_at, updated_at
        FROM orchestrator.alerts
    """)
    op.execute("GRANT USAGE ON SCHEMA orchestrator TO svc_api")
    op.execute("GRANT SELECT ON orchestrator.api_alerts TO svc_api")


def downgrade() -> None:
    op.execute("DROP VIEW orchestrator.api_alerts")
