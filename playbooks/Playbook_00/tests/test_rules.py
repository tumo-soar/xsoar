from contract.models import ValidationResult
from orchestrator.engine import system_from_filename
from workflow.investigation import MANUAL_CHECK_REQUIRED, READY_FOR_ANALYST, decide


def result(assessment="unclear", confidence=0.0, status="ok"):
    return ValidationResult(alert_id="inv-1", status=status, assessment=assessment, confidence=confidence)


def test_worker_unavailable_goes_to_manual_check():
    assert decide(None)[:2] == (MANUAL_CHECK_REQUIRED, "medium")


def test_ai_failed_goes_to_manual_check():
    assert decide(result(status="failed"))[:2] == (MANUAL_CHECK_REQUIRED, "medium")


def test_confident_suspicious_is_high_priority():
    assert decide(result("suspicious", 0.9))[:2] == (READY_FOR_ANALYST, "high")


def test_confident_benign_is_low_priority():
    assert decide(result("benign", 0.9))[:2] == (READY_FOR_ANALYST, "low")


def test_low_confidence_is_medium_priority():
    assert decide(result("suspicious", 0.4))[:2] == (READY_FOR_ANALYST, "medium")


def test_system_from_filename():
    assert system_from_filename("orders-api_config-change.log") == "orders-api"
    assert system_from_filename("random.log") == "unknown"
