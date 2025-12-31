from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.dependencies import CurrentUserEmail, DbSession
from app.core.exceptions import AuthenticationException
from app.domain.auth.schemas import AuthResponse, GoogleAuthRequest, LocalAuthRequest
from app.domain.auth.service import AuthService

router = APIRouter()
settings = get_settings()


@router.post("/google", response_model=AuthResponse)
async def authenticate_with_google(
    request: GoogleAuthRequest,
    db: DbSession,
):
    """Authenticate with Google OAuth credential."""
    try:
        service = AuthService(db)
        return await service.authenticate_with_google(request.credential)
    except AuthenticationException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )


@router.post("/local", response_model=AuthResponse)
async def authenticate_local(
    request: LocalAuthRequest,
    db: DbSession,
):
    """Authenticate locally (dev mode only)."""
    if not settings.is_local:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local auth not available in this environment",
        )

    try:
        service = AuthService(db)
        return await service.authenticate_local(request.email, request.name)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Local authentication failed",
        )


@router.get("/me")
async def get_current_user(
    email: CurrentUserEmail,
    db: DbSession,
):
    """Get current authenticated user."""
    try:
        service = AuthService(db)
        user = await service.get_current_user(email)
        return {
            "id": user.id,
            "email": user.email,
            "fullName": user.full_name,
            "pictureUrl": user.picture_url,
            "provider": user.provider,
            "providerId": user.provider_id,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
        }
    except AuthenticationException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
