from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.core.logging import log_buffer

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("")
def get_logs(
    project_id: int = None,
    scan_id: int = None,
    limit: int = Query(200, le=1000)
):
    return log_buffer.get_logs(project_id=project_id, scan_id=scan_id, limit=limit)
