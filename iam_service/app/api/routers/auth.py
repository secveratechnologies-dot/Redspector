from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db
from app.domain.schemas import Login, Token, RefreshRequest
from app.services.auth_service import authenticate_user, refresh_access_token
from app.core.exceptions import AuthenticationFailedException, InvalidTokenException

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(login_data: Login, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and return access and refresh tokens.
    """
    try:
        return await authenticate_user(db, login_data)
    except AuthenticationFailedException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/refresh", response_model=Token)
async def refresh(refresh_data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Refresh an access token using a valid refresh token.
    """
    try:
        return await refresh_access_token(db, refresh_data.refresh_token)
    except (InvalidTokenException, AuthenticationFailedException) as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
