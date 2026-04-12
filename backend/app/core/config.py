from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # No defaults for secrets/credentials — the app MUST fail loudly if .env is missing.
    DATABASE_URL: str
    REDIS_URL: str
    OPENROUTER_API_KEY: str

    # CORS — development default: http://localhost:3000
    # In production: set CORS_ORIGINS to the public frontend domain.
    CORS_ORIGINS: list[AnyHttpUrl] = ["http://localhost:3000"]

    # Security headers
    HTTPS_ENABLED: bool = False

    # Trusted hosts — ALLOWED_HOSTS=* in development, restrict in production.
    ALLOWED_HOSTS: list[str] = ["*"]

    # Rate limiting — sliding window thresholds applied server-wide (no BYOK).
    RATE_LIMIT_REQUESTS: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 60


settings = Settings()
