from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    credential: str


class LocalAuthRequest(BaseModel):
    email: str  # Allow any email format for local dev mode
    name: str | None = None


class AuthResponse(BaseModel):
    token: str
    email: str
    name: str | None = None
    picture: str | None = None
