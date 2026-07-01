from pydantic import BaseModel, UUID4, ConfigDict
from typing import Optional
from datetime import datetime

class VulnerabilityBase(BaseModel):
    asset_value: str
    severity: str
    description: str
    source: str

class VulnerabilityCreate(VulnerabilityBase):
    tenant_id: UUID4

class VulnerabilityResponse(VulnerabilityBase):
    id: UUID4
    tenant_id: UUID4
    discovered_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AssetCreatedEvent(BaseModel):
    event_type: str
    id: UUID4
    tenant_id: UUID4
    type: str
    value: str
