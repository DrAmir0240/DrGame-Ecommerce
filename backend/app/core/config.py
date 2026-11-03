from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "DrGame E-Commerce Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    # Regional & Deployment Mode
    DEPLOYMENT_MODE: str = "domestic"  # "domestic" | "international"
    DEFAULT_CURRENCY: str = "IRT"      # "IRT" | "USDT" | "USD"

    # Database
    POSTGRES_USER: str = "drgame_user"
    POSTGRES_PASSWORD: str = "drgame_secure_pass_2026"
    POSTGRES_DB: str = "drgame_db"
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str | None = None

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis Cache
    REDIS_HOST: str = "cache"
    REDIS_PORT: int = 6379
    REDIS_URL: str | None = None

    @property
    def REDIS_CONNECTION_URL(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Security & JWT
    JWT_SECRET_KEY: str = "drgame_super_secret_jwt_key_development_only_2026_cosmic_purple"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    WEBHOOK_SECRET_KEY: str = "drgame_webhook_hmac_secret_key_2026"

    # RAWG Video Games Database API
    RAWG_API_KEY: str = "91c0c1c9c30c4796bbff63a7471fdfdd"
    RAWG_BASE_URL: str = "https://api.rawg.io/api"

    # IGDB / Twitch OAuth API
    IGDB_CLIENT_ID: str = "755p4548dxlbbe5n6xud3fnw3zjwsd"
    IGDB_CLIENT_SECRET: str = "6fddqp62amcta340bymo4gjd4w2io0"
    IGDB_BASE_URL: str = "https://api.igdb.com/v4"
    IGDB_TOKEN_URL: str = "https://id.twitch.tv/oauth2/token"

    # Liara S3 Object Storage
    LIARA_ENDPOINT: str = "https://storage.c2.liara.site"
    LIARA_BUCKET_NAME: str = "drgame-storage"
    LIARA_ACCESS_KEY: str = "m9rvoec258l68eek"
    LIARA_SECRET_KEY: str = "fb10fbac-cdd6-4ded-b574-4b297c1c678a"
    LIARA_PUBLIC_URL: str | None = "https://drgame-storage.storage.c2.liara.site"

    @property
    def S3_PUBLIC_BASE_URL(self) -> str:
        if self.LIARA_PUBLIC_URL:
            return self.LIARA_PUBLIC_URL.rstrip("/")
        clean_endpoint = self.LIARA_ENDPOINT.replace("https://", "").replace("http://", "").strip("/")
        return f"https://{self.LIARA_BUCKET_NAME}.{clean_endpoint}"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Outbound Proxy Settings (Anti-Censorship Sidecar)
    HTTP_PROXY: str | None = None
    HTTPS_PROXY: str | None = None
    NO_PROXY: str | None = None
    V2RAY_SUB_URL: str | None = None

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
