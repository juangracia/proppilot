from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationException
from app.core.security import create_jwt_token, verify_google_token
from app.domain.auth.schemas import AuthResponse
from app.domain.users.models import User
from app.domain.users.repository import UserRepository


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate_with_google(self, credential: str) -> AuthResponse:
        """Authenticate user with Google OAuth credential."""
        try:
            # Verify Google token
            google_info = verify_google_token(credential)
            email = google_info.get("email")
            name = google_info.get("name")
            picture = google_info.get("picture")
            google_id = google_info.get("sub")

            if not email or not google_id:
                raise AuthenticationException("Invalid Google token: missing email or sub")

            # Find or create user
            user = await self.user_repo.get_by_provider_id(google_id)

            if user is None:
                # Create new user
                user = User(
                    email=email,
                    full_name=name or email,
                    picture_url=picture,
                    provider="google",
                    provider_id=google_id,
                )
                user = await self.user_repo.create(user)
            else:
                # Update existing user
                user.full_name = name or user.full_name
                user.picture_url = picture
                user.last_login_at = datetime.utcnow()
                user = await self.user_repo.update(user)

            # Generate JWT token
            token = create_jwt_token(email, name, picture)

            return AuthResponse(
                token=token,
                email=email,
                name=name,
                picture=picture,
            )

        except AuthenticationException:
            raise
        except Exception as e:
            raise AuthenticationException(f"Failed to authenticate with Google: {str(e)}")

    async def authenticate_local(self, email: str, name: str | None = None) -> AuthResponse:
        """Authenticate user locally (dev mode only)."""
        provider_id = f"local-{hash(email)}"

        # Find or create user
        user = await self.user_repo.get_by_email(email)

        if user is None:
            # Create new user
            user = User(
                email=email,
                full_name=name or email,
                provider="local",
                provider_id=provider_id,
            )
            user = await self.user_repo.create(user)
        else:
            # Update existing user
            if name:
                user.full_name = name
            user.last_login_at = datetime.utcnow()
            user = await self.user_repo.update(user)

        # Generate JWT token
        token = create_jwt_token(email, user.full_name, None)

        return AuthResponse(
            token=token,
            email=email,
            name=user.full_name,
            picture=None,
        )

    async def get_current_user(self, email: str) -> User:
        """Get user by email."""
        user = await self.user_repo.get_by_email(email)
        if user is None:
            raise AuthenticationException("User not found")
        return user
