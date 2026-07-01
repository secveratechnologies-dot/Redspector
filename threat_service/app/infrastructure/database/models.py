import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()

def get_uuid():
    return uuid.uuid4()

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    asset_value = Column(String, nullable=False, index=True) # e.g., the IP or domain name
    severity = Column(String, nullable=False) # e.g., HIGH, MEDIUM, LOW
    description = Column(String, nullable=False)
    source = Column(String, nullable=False) # e.g., OSINT, NMAP
    
    discovered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
