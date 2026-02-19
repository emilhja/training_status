"""Centralized configuration management."""

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Credentials
    intervals_id: str
    intervals_api_key: str
    smashrun_token: str
    
    # Paths
    base_dir: Path = Path(__file__).parent.parent.parent.parent
    db_path: Path = base_dir / "data" / "training_status.db"
    
    # API Settings
    cors_origins: list[str] = ["http://localhost:5173"]
    api_timeout: int = 30
    
    model_config = {
        "env_file": Path(__file__).parent.parent.parent.parent / ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
