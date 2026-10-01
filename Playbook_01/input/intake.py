from config.settings import MAX_LOG_LINES
from contract.models import Alert


def receive(alert: Alert) -> list[str]:
    lines = [line.rstrip() for line in alert.log_lines if line.strip()]
    if not lines:
        raise ValueError("Alert contains no log lines")
    return lines[-MAX_LOG_LINES:]
