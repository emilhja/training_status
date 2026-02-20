"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError

from training_status.models import GoalCreate, Recommendation, Snapshot


def test_goal_create_valid():
    goal = GoalCreate(goal_type="weekly_km", target_value=50.0)
    assert goal.goal_type == "weekly_km"
    assert goal.target_value == 50.0


def test_goal_create_invalid_type():
    with pytest.raises(ValidationError):
        GoalCreate(goal_type="invalid_type", target_value=50.0)


def test_goal_create_negative_value():
    with pytest.raises(ValidationError):
        GoalCreate(goal_type="weekly_km", target_value=-10.0)


def test_recommendation_valid():
    rec = Recommendation(
        recommendation="Easy run", reason="Recovery day", urgency="low", color="green"
    )
    assert rec.urgency == "low"
    assert rec.color == "green"


def test_recommendation_invalid_urgency():
    with pytest.raises(ValidationError):
        Recommendation(
            recommendation="Easy run",
            reason="Recovery day",
            urgency="extreme",  # invalid
            color="green",
        )


def test_snapshot_optional_fields():
    snapshot = Snapshot(
        id=1,
        recorded_at="2024-01-01T10:00:00",
        ctl=50.0,
        # Many fields omitted - should be None
    )
    assert snapshot.ctl == 50.0
    assert snapshot.atl is None
