import json
import logging

from sqlalchemy import text
from xsoar_common import inbox, outbox
from xsoar_contracts.alert_created import AlertCreated
from xsoar_contracts.envelope import Envelope

from xsoar_orchestrator.runs import SCHEMA, Context, start_run

log = logging.getLogger(__name__)

CONSUMER = "orchestrator.alerts"


async def handle_alert_created(ctx: Context, body: bytes) -> None:
    envelope = Envelope.model_validate_json(body)
    alert = AlertCreated.model_validate(envelope.payload)
    lines = [line for line in alert.text.splitlines() if line.strip()]

    async with ctx.sessions() as session, session.begin():
        if not await inbox.claim(session, SCHEMA, CONSUMER, envelope.message_id):
            log.info("duplicate message %s ignored", envelope.message_id)
            return
        await session.execute(
            text(
                "INSERT INTO orchestrator.alerts "
                "(alert_id, number, source, labels, filename, status, received_at) "
                "VALUES (:alert_id, :number, :source, CAST(:labels AS jsonb), :filename, "
                "'RECEIVED', :received_at)"
            ),
            {
                "alert_id": alert.alert_id,
                "number": alert.number,
                "source": alert.source,
                "labels": json.dumps(alert.labels),
                "filename": alert.filename,
                "received_at": alert.received_at,
            },
        )
        messages = await start_run(session, ctx, alert.alert_id, lines)

    await outbox.publish_now(ctx.sessions, SCHEMA, ctx.publisher, messages)
    log.info("alert ALR-%06d: analysis started", alert.number)
