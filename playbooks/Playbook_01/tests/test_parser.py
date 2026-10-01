from parser.log_parser import parse, redact


def test_masks_secrets():
    line, count = redact("export by user=d.petrov api_key=sk_live_123 token: abc Bearer eyJhbGci.x")
    assert "sk_live_123" not in line
    assert "abc" not in line
    assert "eyJhbGci" not in line
    assert count == 3


def test_does_not_mask_ssh_failed_password():
    line, count = redact("Failed password for root from 185.220.101.4 port 51122 ssh2")
    assert count == 0
    assert "root" in line


def test_extracts_ips_and_users():
    parsed = parse([
        "login success user=d.petrov from 10.20.4.17",
        "Failed password for root from 185.220.101.4 port 1 ssh2",
        "Invalid user admin from 185.220.101.4 port 2",
    ])
    assert parsed.ips == ["10.20.4.17", "185.220.101.4"]
    assert parsed.users == ["admin", "d.petrov", "root"]
    assert parsed.numbered().startswith("1: login success")
