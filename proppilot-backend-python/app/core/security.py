from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import get_settings
from app.core.exceptions import AuthenticationException

settings = get_settings()


def get_jwt_secret() -> bytes:
    """Get JWT secret, padding if necessary to meet minimum length."""
    secret = settings.jwt_secret.encode("utf-8")
    if len(secret) < 32:
        secret = secret.ljust(32, b"\0")
    return secret


def create_jwt_token(
    email: str,
    name: str | None = None,
    picture: str | None = None,
) -> str:
    """Create a JWT token with the given claims."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "iat": now,
        "exp": now + timedelta(seconds=settings.jwt_expiration_seconds),
    }
    if name:
        payload["name"] = name
    if picture:
        payload["picture"] = picture

    return jwt.encode(payload, get_jwt_secret(), algorithm=settings.jwt_algorithm)


def decode_jwt_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationException("Token has expired")
    except jwt.InvalidTokenError as e:
        raise AuthenticationException(f"Invalid token: {str(e)}")


def extract_email_from_token(token: str) -> str:
    """Extract email from JWT token."""
    payload = decode_jwt_token(token)
    email = payload.get("sub")
    if not email:
        raise AuthenticationException("Token does not contain email")
    return email


def extract_claims_from_token(token: str) -> dict[str, Any]:
    """Extract all claims from JWT token."""
    return decode_jwt_token(token)


def verify_google_token(credential: str) -> dict[str, Any]:
    """Verify Google OAuth token and return user info."""
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "sub": idinfo.get("sub"),  # Google's user ID
        }
    except ValueError as e:
        raise AuthenticationException(f"Invalid Google token: {str(e)}")


def is_token_valid(token: str) -> bool:
    """Check if a JWT token is valid without raising exceptions."""
    try:
        decode_jwt_token(token)
        return True
    except AuthenticationException:
        return False
