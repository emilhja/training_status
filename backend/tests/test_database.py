"""Tests for the database layer."""

import pytest

from training_status.database import Database

from .conftest import SNAPSHOT_DATA

# --- Schema / Init ---


def test_init_schema_creates_tables(temp_db: Database):
    """init_schema() produces the expected tables."""
    with temp_db.connection() as conn:
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        }
    assert "snapshots" in tables
    assert "goals" in tables


def test_double_init_is_idempotent(temp_db: Database):
    """Calling init_schema() twice does not raise or duplicate data."""
    temp_db.init_schema()  # second call
    with temp_db.connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
    assert count == 0


# --- Snapshot CRUD ---


def test_insert_and_retrieve_latest(temp_db: Database):
    """Inserted snapshot is returned by get_latest_snapshot()."""
    row_id = temp_db.insert_snapshot(SNAPSHOT_DATA)
    assert row_id == 1

    row = temp_db.get_latest_snapshot()
    assert row is not None
    d = dict(zip(["id", "recorded_at", "ctl", "atl", "tsb"], row[:5]))
    assert d["ctl"] == pytest.approx(45.0)
    assert d["tsb"] == pytest.approx(5.0)
    assert d["recorded_at"] == "2026-02-19T10:00:00"


def test_get_latest_returns_none_when_empty(temp_db: Database):
    """get_latest_snapshot() returns None with no rows."""
    assert temp_db.get_latest_snapshot() is None


def test_get_snapshots_pagination(temp_db: Database):
    """Pagination (limit/offset) returns correct rows and total."""
    import copy

    for i in range(5):
        data = copy.copy(SNAPSHOT_DATA)
        data["recorded_at"] = f"2026-02-{10 + i:02d}T10:00:00"
        temp_db.insert_snapshot(data)

    total, rows = temp_db.get_snapshots(limit=3, offset=0)
    assert total == 5
    assert len(rows) == 3

    total2, rows2 = temp_db.get_snapshots(limit=3, offset=3)
    assert total2 == 5
    assert len(rows2) == 2


def test_get_snapshots_ordered_newest_first(temp_db: Database):
    """Snapshots are returned newest-first."""
    import copy

    for i in range(3):
        data = copy.copy(SNAPSHOT_DATA)
        data["recorded_at"] = f"2026-02-{15 + i:02d}T10:00:00"
        temp_db.insert_snapshot(data)

    _, rows = temp_db.get_snapshots(limit=10)
    dates = [r[1] for r in rows]  # recorded_at is index 1
    assert dates == sorted(dates, reverse=True)


# --- Analytics query ---


def test_get_snapshots_for_analytics_valid_columns(temp_db: Database):
    """Valid column request returns correct number of rows and values."""
    temp_db.insert_snapshot(SNAPSHOT_DATA)
    rows = temp_db.get_snapshots_for_analytics(columns=["ctl", "atl", "tsb"], limit=5)
    assert len(rows) == 1
    assert rows[0] == (pytest.approx(45.0), pytest.approx(40.0), pytest.approx(5.0))


def test_get_snapshots_for_analytics_rejects_unknown_column(temp_db: Database):
    """Unknown column name raises ValueError before hitting SQLite."""
    with pytest.raises(ValueError, match="Unknown column"):
        temp_db.get_snapshots_for_analytics(columns=["ctl", "drop_table_injection"])


# --- Goals CRUD ---


def test_create_and_list_goals(temp_db: Database):
    """Created goal appears in active goals list."""
    temp_db.create_goal(goal_type="weekly_km", target_value=50.0)
    goals = temp_db.get_active_goals()
    assert len(goals) == 1
    assert goals[0]["goal_type"] == "weekly_km"
    assert goals[0]["target_value"] == pytest.approx(50.0)
    assert goals[0]["is_active"] == 1


def test_deactivate_goal(temp_db: Database):
    """Deactivated goal no longer appears in active goals."""
    temp_db.create_goal(goal_type="monthly_km", target_value=200.0)
    goals_before = temp_db.get_active_goals()
    goal_id = goals_before[0]["id"]

    temp_db.deactivate_goal(goal_id)
    goals_after = temp_db.get_active_goals()
    assert len(goals_after) == 0


def test_multiple_goals_only_active_returned(temp_db: Database):
    """Only active goals are returned; deactivated ones are hidden."""
    temp_db.create_goal(goal_type="weekly_km", target_value=40.0)
    temp_db.create_goal(goal_type="yearly_km", target_value=2000.0)
    goals = temp_db.get_active_goals()
    assert len(goals) == 2

    temp_db.deactivate_goal(goals[0]["id"])
    remaining = temp_db.get_active_goals()
    assert len(remaining) == 1
