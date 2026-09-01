from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    host_id = Column(Integer, ForeignKey("hosts.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    port_number = Column(Integer, nullable=False, index=True)
    protocol = Column(String(20), default="tcp", nullable=False) # 'tcp', 'udp'
    state = Column(String(50), default="open") # 'open', 'closed', 'filtered', 'open|filtered'
    
    service_name = Column(String(100), nullable=True, index=True)
    service_product = Column(String(255), nullable=True)
    service_version = Column(String(255), nullable=True)
    service_extrainfo = Column(String(512), nullable=True)
    service_cpe = Column(String(255), nullable=True)
    
    script_output_json = Column(Text, default="{}") # JSON dict of script id -> output
    risk_level = Column(String(50), default="LOW")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    host = relationship("Host", back_populates="ports")
    findings = relationship("Finding", back_populates="port", cascade="all, delete-orphan")
