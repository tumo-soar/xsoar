"""Data contract shared by Playbook_00 and Playbook_01."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Alert(BaseModel):
    id: str
    system: str
    time: datetime
    source_file: str
    log_lines: list[str] = Field(min_length=1)


class Fact(BaseModel):
    statement: str
    line: int
    quote: str  # exact substring of the log line


class ValidationResult(BaseModel):
    alert_id: str
    status: Literal["ok", "failed"]
    summary: str = ""
    assessment: Literal["suspicious", "benign", "unclear"] = "unclear"
    confidence: float = Field(default=0.0, ge=0, le=1)
    facts: list[Fact] = []
    unverified_facts: list[Fact] = []  # cited by AI but not found in the log
    open_questions: list[str] = []
    model: str = ""
    error: str | None = None
