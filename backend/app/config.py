from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/farmdirect"

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"

    # JWT / Security
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Payment Gateway (PG)
    PG_MERCHANT_ID: str = ""
    PG_API_KEY: str = ""
    PG_API_SECRET: str = ""
    PG_BASE_URL: str = "https://api.portone.io"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
        "exp://localhost:19000",
    ]

    # App
    APP_NAME: str = "FarmDirect API"
    DEBUG: bool = False

    # Service layer: when False, all external services use dummy implementations
    USE_REAL_SERVICES: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
