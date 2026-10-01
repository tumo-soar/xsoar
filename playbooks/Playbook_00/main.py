import logging
import time

from config.settings import ALL_DIRS, FAILED, INBOX, POLL_SECONDS, setup_logging
from orchestrator.engine import handle_file
from orchestrator.watcher import claim_new_files, move_to, recover_unfinished
from workers.ai_validation import wait_for_worker

log = logging.getLogger("main")


def main() -> None:
    setup_logging()
    for folder in ALL_DIRS:
        folder.mkdir(parents=True, exist_ok=True)

    wait_for_worker()
    recover_unfinished()
    log.info("watching %s every %ss", INBOX, POLL_SECONDS)

    while True:
        for path in claim_new_files():
            try:
                handle_file(path)
            except Exception:
                log.exception("unexpected error on %s, moved to failed/", path.name)
                move_to(path, FAILED)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
