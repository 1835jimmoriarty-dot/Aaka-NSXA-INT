import os
import time
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.adapters.registry import adapter_registry
from app.schemas import SystemHealthResponse
from app.models import ScanJob

router = APIRouter(prefix="/health", tags=["System Health"])
START_TIME = time.time()

@router.get("", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    tools = adapter_registry.get_health_status()
    nmap_tool = next((t for t in tools if t["name"] == "Nmap"), None)
    nmap_status = nmap_tool["status"] if nmap_tool else "UNAVAILABLE"

    # Database check
    try:
        db.execute(db.query(ScanJob).statement).first()
        db_status = "OPERATIONAL"
    except Exception:
        db_status = "DEGRADED"

    # DB file size
    db_size = 0
    if os.path.exists("./aaka_nsxa.db"):
        db_size = os.path.getsize("./aaka_nsxa.db")

    active_scans = db.query(ScanJob).filter(ScanJob.status.in_(["RUNNING", "QUEUED"])).count()

    overall = "OPERATIONAL"
    if nmap_status != "OPERATIONAL" or db_status != "OPERATIONAL":
        overall = "DEGRADED"

    return SystemHealthResponse(
        status=overall,
        backend_status="OPERATIONAL",
        database_status=db_status,
        nmap_status=nmap_status,
        executor_status="OPERATIONAL",
        websocket_status="OPERATIONAL",
        tools=tools,
        active_scans=active_scans,
        database_size_bytes=db_size,
        uptime_seconds=round(time.time() - START_TIME, 1)
    )
