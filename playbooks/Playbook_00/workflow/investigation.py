from dataclasses import dataclass, field
from datetime import datetime, timezone

from contract.models import ValidationResult

READY_FOR_ANALYST = "READY_FOR_ANALYST"
MANUAL_CHECK_REQUIRED = "MANUAL_CHECK_REQUIRED"
REJECTED = "REJECTED"

FUTURE_PLAYBOOKS = ["change_approval", "siem_control", "business_impact_analysis"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class Investigation:
    id: str
    source_file: str
    system: str
    created_at: str
    status: str = "NEW"
    priority: str | None = None
    next_owner: str = "SOC analyst"
    recommendation: str = ""
    steps: list[dict] = field(default_factory=list)
    ai_result: dict | None = None
    finished_at: str | None = None

    def add_step(self, name: str, status: str, details: str = "") -> None:
        self.steps.append({"step": name, "status": status, "details": details, "at": _now()})

    def finish(self, status: str, priority: str | None, recommendation: str) -> None:
        self.status, self.priority, self.recommendation = status, priority, recommendation
        self.finished_at = _now()


def decide(result: ValidationResult | None, threshold: float = 0.7) -> tuple[str, str, str]:
    """Returns (status, priority, recommendation). The final decision is always made by the analyst."""
    if result is None or result.status == "failed":
        return (MANUAL_CHECK_REQUIRED, "medium",
                "AI validation could not be performed. The analyst must check the alert manually.")
    if result.assessment == "suspicious" and result.confidence >= threshold:
        return (READY_FOR_ANALYST, "high",
                "AI considers the activity suspicious. Review the facts and decide on escalation.")
    if result.assessment == "benign" and result.confidence >= threshold:
        return (READY_FOR_ANALYST, "low",
                "AI considers the activity benign. The case may be closed after analyst review.")
    return (READY_FOR_ANALYST, "medium",
            "AI could not reach a confident conclusion. Answer the open questions before deciding.")
