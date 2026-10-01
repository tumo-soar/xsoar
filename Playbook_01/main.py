import logging

import uvicorn
from fastapi import FastAPI

from ai.client import ask_ai
from ai.prompt import build_messages
from config.settings import AI_ENABLED, model_name, setup_logging
from contract.models import Alert, ValidationResult
from input.intake import receive
from output.result import build_result
from parser.log_parser import parse

setup_logging()
log = logging.getLogger("worker")
app = FastAPI(title="Playbook_01 - AI Alert Validation")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "ai_enabled": AI_ENABLED}


@app.post("/validate", response_model=ValidationResult)
def validate(alert: Alert) -> ValidationResult:
    log.info("[%s] received %d lines from %s", alert.id, len(alert.log_lines), alert.source_file)
    try:
        lines = receive(alert)
        parsed = parse(lines)
        log.info("[%s] parsed: ips=%s users=%s secrets masked=%d",
                 alert.id, parsed.ips, parsed.users, parsed.redacted)
        raw_answer = ask_ai(build_messages(alert, parsed))
        result = build_result(alert.id, raw_answer, parsed.lines)
    except Exception as error:
        log.error("[%s] validation failed: %s", alert.id, error)
        return ValidationResult(alert_id=alert.id, status="failed", error=str(error), model=model_name())

    log.info("[%s] done: %s (confidence %.2f), facts=%d, unverified=%d",
             alert.id, result.assessment, result.confidence, len(result.facts), len(result.unverified_facts))
    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
