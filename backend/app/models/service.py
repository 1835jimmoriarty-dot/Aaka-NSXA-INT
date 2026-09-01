from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(100), nullable=False, index=True)
    product = Column(String(255), nullable=True)
    version = Column(String(255), nullable=True)
    port_count = Column(Integer, default=1)
    host_count = Column(Integer, default=1)
    risk_level = Column(String(50), default="LOW")
    last_detected = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="services")
