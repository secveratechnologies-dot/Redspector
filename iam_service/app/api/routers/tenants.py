from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.infrastructure.database.session import get_db
from app.domain.schemas import TenantCreate, TenantResponse
from app.services.tenant_service import create_tenant, get_tenant_by_id
from app.core.exceptions import ObjectAlreadyExistsException, ObjectNotFoundException
from app.api.dependencies import get_current_user
from app.infrastructure.database.models import User

router = APIRouter()

@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_new_tenant(tenant_in: TenantCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new tenant (organization). 
    In a real system, this might be restricted to superadmins or be public for signups.
    """
    try:
        return await create_tenant(db, tenant_in)
    except ObjectAlreadyExistsException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

@router.get("/{tenant_id}", response_model=TenantResponse)
async def read_tenant(
    tenant_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get tenant details. Users can only fetch their own tenant in a strict multi-tenant setup.
    """
    # Basic Authorization check
    if current_user.tenant_id != tenant_id and current_user.role != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    try:
        return await get_tenant_by_id(db, tenant_id)
    except ObjectNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
