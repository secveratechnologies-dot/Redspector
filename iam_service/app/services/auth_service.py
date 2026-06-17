from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from app.domain.schemas import Login, Token
from app.infrastructure.database.models import RefreshToken
from app.services.user_service import get_user_by_email, get_user_by_id
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import AuthenticationFailedException, InvalidTokenException

async def authenticate_user(db: AsyncSession, login_data: Login) -> Token:
    user = await get_user_by_email(db, login_data.email)
    if not user:
        raise AuthenticationFailedException("Incorrect email or password")
    
    if not verify_password(login_data.password, user.hashed_password):
        raise AuthenticationFailedException("Incorrect email or password")
        
    if not user.is_active:
        raise AuthenticationFailedException("Inactive user")

    return await _issue_tokens(db, user)

async def refresh_access_token(db: AsyncSession, refresh_token_str: str) -> Token:
    try:
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise InvalidTokenException("Invalid token type")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise InvalidTokenException("Invalid token payload")
        user_id = uuid.UUID(user_id_str)
    except Exception:
        raise InvalidTokenException("Could not validate credentials")

    # Check if token exists in DB
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == refresh_token_str))
    db_token = result.scalar_one_or_none()
    
    if not db_token:
        raise InvalidTokenException("Token has been revoked or is invalid")

    user = await get_user_by_id(db, user_id)
    if not user.is_active:
        raise AuthenticationFailedException("Inactive user")

    # Delete the old refresh token (Token Rotation)
    await db.delete(db_token)
    await db.commit()

    return await _issue_tokens(db, user)

async def _issue_tokens(db: AsyncSession, user) -> Token:
    # Generate tokens
    access_token = create_access_token(
        subject=str(user.id), 
        tenant_id=str(user.tenant_id), 
        role=user.role
    )
    refresh_token_str, expires_at = create_refresh_token(subject=str(user.id))
    
    # Store refresh token in DB
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_str, # In a production system with extreme paranoia, hash this before storing
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    await db.commit()
    
    return Token(access_token=access_token, refresh_token=refresh_token_str)
