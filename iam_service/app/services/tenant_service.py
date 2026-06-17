from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
import uuid

from app.infrastructure.database.models import Tenant
from app.domain.schemas import TenantCreate
from app.core.exceptions import ObjectAlreadyExistsException, ObjectNotFoundException

async def create_tenant(db: AsyncSession, tenant_in: TenantCreate) -> Tenant:
    db_tenant = Tenant(name=tenant_in.name)
    db.add(db_tenant)
    try:
        await db.commit()
        await db.refresh(db_tenant)
        return db_tenant
    except IntegrityError:
        await db.rollback()
        raise ObjectAlreadyExistsException(f"Tenant with name '{tenant_in.name}' already exists.")

async def get_tenant_by_id(db: AsyncSession, tenant_id: uuid.UUID) -> Tenant:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise ObjectNotFoundException("Tenant not found")
    return tenant
