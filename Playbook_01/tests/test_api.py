import json

import pytest
from fastapi.testclient import TestClient

import ai.client
import main

client = TestClient(main.app)

ALERT = {
    "id": "inv-test-1",
    "system": "orders-api",
    "time": "2026-10-01T02:20:00Z",
    "source_file": "orders-api_config-change.log",
    "log_lines": [
        "config change by user=d.petrov key=payments.verification.enabled old=true new=false",
        "change request ticket=none",
        "order 88412 accepted without payment verification",
    ],
}

AI_ANSWER = json.dumps({
    "summary": "Payment verification was disabled without a ticket.",
    "assessment": "suspicious",
    "confidence": 0.9,
    "facts": [{"statement": "verification disabled", "line": 1, "quote": "new=false"}],
    "open_questions": ["Who approved the change?"],
})


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_validate_success(monkeypatch):
    monkeypatch.setattr(main, "ask_ai", lambda messages: AI_ANSWER)
    result = client.post("/validate", json=ALERT).json()
    assert result["status"] == "ok"
    assert result["assessment"] == "suspicious"
    assert result["unverified_facts"] == []


def test_ai_not_configured_returns_failed(monkeypatch):
    monkeypatch.setattr(ai.client, "AI_ENABLED", False)
    result = client.post("/validate", json=ALERT).json()
    assert result["status"] == "failed"
    assert "not configured" in result["error"]


def test_ai_outage_returns_failed_not_500(monkeypatch):
    def broken(messages):
        raise RuntimeError("OpenRouter is down")

    monkeypatch.setattr(main, "ask_ai", broken)
    response = client.post("/validate", json=ALERT)
    assert response.status_code == 200
    assert response.json()["status"] == "failed"


@pytest.mark.parametrize("bad", [{"id": "x"}, {**ALERT, "log_lines": []}])
def test_invalid_alert_rejected_by_contract(bad):
    assert client.post("/validate", json=bad).status_code == 422
