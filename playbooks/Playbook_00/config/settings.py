import logging
import os
from pathlib import Path

DATA_DIR = Path(os.getenv("DATA_DIR") or Path(__file__).resolve().parents[3] / "data")
INBOX = DATA_DIR / "inbox"
PROCESSING = DATA_DIR / "processing"
PROCESSED = DATA_DIR / "processed"
FAILED = DATA_DIR / "failed"
RESULTS = DATA_DIR / "results"
ALL_DIRS = [INBOX, PROCESSING, PROCESSED, FAILED, RESULTS]

WORKER_URL = os.getenv("WORKER_URL", "http://localhost:8001")
WORKER_TIMEOUT_SECONDS = float(os.getenv("WORKER_TIMEOUT_SECONDS", "120"))
POLL_SECONDS = float(os.getenv("POLL_SECONDS", "3"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.7"))

LOG_DIR = Path(__file__).parent.parent / "logs"


def setup_logging() -> None:
    LOG_DIR.mkdir(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [00-orchestrator] %(levelname)s %(message)s",
        handlers=[logging.StreamHandler(), logging.FileHandler(LOG_DIR / "orchestrator.log", encoding="utf-8")],
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
