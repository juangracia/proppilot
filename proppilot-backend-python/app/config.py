from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "PropPilot API"
    debug: bool = False
    environment: str = "production"

    # Database
    database_url: str = "postgresql+asyncpg://proppilot:proppilot123@localhost:5433/proppilot"

    # JWT
    jwt_secret: str = "dev-secret-key-change-in-production-must-be-32-chars"
    jwt_expiration: int = 86400000  # 24 hours in milliseconds
    jwt_algorithm: str = "HS256"

    # Google OAuth
    google_client_id: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Server
    port: int = 8080
    host: str = "0.0.0.0"

    # Logging
    show_sql: bool = True

    # Local dev
    local_dev_email: str = "juanmgracia@gmail.com"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    @property
    def jwt_expiration_seconds(self) -> int:
        return self.jwt_expiration // 1000


@lru_cache
def get_settings() -> Settings:
    return Settings()
