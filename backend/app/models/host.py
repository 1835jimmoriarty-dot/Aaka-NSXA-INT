from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Host(Base):
    __tablename__ = "hosts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("targets.id", ondelete="SET NULL"), nullable=True, index=True)
    
    ip = Column(String(255), nullable=False, index=True)
    ipv6 = Column(String(255), nullable=True)
    hostname = Column(String(512), nullable=True, index=True)
    domain = Column(String(512), nullable=True)
    status = Column(String(50), default="up") # 'up', 'down', 'filtered'
    
    mac_address = Column(String(100), nullable=True)
    mac_vendor = Column(String(255), nullable=True)
    
    os_name = Column(String(255), nullable=True)
    os_family = Column(String(100), nullable=True)
    os_accuracy = Column(Integer, nullable=True)
    os_cpe = Column(String(255), nullable=True)
    
    risk_score = Column(Float, default=0.0, index=True)
    risk_level = Column(String(50), default="LOW") # 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'
    risk_factors_json = Column(Text, default="[]") # JSON list of strings explaining score
    
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_scanned = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="hosts")
    target = relationship("Target", back_populates="hosts")
    ports = relationship("Port", back_populates="host", cascade="all, delete-orphan")
    technologies = relationship("Technology", back_populates="host", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="host", cascade="all, delete-orphan")
