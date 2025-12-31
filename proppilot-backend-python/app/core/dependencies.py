from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import AuthenticationException
from app.core.security import extract_email_from_token
from app.database import get_db

settings = get_settings()
security = HTTPBearer(auto_error=False)


async def get_current_user_email(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    """Extract and validate current user's email from JWT token."""
    # In local dev mode, return the configured dev email
    if settings.is_local:
        return settings.local_dev_email

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        email = extract_email_from_token(credentials.credentials)
        return email
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.message),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    email: Annotated[str, Depends(get_current_user_email)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get current user from database by email."""
    from app.domain.users.models import User

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_id(
    email: Annotated[str, Depends(get_current_user_email)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> int:
    """Get current user's ID from database."""
    from app.domain.users.models import User

    result = await db.execute(select(User.id).where(User.email == email))
    user_id = result.scalar_one_or_none()

    if user_id is None:
        # In local mode, create user if not exists
        if settings.is_local:
            from app.domain.users.models import User
            import hashlib

            new_user = User(
                email=email,
                full_name="Local Developer",
                provider="local",
                provider_id=hashlib.sha256(email.encode()).hexdigest(),
            )
            db.add(new_user)
            await db.flush()
            return new_user.id

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


# Type aliases for cleaner dependency injection
CurrentUserEmail = Annotated[str, Depends(get_current_user_email)]
CurrentUserId = Annotated[int, Depends(get_current_user_id)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
