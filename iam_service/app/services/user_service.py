from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
import uuid

from app.infrastructure.database.models import User
from app.domain.schemas import UserCreate
from app.core.security import get_password_hash
from app.core.exceptions import ObjectAlreadyExistsException, ObjectNotFoundException
from app.services.tenant_service import get_tenant_by_id

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    # Verify tenant exists first
    await get_tenant_by_id(db, user_in.tenant_id)
    
    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        tenant_id=user_in.tenant_id,
        role=user_in.role
    )
    db.add(db_user)
    try:
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError:
        await db.rollback()
        raise ObjectAlreadyExistsException(f"User with email '{user_in.email}' already exists.")

async def get_user_by_email(db: AsyncSession, email: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ObjectNotFoundException("User not found")
    return user
