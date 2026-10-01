from config.settings import PROMPT_FILE
from contract.models import Alert
from parser.log_parser import ParsedLog


def build_messages(alert: Alert, parsed: ParsedLog) -> list[dict]:
    # the log is untrusted, don't let it close our marker block
    log_block = parsed.numbered().replace("<<<LOG", "<<LOG").replace("LOG>>>", "LOG>>")

    user_message = (
        f"Alert id: {alert.id}\n"
        f"System: {alert.system}\n"
        f"Alert time: {alert.time.isoformat()}\n"
        f"Source file: {alert.source_file}\n"
        f"Pre-extracted by parser (may be incomplete): "
        f"IPs={parsed.ips}, users={parsed.users}, keywords={parsed.keywords}, "
        f"secrets masked={parsed.redacted}\n\n"
        f"<<<LOG\n{log_block}\nLOG>>>"
    )
    return [
        {"role": "system", "content": PROMPT_FILE.read_text(encoding="utf-8")},
        {"role": "user", "content": user_message},
    ]
