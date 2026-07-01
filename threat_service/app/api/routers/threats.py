from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.dependencies import get_db, get_current_tenant_payload
from app.infrastructure.database.models import Vulnerability
from app.domain.schemas import VulnerabilityResponse

router = APIRouter()

@router.get("/", response_model=List[VulnerabilityResponse])
async def list_threats(
    db: AsyncSession = Depends(get_db),
    tenant_payload: dict = Depends(get_current_tenant_payload)
):
    """
    List all vulnerabilities for the authenticated tenant.
    """
    tenant_id = tenant_payload["tenant_id"]
    query = select(Vulnerability).where(Vulnerability.tenant_id == tenant_id)
    result = await db.execute(query)
    vulns = result.scalars().all()
    return vulns
