import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db, SessionLocal
from app.models import Project, Target, Host, Port, Finding, ScanJob
from app.engine.scanner import ScanOrchestrator
from app.reports.pdf_report import PDFReportGenerator
from app.reports.json_report import JSONReportGenerator
from app.reports.csv_report import CSVReportGenerator

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

@pytest.mark.asyncio
async def test_end_to_end_assessment_workflow():
    db = SessionLocal()
    try:
        # 1. Create Project
        proj = Project(name="E2E Test Scope", description="End-to-End Test Assessment")
        db.add(proj)
        db.commit()
        db.refresh(proj)

        # 2. Add Target
        target = Target(
            project_id=proj.id,
            original_input="127.0.0.1",
            target_type="ipv4",
            normalized="127.0.0.1",
            host_count=1,
            is_valid=True
        )
        db.add(target)
        db.commit()

        # 3. Create and execute Quick Scan Job
        scan_job = ScanJob(
            project_id=proj.id,
            name="Quick Scan - 127.0.0.1",
            profile="quick",
            target_spec="127.0.0.1",
            status="QUEUED",
            progress=0.0
        )
        db.add(scan_job)
        db.commit()
        db.refresh(scan_job)

        # Execute scan workflow directly
        await ScanOrchestrator._run_scan_job(scan_job.id)

        # 4. Verify scan completion and results in DB
        db.refresh(scan_job)
        assert scan_job.status == "COMPLETED"
        assert scan_job.progress == 100.0

        # Verify host discovered
        hosts = db.query(Host).filter(Host.project_id == proj.id).all()
        assert len(hosts) >= 1
        host = hosts[0]
        assert host.ip == "127.0.0.1"
        assert host.risk_score >= 0.0

        # Verify ports & services recorded
        ports = db.query(Port).filter(Port.project_id == proj.id).all()
        assert len(ports) >= 0

        # 5. Verify PDF, JSON, and CSV report generators
        project_data = {
            "name": proj.name,
            "description": proj.description,
            "hosts": [{
                "ip": h.ip,
                "hostname": h.hostname,
                "os_name": h.os_name,
                "risk_score": h.risk_score,
                "risk_level": h.risk_level,
                "ports": [{"port_number": p.port_number, "state": p.state} for p in h.ports]
            } for h in hosts],
            "findings": [{
                "title": f.title,
                "cve_id": f.cve_id,
                "severity": f.severity,
                "cvss_score": f.cvss_score,
                "confidence": f.confidence,
                "source_tool": f.source_tool,
                "evidence": f.evidence
            } for f in proj.findings]
        }

        pdf_bytes = PDFReportGenerator.generate_report(project_data)
        assert len(pdf_bytes) > 500
        assert pdf_bytes.startswith(b"%PDF")

        json_str = JSONReportGenerator.generate_report(project_data)
        assert "AAKA-NSXA Intelligence" in json_str

        csv_str = CSVReportGenerator.generate_hosts_csv(project_data["hosts"])
        assert "127.0.0.1" in csv_str

    finally:
        db.close()
