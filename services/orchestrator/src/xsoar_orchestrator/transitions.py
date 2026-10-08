import logging

log = logging.getLogger(__name__)

STATUSES = (
    "RECEIVED",
    "ANALYZING",
    "ANALYZED",
    "MANUAL_CHECK_REQUIRED",
    "DISMISSED",
    "ESCALATED",
    "SUPPRESSED",
)

TRANSITIONS = {
    ("RECEIVED", "analysis_started"): "ANALYZING",
    ("ANALYZING", "analyzed"): "ANALYZED",
    ("ANALYZING", "manual_check"): "MANUAL_CHECK_REQUIRED",
}

# What a route ending in this status means for the alert.
ROUTE_END_EVENTS = {"ANALYZED": "analyzed", "MANUAL_CHECK_REQUIRED": "manual_check"}


def transition(status: str, event: str) -> str | None:
    new_status = TRANSITIONS.get((status, event))
    if new_status is None:
        log.warning("invalid transition: %s on %s", event, status)
    return new_status
