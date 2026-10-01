import json
from typing import Literal

from pydantic import BaseModel, Field

from config.settings import model_name
from contract.models import Fact, ValidationResult


class AIAnswer(BaseModel):
    summary: str
    assessment: Literal["suspicious", "benign", "unclear"]
    confidence: float = Field(ge=0, le=1)
    facts: list[Fact] = []
    open_questions: list[str] = []


def extract_json(text: str) -> dict:
    # models sometimes wrap JSON in ```json ... ```
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"AI answer contains no JSON: {text[:200]!r}")
    return json.loads(text[start:end + 1])


def _normalize(s: str) -> str:
    return " ".join(s.split()).lower()


def check_grounding(facts: list[Fact], lines: list[str]) -> tuple[list[Fact], list[Fact]]:
    verified, unverified = [], []
    for fact in facts:
        in_range = 1 <= fact.line <= len(lines)
        quote = _normalize(fact.quote)
        if in_range and quote and quote in _normalize(lines[fact.line - 1]):
            verified.append(fact)
        else:
            unverified.append(fact)
    return verified, unverified


def build_result(alert_id: str, raw_answer: str, lines: list[str]) -> ValidationResult:
    answer = AIAnswer.model_validate(extract_json(raw_answer))
    verified, unverified = check_grounding(answer.facts, lines)

    questions = list(answer.open_questions)
    if unverified:
        questions.append(f"AI cited {len(unverified)} fact(s) that were not found in the log, verify manually.")

    return ValidationResult(
        alert_id=alert_id,
        status="ok",
        summary=answer.summary,
        assessment=answer.assessment,
        confidence=answer.confidence,
        facts=verified,
        unverified_facts=unverified,
        open_questions=questions,
        model=model_name(),
    )
