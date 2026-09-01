import pytest
from app.engine.cve_enrichment import CVEEnrichmentEngine
from app.engine.risk_engine import RiskEngine

def test_cve_correlation_apache_rce():
    findings = CVEEnrichmentEngine.correlate_service(
        service_name="http",
        product="Apache httpd",
        version="2.4.49",
        cpe="cpe:/a:apache:http_server:2.4.49"
    )
    assert len(findings) > 0
    f = next((x for x in findings if x["cve_id"] == "CVE-2021-41773"), None)
    assert f is not None
    assert f["severity"] == "CRITICAL"
    assert f["has_exploit"] is True

def test_risk_calculation():
    ports = [
        {"port_number": 80, "state": "open"},
        {"port_number": 445, "state": "open"} # High risk SMB
    ]
    findings = [
        {
            "severity": "CRITICAL",
            "cvss_score": 9.8,
            "confidence": "CONFIRMED",
            "title": "Critical RCE",
            "cve_id": "CVE-2021-41773"
        }
    ]
    score, level, factors = RiskEngine.calculate_host_risk(ports, findings, is_up=True)
    assert score >= 40.0
    assert level in ["HIGH", "CRITICAL"]
    assert any("SMB" in factor for factor in factors)
    assert any("Critical" in factor for factor in factors)
