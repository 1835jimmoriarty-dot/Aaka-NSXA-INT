from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Project, Host, Port, Finding
from app.reports.pdf_report import PDFReportGenerator
from app.reports.json_report import JSONReportGenerator
from app.reports.csv_report import CSVReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports"])

def _build_project_data(project_id: int, db: Session) -> Dict[str, Any]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    hosts = []
    for h in project.hosts:
        ports = [{
            "port_number": p.port_number,
            "protocol": p.protocol,
            "state": p.state,
            "service_name": p.service_name,
            "service_product": p.service_product,
            "service_version": p.service_version
        } for p in h.ports]
        
        hosts.append({
            "id": h.id,
            "ip": h.ip,
            "hostname": h.hostname,
            "status": h.status,
            "os_name": h.os_name,
            "os_family": h.os_family,
            "mac_address": h.mac_address,
            "mac_vendor": h.mac_vendor,
            "risk_score": h.risk_score,
            "risk_level": h.risk_level,
            "ports": ports
        })

    findings = []
    for f in project.findings:
        findings.append({
            "id": f.id,
            "host_id": f.host_id,
            "host_ip": f.host.ip if f.host else "",
            "port_number": f.port.port_number if f.port else "",
            "title": f.title,
            "cve_id": f.cve_id,
            "severity": f.severity,
            "cvss_score": f.cvss_score,
            "confidence": f.confidence,
            "source_tool": f.source_tool,
            "status": f.status,
            "evidence": f.evidence
        })

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "hosts": hosts,
        "findings": findings
    }

@router.get("/{project_id}/pdf")
def export_pdf_report(project_id: int, db: Session = Depends(get_db)):
    data = _build_project_data(project_id, db)
    pdf_bytes = PDFReportGenerator.generate_report(data)
    filename = f"AAKA_NSXA_Assessment_{project_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{project_id}/json")
def export_json_report(project_id: int, db: Session = Depends(get_db)):
    data = _build_project_data(project_id, db)
    json_str = JSONReportGenerator.generate_report(data)
    filename = f"AAKA_NSXA_Assessment_{project_id}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{project_id}/csv/findings")
def export_findings_csv(project_id: int, db: Session = Depends(get_db)):
    data = _build_project_data(project_id, db)
    csv_str = CSVReportGenerator.generate_findings_csv(data.get("findings", []))
    filename = f"AAKA_NSXA_Findings_{project_id}.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{project_id}/csv/hosts")
def export_hosts_csv(project_id: int, db: Session = Depends(get_db)):
    data = _build_project_data(project_id, db)
    csv_str = CSVReportGenerator.generate_hosts_csv(data.get("hosts", []))
    filename = f"AAKA_NSXA_Hosts_{project_id}.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
