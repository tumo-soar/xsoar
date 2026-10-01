import logging
import os
from pathlib import Path

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "")
AI_ENABLED = bool(AI_API_KEY and AI_MODEL)
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))
MAX_LOG_LINES = int(os.getenv("MAX_LOG_LINES", "200"))

PROMPT_FILE = Path(__file__).parent / "prompt.txt"
LOG_DIR = Path(__file__).parent.parent / "logs"


def model_name() -> str:
    return f"openrouter:{AI_MODEL or '-'}"


def setup_logging() -> None:
    LOG_DIR.mkdir(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [01-worker] %(levelname)s %(message)s",
        handlers=[logging.StreamHandler(), logging.FileHandler(LOG_DIR / "worker.log", encoding="utf-8")],
    )
