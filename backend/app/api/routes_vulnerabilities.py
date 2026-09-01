from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Finding, Host
from app.schemas import FindingResponse

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities & Findings"])

@router.get("", response_model=List[FindingResponse])
def list_findings(
    project_id: int,
    severity: Optional[str] = None,
    confidence: Optional[str] = None,
    host_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Finding).filter(Finding.project_id == project_id)
    if severity:
        query = query.filter(Finding.severity == severity.upper())
    if confidence:
        query = query.filter(Finding.confidence == confidence.upper())
    if host_id:
        query = query.filter(Finding.host_id == host_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Finding.title.ilike(s)) | (Finding.cve_id.ilike(s)) | (Finding.evidence.ilike(s)))

    return query.order_by(Finding.cvss_score.desc()).all()

@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return f
