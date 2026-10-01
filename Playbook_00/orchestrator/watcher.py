import logging
import time
from datetime import datetime
from pathlib import Path

from config.settings import INBOX, PROCESSING

log = logging.getLogger("watcher")
SETTLE_SECONDS = 2  # skip files that may still be written


def move_to(path: Path, folder: Path) -> Path:
    target = folder / f"{datetime.now():%Y%m%d-%H%M%S}_{path.name}"
    path.rename(target)
    return target


def claim_new_files() -> list[Path]:
    claimed = []
    for path in sorted(INBOX.glob("*.log")):
        if time.time() - path.stat().st_mtime < SETTLE_SECONDS:
            continue
        target = PROCESSING / path.name
        path.rename(target)
        log.info("new file: %s", path.name)
        claimed.append(target)
    return claimed


def recover_unfinished() -> None:
    for path in PROCESSING.glob("*.log"):
        path.rename(INBOX / path.name)
        log.warning("recovered unfinished file: %s", path.name)
