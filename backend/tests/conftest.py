"""Test fixtures and configuration."""

import tempfile
from pathlib import Path

import pytest

from training_status.config import Settings
from training_status.database import Database


# Minimal snapshot dict matching INSERT_SNAPSHOT named parameters.
SNAPSHOT_DATA = {
    "recorded_at": "2026-02-19T10:00:00",
    "ctl": 45.0, "atl": 40.0, "tsb": 5.0, "ramp_rate": 1.5, "ac_ratio": 0.9,
    "resting_hr": 50, "hrv": 55.0, "hrv_sdnn": None, "sleep_secs": 28800,
    "sleep_quality": 1, "rest_days": 0, "monotony": 1.2, "training_strain": None,
    "vo2max": 53.0, "sleep_score": 80.0, "steps": 8000, "spo2": None,
    "stress": None, "readiness": None, "weight": None, "body_fat": None,
    "mood": None, "motivation": None, "fatigue": None, "soreness": None, "comments": None,
    "elevation_gain_m": None, "avg_cadence": 90.0, "max_hr": None,
    "hr_zone_z1_secs": None, "hr_zone_z2_secs": None, "hr_zone_z3_secs": None,
    "hr_zone_z4_secs": None, "hr_zone_z5_secs": None, "icu_rpe": None, "feel": None,
    "critical_speed": 3.5, "d_prime": 200.0,
    "total_distance_km": 2100.0, "run_count": 310, "longest_run_km": 30.0, "avg_pace": "5:30",
    "week_0_km": 35.0, "week_1_km": 38.0, "week_2_km": 40.0, "week_3_km": 36.0,
    "week_4_km": 42.0, "last_month_km": 160.0,
    "longest_streak": 21, "longest_streak_date": "2025-12-01",
    "longest_break_days": 5, "longest_break_date": "2025-06-15",
    "avg_days_run_per_week": 5.5, "days_run_am": 150, "days_run_pm": 100,
    "days_run_both": 10, "most_often_run_day": "Saturday",
    "weather_temp": 8.0, "weather_temp_feels_like": 5.0, "weather_humidity": 75,
    "weather_wind_speed": 10.0, "weather_type": "Cloudy",
    "intervals_json": "{}", "smashrun_json": "{}",
}


@pytest.fixture
def temp_db():
    """Create a temporary database for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        db = Database(db_path)
        db.init_schema()
        yield db


@pytest.fixture
def mock_settings():
    """Create mock settings for testing."""
    return Settings(
        intervals_id="test_id",
        intervals_api_key="test_key",
        smashrun_token="test_token",
    )
