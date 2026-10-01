import logging
import time

import httpx

from config.settings import WORKER_TIMEOUT_SECONDS, WORKER_URL
from contract.models import Alert, ValidationResult

log = logging.getLogger("workers")


def wait_for_worker() -> None:
    while True:
        try:
            info = httpx.get(f"{WORKER_URL}/health", timeout=3).json()
            log.info("Playbook_01 is up (ai_enabled=%s)", info.get("ai_enabled"))
            return
        except httpx.HTTPError:
            log.info("waiting for Playbook_01 at %s ...", WORKER_URL)
            time.sleep(2)


def validate_alert(alert: Alert) -> ValidationResult | None:
    try:
        response = httpx.post(
            f"{WORKER_URL}/validate",
            content=alert.model_dump_json(),
            headers={"Content-Type": "application/json"},
            timeout=WORKER_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return ValidationResult.model_validate(response.json())
    except Exception as error:
        log.error("[%s] Playbook_01 unavailable or returned an error: %s", alert.id, error)
        return None
