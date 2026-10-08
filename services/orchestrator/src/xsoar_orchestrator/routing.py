import logging
from typing import Any

log = logging.getLogger(__name__)

ANALYZED = "ANALYZED"
MANUAL_CHECK_REQUIRED = "MANUAL_CHECK_REQUIRED"

START = "p01_ai_validation"
PLAYBOOKS = {"p01_ai_validation"}


def next_step(playbook: str, status: str, output: dict[str, Any] | None) -> str:
    match playbook:
        case "p01_ai_validation":
            if status == "failed":
                return MANUAL_CHECK_REQUIRED
            return ANALYZED
    log.warning("no route after %s", playbook)
    return MANUAL_CHECK_REQUIRED
