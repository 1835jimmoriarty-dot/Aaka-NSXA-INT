import pytest
from app.engine.target_validator import TargetValidator
from app.core.security import is_safe_input_string, sanitize_cli_argument

def test_valid_ipv4():
    res = TargetValidator.validate_single_target("192.168.1.1")
    assert res["valid"] is True
    assert res["type"] == "ipv4"
    assert res["normalized"] == "192.168.1.1"

def test_valid_cidr():
    res = TargetValidator.validate_single_target("10.0.0.0/24")
    assert res["valid"] is True
    assert res["type"] == "cidr"
    assert res["host_count"] == 256

def test_large_cidr_rejected():
    res = TargetValidator.validate_single_target("10.0.0.0/8")
    assert res["valid"] is False
    assert "too large" in res["error"]

def test_valid_domain():
    res = TargetValidator.validate_single_target("scanme.nmap.org")
    assert res["valid"] is True
    assert res["type"] == "domain"

def test_command_injection_rejected():
    res = TargetValidator.validate_single_target("127.0.0.1; whoami")
    assert res["valid"] is False

    res2 = TargetValidator.validate_single_target("127.0.0.1 && cat /etc/passwd")
    assert res2["valid"] is False

    res3 = TargetValidator.validate_single_target("127.0.0.1 | dir")
    assert res3["valid"] is False

def test_bulk_validation():
    raw = """
    192.168.1.1, 10.0.0.0/24
    example.com
    invalid target; cat
    """
    res = TargetValidator.parse_and_validate_bulk(raw)
    assert res["valid"] is False
    assert res["valid_count"] == 3
    assert res["invalid_count"] == 1
