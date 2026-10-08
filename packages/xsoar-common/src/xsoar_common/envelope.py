from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel
from xsoar_contracts.envelope import Correlation, Envelope


def make_envelope(
    type: str,
    alert_id: UUID,
    payload: BaseModel,
    run_id: UUID | None = None,
    task_id: UUID | None = None,
) -> Envelope:
    return Envelope(
        v=1,
        message_id=uuid4(),
        type=type,
        occurred_at=datetime.now(UTC),
        correlation=Correlation(alert_id=alert_id, run_id=run_id, task_id=task_id),
        payload=payload.model_dump(mode="json"),
    )
