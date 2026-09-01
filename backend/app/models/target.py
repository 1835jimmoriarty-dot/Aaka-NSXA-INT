from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    original_input = Column(String(512), nullable=False)
    target_type = Column(String(50), nullable=False) # 'ipv4', 'ipv6', 'cidr', 'domain', 'hostname'
    normalized = Column(String(512), nullable=False)
    resolved_ip = Column(String(255), nullable=True)
    host_count = Column(Integer, default=1)
    is_valid = Column(Boolean, default=True)
    validation_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="targets")
    hosts = relationship("Host", back_populates="target")
