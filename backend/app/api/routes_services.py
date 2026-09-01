from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Service, Port
from app.schemas import ServiceResponse

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("", response_model=List[ServiceResponse])
def list_services(
    project_id: int,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.project_id == project_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Service.name.ilike(s)) | (Service.product.ilike(s)))
    return query.order_by(Service.host_count.desc()).all()
