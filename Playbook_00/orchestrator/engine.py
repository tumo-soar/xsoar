import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from config.settings import CONFIDENCE_THRESHOLD, FAILED, PROCESSED
from contract.models import Alert
from orchestrator.watcher import move_to
from workers.ai_validation import validate_alert
from workflow.investigation import FUTURE_PLAYBOOKS, REJECTED, Investigation, decide
from workflow.report import save_report

log = logging.getLogger("engine")


def system_from_filename(name: str) -> str:
    # orders-api_config-change.log -> orders-api
    stem = Path(name).stem
    return stem.split("_", 1)[0] if "_" in stem else "unknown"


def handle_file(path: Path) -> None:
    content = path.read_text(encoding="utf-8", errors="replace")
    lines = [line for line in content.splitlines() if line.strip()]
    now = datetime.now(timezone.utc)

    inv = Investigation(
        id=f"inv-{now:%Y%m%d-%H%M%S}-{uuid.uuid4().hex[:6]}",
        source_file=path.name,
        system=system_from_filename(path.name),
        created_at=now.isoformat(timespec="seconds"),
    )

    if not lines:
        inv.add_step("alert_check", "failed", "Log file is empty")
        inv.finish(REJECTED, None, "Empty log file, nothing to investigate.")
        save_report(inv)
        move_to(path, FAILED)
        log.warning("[%s] REJECTED: empty file %s", inv.id, path.name)
        return
    inv.add_step("alert_check", "ok", f"id={inv.id}, system={inv.system}, time={inv.created_at}, lines={len(lines)}")

    log.info("[%s] -> Playbook_01 (AI Alert Validation)", inv.id)
    alert = Alert(id=inv.id, system=inv.system, time=now, source_file=path.name, log_lines=lines)
    result = validate_alert(alert)
    if result is None:
        inv.add_step("ai_alert_validation", "failed", "Could not verify: Playbook_01 is unavailable")
    elif result.status == "failed":
        inv.add_step("ai_alert_validation", "failed", f"Could not verify: {result.error}")
    else:
        inv.add_step("ai_alert_validation", "ok", f"{result.assessment}, confidence {result.confidence:.2f}")
    inv.ai_result = result.model_dump() if result else None

    for name in FUTURE_PLAYBOOKS:
        inv.add_step(name, "not_implemented", "Could not verify, playbook not implemented yet")

    status, priority, recommendation = decide(result, CONFIDENCE_THRESHOLD)
    inv.finish(status, priority, recommendation)
    save_report(inv)
    move_to(path, PROCESSED)
    log.info("[%s] %s, priority=%s -> data/results/%s.md", inv.id, status, priority, inv.id)
