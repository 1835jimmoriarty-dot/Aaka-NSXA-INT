from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Technology(Base):
    __tablename__ = "technologies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), default="General") # 'Web Server', 'Framework', 'OS', 'Database', 'Security', 'Library'
    version = Column(String(100), nullable=True)
    confidence = Column(Float, default=1.0)
    detected_by = Column(String(100), default="nmap")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="technologies")
    host = relationship("Host", back_populates="technologies")
