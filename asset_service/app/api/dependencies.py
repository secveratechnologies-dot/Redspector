from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.infrastructure.database.session import get_db
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login") # Point to IAM for Swagger UI

async def get_current_tenant_payload(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if "tenant_id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing tenant identification",
            )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
