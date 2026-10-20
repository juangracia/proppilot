from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    picture_url: str | None = None


class UserCreate(UserBase):
    provider: str
    provider_id: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    provider_id: str
    created_at: datetime
    last_login_at: datetime | None = None

    # Alias for JSON serialization to match Java camelCase
    class Config:
        populate_by_name = True

    @property
    def fullName(self) -> str:
        return self.full_name

    @property
    def pictureUrl(self) -> str | None:
        return self.picture_url

    @property
    def createdAt(self) -> datetime:
        return self.created_at

    @property
    def lastLoginAt(self) -> datetime | None:
        return self.last_login_at

    @property
    def providerId(self) -> str:
        return self.provider_id
