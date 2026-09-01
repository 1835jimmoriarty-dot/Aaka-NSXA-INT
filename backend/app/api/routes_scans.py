from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import ScanJob, Project, Task
from app.schemas import ScanJobCreate, ScanJobResponse
from app.engine.scanner import ScanOrchestrator
from app.engine.target_validator import TargetValidator

router = APIRouter(prefix="/scans", tags=["Scans"])

SCAN_PROFILES = [
    {
        "id": "quick",
        "name": "Quick Reconnaissance Scan",
        "description": "Fast top-100 port scan with service detection and basic OS detection.",
        "flags": "-F -sV --version-light -T4",
        "recommended": True
    },
    {
        "id": "full",
        "name": "Comprehensive Full-Port Scan",
        "description": "All 65,535 TCP ports with deep version detection and OS fingerprinting.",
        "flags": "-p- -sV -O --version-all -T4",
        "recommended": False
    },
    {
        "id": "service_enum",
        "name": "Service Enumeration & Default Scripts",
        "description": "Detailed service detection with standard NSE scripts for banner and protocol enumeration.",
        "flags": "-sV -sC --version-all -T4",
        "recommended": False
    },
    {
        "id": "vuln_discovery",
        "name": "Vulnerability Discovery & NSE Audit",
        "description": "Executes non-intrusive vulnerability scanning scripts to detect CVEs and flaws.",
        "flags": "-sV --script vuln and not dos -T4",
        "recommended": False
    },
    {
        "id": "custom",
        "name": "Custom Configured Scan",
        "description": "User-defined port ranges, timing parameters, and script selections.",
        "flags": "Custom parameters",
        "recommended": False
    }
]

@router.get("/profiles")
def get_scan_profiles():
    return SCAN_PROFILES

@router.get("", response_model=List[ScanJobResponse])
def list_scans(project_id: int, db: Session = Depends(get_db)):
    return db.query(ScanJob).filter(ScanJob.project_id == project_id).order_by(ScanJob.created_at.desc()).all()

@router.post("", response_model=ScanJobResponse)
async def launch_scan(payload: ScanJobCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate target specification
    val = TargetValidator.validate_single_target(payload.target_spec)
    if not val["valid"]:
        raise HTTPException(status_code=400, detail=f"Invalid target: {val.get('error')}")

    job_name = payload.name or f"{payload.profile.upper()} Scan - {payload.target_spec}"

    job = ScanJob(
        project_id=payload.project_id,
        name=job_name,
        profile=payload.profile,
        target_spec=payload.target_spec,
        raw_arguments=payload.custom_ports,
        status="QUEUED",
        progress=0.0,
        current_stage="Queued in Task Engine"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Launch asynchronous scan execution
    await ScanOrchestrator.start_scan(job.id)
    return job

@router.get("/{scan_id}", response_model=ScanJobResponse)
def get_scan_details(scan_id: int, db: Session = Depends(get_db)):
    job = db.query(ScanJob).filter(ScanJob.id == scan_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Scan job not found")
    return job

@router.post("/{scan_id}/cancel")
async def cancel_scan_job(scan_id: int, db: Session = Depends(get_db)):
    success = await ScanOrchestrator.cancel_scan(scan_id)
    if not success:
        job = db.query(ScanJob).filter(ScanJob.id == scan_id).first()
        if job and job.status == "RUNNING":
            job.status = "CANCELLED"
            db.commit()
    return {"status": "success", "message": f"Scan {scan_id} cancellation requested"}
