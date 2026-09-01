from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    profile = Column(String(100), default="quick") # 'quick', 'full', 'service_enum', 'vuln_discovery', 'custom'
    target_spec = Column(Text, nullable=False)
    
    status = Column(String(50), default="QUEUED", index=True) # 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    progress = Column(Float, default=0.0) # 0 to 100
    current_stage = Column(String(255), default="Initializing")
    
    raw_arguments = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="scan_jobs")
    tasks = relationship("Task", back_populates="scan_job", cascade="all, delete-orphan")

class Task(Base):
    """Subprocess or tool execution unit within a ScanJob"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_job_id = Column(Integer, ForeignKey("scan_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    tool_name = Column(String(100), nullable=False, index=True)
    target = Column(String(512), nullable=False)
    command_line = Column(Text, nullable=False)
    status = Column(String(50), default="QUEUED", index=True) # 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    progress = Column(Float, default=0.0)
    
    stdout_log = Column(Text, default="")
    stderr_log = Column(Text, default="")
    return_code = Column(Integer, nullable=True)
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scan_job = relationship("ScanJob", back_populates="tasks")
