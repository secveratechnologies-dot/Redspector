from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional, Any, Dict
import re
from uuid import UUID
from datetime import datetime
from enum import Enum

class AssetType(str, Enum):
    IP = "IP"
    DOMAIN = "DOMAIN"
    WEB_APP = "WEB_APP"
    CLOUD_ACCOUNT = "CLOUD_ACCOUNT"

class AssetCreate(BaseModel):
    type: AssetType
    value: str = Field(..., description="The IP address, domain name, URL, or cloud ARN")
    tags: List[str] = Field(default_factory=list, description="Tags for grouping assets")

    @field_validator("value")
    @classmethod
    def validate_asset_value(cls, v: str, info) -> str:
        v = v.strip().lower()
        asset_type = info.data.get("type")
        
        if asset_type == AssetType.IP:
            # Simple IPv4/IPv6 validation (in production use ipaddress module)
            ipv4_pattern = r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
            if not re.match(ipv4_pattern, v):
                raise ValueError("Invalid IPv4 address format")
                
        elif asset_type == AssetType.DOMAIN:
            domain_pattern = r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$"
            if not re.match(domain_pattern, v):
                raise ValueError("Invalid Domain format")
                
        elif asset_type == AssetType.WEB_APP:
            url_pattern = r"^https?:\/\/[^\s/$.?#].[^\s]*$"
            if not re.match(url_pattern, v):
                raise ValueError("Invalid Web Application URL format")
                
        return v

class AssetUpdate(BaseModel):
    status: Optional[str] = None
    tags: Optional[List[str]] = None

class AssetMetadataResponse(BaseModel):
    id: UUID
    source: str
    data: Dict[str, Any]
    discovered_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AssetResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    type: AssetType
    value: str
    status: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    metadata_items: List[AssetMetadataResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
