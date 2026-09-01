from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Task
from app.schemas import TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks Console"])

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    project_id: int,
    scan_job_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.project_id == project_id)
    if scan_job_id:
        query = query.filter(Task.scan_job_id == scan_job_id)
    return query.order_by(Task.created_at.desc()).all()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    return t
