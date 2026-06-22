import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_uuid():
    return uuid.uuid4()

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True) # Enforced by JWT, not FK
    type = Column(String, nullable=False) # e.g. IP, DOMAIN, WEB_APP
    value = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
    tags = Column(JSONB, default=list) # List of strings
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('tenant_id', 'value', name='uix_tenant_asset_value'),
    )

    metadata_items = relationship("AssetMetadata", back_populates="asset", cascade="all, delete-orphan")


class AssetMetadata(Base):
    __tablename__ = "asset_metadata"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=get_uuid)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=False) # e.g., 'user_input', 'nmap', 'subfinder'
    data = Column(JSONB, default=dict) # Arbitrary metadata
    discovered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    asset = relationship("Asset", back_populates="metadata_items")
