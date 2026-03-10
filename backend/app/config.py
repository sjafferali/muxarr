"""
Application configuration module.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = Field(default="Muxarr", description="Application name")
    APP_VERSION: str = Field(default="0.1.0", description="Application version")
    APP_DESCRIPTION: str = Field(
        default="Media track manager for your *arr media library",
        description="Application description",
    )

    # Environment
    ENVIRONMENT: str = Field(default="development", description="Environment name")
    PRODUCTION: bool = Field(default=False, description="Production mode flag")
    DEBUG: bool = Field(default=True, description="Debug mode flag")

    # Server
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    WORKERS: int = Field(default=1, description="Number of worker processes")

    # Security
    SECRET_KEY: str = Field(
        default="change-me-in-production-use-a-long-random-string",
        description="Secret key for encryption",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, description="Access token expiration time in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, description="Refresh token expiration time in days"
    )
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Minimum password length")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format",
    )

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Enable rate limiting")
    RATE_LIMIT_REQUESTS: int = Field(default=100, description="Number of requests allowed")
    RATE_LIMIT_PERIOD: int = Field(default=60, description="Time period in seconds")

    # Radarr
    RADARR_URL: str = Field(default="", description="Radarr server URL")
    RADARR_API_KEY: str = Field(default="", description="Radarr API key")

    # Sonarr
    SONARR_URL: str = Field(default="", description="Sonarr server URL")
    SONARR_API_KEY: str = Field(default="", description="Sonarr API key")

    # External tools
    FFPROBE_PATH: str = Field(default="ffprobe", description="Path to ffprobe binary")
    MKVPROPEDIT_PATH: str = Field(default="mkvpropedit", description="Path to mkvpropedit binary")
    MKVMERGE_PATH: str = Field(default="mkvmerge", description="Path to mkvmerge binary")

    # Testing
    TESTING: bool = Field(default=False, description="Testing mode flag")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Create settings instance
settings = get_settings()
