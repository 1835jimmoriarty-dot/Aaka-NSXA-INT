from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Target, Project
from app.schemas import TargetCreate, TargetResponse
from app.engine.target_validator import TargetValidator

router = APIRouter(prefix="/targets", tags=["Targets"])

@router.post("/validate")
def validate_target_input(payload: Dict[str, str]):
    raw_input = payload.get("raw_input", "")
    return TargetValidator.parse_and_validate_bulk(raw_input)

@router.get("", response_model=List[TargetResponse])
def list_targets(project_id: int, db: Session = Depends(get_db)):
    return db.query(Target).filter(Target.project_id == project_id).order_by(Target.created_at.desc()).all()

@router.post("", response_model=List[TargetResponse])
def add_targets(payload: TargetCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    val_result = TargetValidator.parse_and_validate_bulk(payload.raw_input)
    created_targets = []

    for item in val_result.get("valid_targets", []):
        t = Target(
            project_id=payload.project_id,
            original_input=item["input"],
            target_type=item["type"],
            normalized=item.get("normalized", item["input"]),
            resolved_ip=item.get("resolved_ip"),
            host_count=item.get("host_count", 1),
            is_valid=True
        )
        db.add(t)
        created_targets.append(t)

    for item in val_result.get("invalid_targets", []):
        t = Target(
            project_id=payload.project_id,
            original_input=item["input"],
            target_type=item.get("type", "invalid"),
            normalized=item["input"],
            host_count=0,
            is_valid=False,
            validation_error=item.get("error")
        )
        db.add(t)
        created_targets.append(t)

    db.commit()
    for t in created_targets:
        db.refresh(t)

    return created_targets

@router.delete("/{target_id}")
def delete_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"status": "success", "message": f"Target {target_id} removed"}
