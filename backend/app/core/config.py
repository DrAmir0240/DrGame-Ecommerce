import json
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DrGame E-Commerce Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Ports
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # PostgreSQL Database
    DATABASE_URL: str = "postgresql+asyncpg://drgame_user:drgame_secure_pass_2026@db:5432/drgame_db"

    # Redis Cache
    REDIS_URL: str = "redis://cache:6379/0"

    # Security & JWT
    JWT_SECRET_KEY: str = "drgame_super_secret_jwt_key_development_only_2026_cosmic_purple"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # RAWG API
    RAWG_API_KEY: str = "mock_key"
    RAWG_BASE_URL: str = "https://api.rawg.io/api"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
