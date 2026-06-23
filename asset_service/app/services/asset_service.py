from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List

from app.infrastructure.database.models import Asset
from app.domain.schemas import AssetCreate, AssetUpdate
from app.core.exceptions import ObjectAlreadyExistsException, ObjectNotFoundException
from app.infrastructure.messaging.kafka_publisher import event_publisher

async def create_asset(db: AsyncSession, tenant_id: UUID, asset_in: AssetCreate) -> Asset:
    db_asset = Asset(
        tenant_id=tenant_id,
        type=asset_in.type.value,
        value=asset_in.value,
        tags=asset_in.tags
    )
    db.add(db_asset)
    try:
        await db.commit()
        await db.refresh(db_asset)
        
        # Publish event
        await event_publisher.publish(
            topic="asset.events",
            event_type="AssetCreated",
            data={
                "id": str(db_asset.id),
                "tenant_id": str(db_asset.tenant_id),
                "type": db_asset.type,
                "value": db_asset.value
            }
        )
        
        return db_asset
    except IntegrityError:
        await db.rollback()
        raise ObjectAlreadyExistsException(f"Asset '{asset_in.value}' already exists for this tenant.")

async def get_assets_by_tenant(db: AsyncSession, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Asset]:
    result = await db.execute(
        select(Asset).where(Asset.tenant_id == tenant_id).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_asset_by_id(db: AsyncSession, asset_id: UUID, tenant_id: UUID) -> Asset:
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.tenant_id == tenant_id)
    )
    asset = result.scalars().first()
    if not asset:
        raise ObjectNotFoundException("Asset not found or you do not have access to it.")
    return asset

async def update_asset(db: AsyncSession, asset_id: UUID, tenant_id: UUID, asset_in: AssetUpdate) -> Asset:
    db_asset = await get_asset_by_id(db, asset_id=asset_id, tenant_id=tenant_id)
    
    update_data = asset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_asset, field, value)
        
    await db.commit()
    await db.refresh(db_asset)
    return db_asset

async def delete_asset(db: AsyncSession, asset_id: UUID, tenant_id: UUID) -> None:
    db_asset = await get_asset_by_id(db, asset_id=asset_id, tenant_id=tenant_id)
    await db.delete(db_asset)
    await db.commit()
    
    # Publish event
    await event_publisher.publish(
        topic="asset.events",
        event_type="AssetDeleted",
        data={
            "id": str(asset_id),
            "tenant_id": str(tenant_id)
        }
    )
