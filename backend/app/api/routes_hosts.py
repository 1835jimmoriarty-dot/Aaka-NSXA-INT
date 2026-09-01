import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Host, Port, Technology, Finding
from app.schemas import HostResponse, HostDetailResponse

router = APIRouter(prefix="/hosts", tags=["Hosts"])

@router.get("", response_model=List[HostResponse])
def list_hosts(
    project_id: int,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Host).filter(Host.project_id == project_id)
    if status:
        query = query.filter(Host.status == status)
    if risk_level:
        query = query.filter(Host.risk_level == risk_level.upper())
    if search:
        s = f"%{search}%"
        query = query.filter((Host.ip.ilike(s)) | (Host.hostname.ilike(s)) | (Host.os_name.ilike(s)))

    hosts = query.order_by(Host.risk_score.desc()).all()
    results = []
    for h in hosts:
        open_ports = [p for p in h.ports if p.state == "open"]
        results.append({
            "id": h.id,
            "project_id": h.project_id,
            "target_id": h.target_id,
            "ip": h.ip,
            "ipv6": h.ipv6,
            "hostname": h.hostname,
            "domain": h.domain,
            "status": h.status,
            "mac_address": h.mac_address,
            "mac_vendor": h.mac_vendor,
            "os_name": h.os_name,
            "os_family": h.os_family,
            "os_accuracy": h.os_accuracy,
            "os_cpe": h.os_cpe,
            "risk_score": h.risk_score,
            "risk_level": h.risk_level,
            "risk_factors_json": h.risk_factors_json,
            "first_seen": h.first_seen,
            "last_scanned": h.last_scanned,
            "open_port_count": len(open_ports),
            "vuln_count": len(h.findings)
        })
    return results

@router.get("/{host_id}", response_model=HostDetailResponse)
def get_host_details(host_id: int, db: Session = Depends(get_db)):
    host = db.query(Host).filter(Host.id == host_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    open_ports = [p for p in host.ports if p.state == "open"]
    return {
        "id": host.id,
        "project_id": host.project_id,
        "target_id": host.target_id,
        "ip": host.ip,
        "ipv6": host.ipv6,
        "hostname": host.hostname,
        "domain": host.domain,
        "status": host.status,
        "mac_address": host.mac_address,
        "mac_vendor": host.mac_vendor,
        "os_name": host.os_name,
        "os_family": host.os_family,
        "os_accuracy": host.os_accuracy,
        "os_cpe": host.os_cpe,
        "risk_score": host.risk_score,
        "risk_level": host.risk_level,
        "risk_factors_json": host.risk_factors_json,
        "first_seen": host.first_seen,
        "last_scanned": host.last_scanned,
        "open_port_count": len(open_ports),
        "vuln_count": len(host.findings),
        "ports": host.ports,
        "technologies": host.technologies,
        "findings": host.findings
    }

@router.delete("/{host_id}")
def delete_host(host_id: int, db: Session = Depends(get_db)):
    host = db.query(Host).filter(Host.id == host_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    db.delete(host)
    db.commit()
    return {"status": "success", "message": f"Host {host_id} removed"}
