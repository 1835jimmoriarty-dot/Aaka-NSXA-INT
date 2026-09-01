from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Project, Host, Port, Finding
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, DashboardStats

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    include_archived: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if not include_archived:
        query = query.filter(Project.is_archived == False)
    projects = query.order_by(Project.updated_at.desc()).all()

    result = []
    for p in projects:
        hosts = p.hosts
        h_count = len(hosts)
        p_count = db.query(Port).filter(Port.project_id == p.id).count()
        v_count = db.query(Finding).filter(Finding.project_id == p.id).count()
        avg_risk = round(sum(h.risk_score for h in hosts) / h_count, 1) if h_count > 0 else 0.0

        p_dict = {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "is_archived": p.is_archived,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "host_count": h_count,
            "port_count": p_count,
            "vuln_count": v_count,
            "avg_risk_score": avg_risk
        }
        result.append(p_dict)
    return result

@router.post("", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db)
):
    project = Project(
        name=project_in.name,
        description=project_in.description
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "is_archived": project.is_archived,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "host_count": 0,
        "port_count": 0,
        "vuln_count": 0,
        "avg_risk_score": 0.0
    }

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    hosts = project.hosts
    h_count = len(hosts)
    p_count = db.query(Port).filter(Port.project_id == project.id).count()
    v_count = db.query(Finding).filter(Finding.project_id == project.id).count()
    avg_risk = round(sum(h.risk_score for h in hosts) / h_count, 1) if h_count > 0 else 0.0

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "is_archived": project.is_archived,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "host_count": h_count,
        "port_count": p_count,
        "vuln_count": v_count,
        "avg_risk_score": avg_risk
    }

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.is_archived is not None:
        project.is_archived = project_in.is_archived

    db.commit()
    db.refresh(project)
    return get_project(project_id, db)

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"status": "success", "message": f"Project {project_id} deleted"}

@router.get("/{project_id}/dashboard", response_model=DashboardStats)
def get_project_dashboard(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    hosts = project.hosts
    ports = db.query(Port).filter(Port.project_id == project_id).all()
    findings = db.query(Finding).filter(Finding.project_id == project_id).all()

    crit = sum(1 for f in findings if f.severity == "CRITICAL")
    high = sum(1 for f in findings if f.severity == "HIGH")
    med = sum(1 for f in findings if f.severity == "MEDIUM")
    low = sum(1 for f in findings if f.severity == "LOW")
    info = sum(1 for f in findings if f.severity == "INFORMATIONAL")

    open_ports = [p for p in ports if p.state == "open"]
    avg_risk = round(sum(h.risk_score for h in hosts) / len(hosts), 1) if hosts else 0.0

    # Risk level classification
    if avg_risk >= 80:
        r_level = "CRITICAL"
    elif avg_risk >= 60:
        r_level = "HIGH"
    elif avg_risk >= 40:
        r_level = "MEDIUM"
    elif avg_risk > 0:
        r_level = "LOW"
    else:
        r_level = "NONE"

    # Top exposed services
    service_counts = {}
    for p in open_ports:
        s_name = p.service_name or "unknown"
        service_counts[s_name] = service_counts.get(s_name, 0) + 1

    top_services = [{"name": k, "count": v} for k, v in sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:6]]

    # Most vulnerable hosts
    sorted_hosts = sorted(hosts, key=lambda h: h.risk_score, reverse=True)[:5]
    most_vuln = [{
        "id": h.id,
        "ip": h.ip,
        "hostname": h.hostname,
        "risk_score": h.risk_score,
        "risk_level": h.risk_level,
        "open_ports": len([p for p in h.ports if p.state == "open"]),
        "findings_count": len(h.findings)
    } for h in sorted_hosts]

    # Recent discoveries
    recent_discoveries = [{
        "id": h.id,
        "ip": h.ip,
        "hostname": h.hostname,
        "os_name": h.os_name,
        "first_seen": h.first_seen.isoformat(),
        "status": h.status
    } for h in sorted(hosts, key=lambda h: h.first_seen, reverse=True)[:5]]

    from app.models.scan_job import ScanJob
    active_scans = db.query(ScanJob).filter(
        ScanJob.project_id == project_id,
        ScanJob.status.in_(["RUNNING", "QUEUED"])
    ).count()

    return {
        "total_assets": len(hosts) + len(project.targets),
        "hosts_discovered": len(hosts),
        "hosts_online": sum(1 for h in hosts if h.status == "up"),
        "open_ports_count": len(open_ports),
        "total_services": len(set(p.service_name for p in open_ports if p.service_name)),
        "total_vulns": len(findings),
        "critical_findings": crit,
        "high_findings": high,
        "medium_findings": med,
        "low_findings": low,
        "info_findings": info,
        "overall_risk_score": avg_risk,
        "risk_level": r_level,
        "active_scans_count": active_scans,
        "recent_discoveries": recent_discoveries,
        "top_exposed_services": top_services,
        "most_vulnerable_hosts": most_vuln,
        "severity_distribution": {
            "CRITICAL": crit,
            "HIGH": high,
            "MEDIUM": med,
            "LOW": low,
            "INFORMATIONAL": info
        }
    }
