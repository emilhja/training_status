"""Test fixtures and configuration."""

import tempfile
from pathlib import Path

import pytest

from training_status.config import Settings
from training_status.database import Database


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
