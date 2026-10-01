import json

import pytest
from pydantic import ValidationError

from contract.models import Fact
from output.result import build_result, check_grounding

LINES = [
    "2026-10-01T02:14:41Z WARN config change by user=d.petrov key=payments.verification.enabled new=false",
    "2026-10-01T02:16:55Z INFO order 88412 accepted without payment verification",
]


def test_grounding_separates_invented_facts():
    real = Fact(statement="verification disabled", line=1, quote="key=payments.verification.enabled new=false")
    invented = Fact(statement="attacker IP", line=2, quote="from 6.6.6.6")
    out_of_range = Fact(statement="?", line=99, quote="anything")

    verified, unverified = check_grounding([real, invented, out_of_range], LINES)
    assert verified == [real]
    assert unverified == [invented, out_of_range]


def test_build_result_accepts_json_in_markdown_fence():
    answer = {"summary": "s", "assessment": "suspicious", "confidence": 0.9,
              "facts": [{"statement": "x", "line": 2, "quote": "accepted without payment"}],
              "open_questions": []}
    result = build_result("inv-1", f"```json\n{json.dumps(answer)}\n```", LINES)
    assert result.status == "ok"
    assert len(result.facts) == 1


def test_build_result_rejects_garbage():
    with pytest.raises(ValueError):
        build_result("inv-1", "Sorry, I cannot help with that.", LINES)


def test_build_result_rejects_wrong_format():
    bad = json.dumps({"summary": "s", "assessment": "totally fine", "confidence": 5})
    with pytest.raises(ValidationError):
        build_result("inv-1", bad, LINES)
