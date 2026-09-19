from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/qloop"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/qloop"

    # JWT
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Supabase JWT verification (optional)
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_URL: str = ""

    # OpenAI (optional)
    OPENAI_API_KEY: str = ""

    # App
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]
    MAX_CIRCUIT_QUBITS: int = 10
    MAX_SHOTS: int = 65536
    CODE_EXECUTION_TIMEOUT: int = 30

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
