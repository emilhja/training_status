"""Centralized configuration management."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Credentials
    intervals_id: str
    intervals_api_key: str
    smashrun_token: str

    # Strava (optional)
    strava_client_id: str | None = None
    strava_client_secret: str | None = None
    strava_refresh_token: str | None = None

    # Paths
    base_dir: Path = Path(__file__).parent.parent.parent.parent
    db_path: Path = base_dir / "data" / "training_status.db"

    # Reports
    reports_dir: Path = base_dir / "data" / "reports"

    # Scheduler
    # Cron expression for automated daily fetch. Default: 6:00 AM every day.
    # Set to empty string "" to disable the scheduler.
    fetch_schedule: str = "0 6 * * *"
    # Cron expression for weekly PDF report. Default: Monday 7:00 AM.
    report_schedule: str = "0 7 * * 1"

    # API Settings
    # cors_origins is only relevant in dev mode (Vite on :5173 → uvicorn on :8000).
    # In production uvicorn serves the built frontend from the same origin, so
    # browser requests never cross origins and CORS headers have no effect.
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
    return Settings()  # type: ignore[call-arg]
