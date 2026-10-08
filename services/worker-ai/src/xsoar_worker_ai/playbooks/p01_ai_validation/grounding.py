import json
from typing import Literal

from pydantic import BaseModel, Field
from xsoar_contracts.p01_ai_validation_output import EvidenceItem, Fact


class LLMFact(BaseModel):
    text: str
    lines: list[int]


class LLMAnswer(BaseModel):
    summary: str
    verdict: Literal["suspicious", "benign", "unclear"]
    confidence: float = Field(ge=0, le=1)
    facts: list[LLMFact]
    open_questions: list[str] = []


def parse_answer(raw: str) -> LLMAnswer:
    # some models wrap the JSON in ```json fences
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end < start:
        raise ValueError(f"the answer contains no JSON: {raw[:200]!r}")
    return LLMAnswer.model_validate(json.loads(raw[start : end + 1]))


def ground(answer: LLMAnswer, lines: list[str]) -> list[Fact]:
    """Keeps only the evidence that points at real log lines; a fact with none left is dropped."""
    facts = []
    for fact in answer.facts:
        numbers = sorted({n for n in fact.lines if 1 <= n <= len(lines)})
        if numbers:
            evidence = [EvidenceItem(line=n, text=lines[n - 1]) for n in numbers]
            facts.append(Fact(text=fact.text, evidence=evidence))
    return facts
