from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from uuid import UUID

from app.api.dependencies import get_db, get_current_tenant_payload
from app.domain.schemas import AssetCreate, AssetUpdate, AssetResponse
from app.services import asset_service
from app.core.exceptions import ObjectAlreadyExistsException, ObjectNotFoundException

router = APIRouter()

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_payload: dict = Depends(get_current_tenant_payload),
    asset_in: AssetCreate
) -> Any:
    """
    Create a new asset for the current tenant.
    """
    tenant_id = UUID(tenant_payload["tenant_id"])
    try:
        asset = await asset_service.create_asset(db=db, tenant_id=tenant_id, asset_in=asset_in)
        return asset
    except ObjectAlreadyExistsException as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/", response_model=List[AssetResponse])
async def read_assets(
    db: AsyncSession = Depends(get_db),
    tenant_payload: dict = Depends(get_current_tenant_payload),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve all assets belonging to the current tenant.
    """
    tenant_id = UUID(tenant_payload["tenant_id"])
    assets = await asset_service.get_assets_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)
    return assets

@router.get("/{asset_id}", response_model=AssetResponse)
async def read_asset(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_payload: dict = Depends(get_current_tenant_payload),
    asset_id: UUID
) -> Any:
    """
    Get a specific asset by ID.
    """
    tenant_id = UUID(tenant_payload["tenant_id"])
    try:
        asset = await asset_service.get_asset_by_id(db=db, asset_id=asset_id, tenant_id=tenant_id)
        return asset
    except ObjectNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_payload: dict = Depends(get_current_tenant_payload),
    asset_id: UUID,
    asset_in: AssetUpdate
) -> Any:
    """
    Update an asset's tags or status.
    """
    tenant_id = UUID(tenant_payload["tenant_id"])
    try:
        asset = await asset_service.update_asset(db=db, asset_id=asset_id, tenant_id=tenant_id, asset_in=asset_in)
        return asset
    except ObjectNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_payload: dict = Depends(get_current_tenant_payload),
    asset_id: UUID
) -> None:
    """
    Delete an asset.
    """
    tenant_id = UUID(tenant_payload["tenant_id"])
    try:
        await asset_service.delete_asset(db=db, asset_id=asset_id, tenant_id=tenant_id)
    except ObjectNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
