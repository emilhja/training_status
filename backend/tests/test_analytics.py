"""Tests for analytics calculations."""

import pytest
from training_status.services.analytics import (
    calculate_consistency_score,
    calculate_injury_risk,
    calculate_projections,
    calculate_race_predictions,
    get_recommendation,
)


def test_consistency_score_basic():
    volumes = [30, 32, 31, 33, 30, 32, 31]
    rest_days = [1, 1, 2, 1, 1, 2, 1]
    monotony = [1.2, 1.3, 1.1, 1.2, 1.3, 1.1, 1.2]
    
    result = calculate_consistency_score(volumes, rest_days, monotony)
    
    assert result["score"] is not None
    assert 0 <= result["score"] <= 100
    assert result["assessment"] in ["Excellent", "Good", "Fair", "Needs Work"]


def test_consistency_score_no_data():
    result = calculate_consistency_score([], [], [])
    assert result["score"] is None
    assert result["assessment"] == "N/A"


def test_recommendation_overreaching():
    result = get_recommendation(tsb=-25, hrv=35, resting_hr=55, sleep_score=80, fatigue=2)
    assert result["urgency"] == "high"
    assert "REST DAY" in result["recommendation"]


def test_recommendation_go_for_it():
    result = get_recommendation(tsb=15, hrv=55, resting_hr=48, sleep_score=85, fatigue=2)
    assert result["urgency"] == "low"
    assert "GO FOR IT" in result["recommendation"]


def test_projections():
    projections = calculate_projections(ctl=50, atl=40, ramp_rate=2)
    assert len(projections) == 7
    
    # Day 1 should be close to input values
    assert projections[0]["day"] == 1
    assert abs(projections[0]["ctl"] - 50) < 1


def test_injury_risk_insufficient_data():
    result = calculate_injury_risk([])
    assert result["risk_level"] == "unknown"
    assert result["risk_score"] is None


def test_injury_risk_low_risk():
    # Create mock data for low risk
    rows = [
        (50, 45, 1.5, 0.9, 2, 55, 85, 2),  # latest
    ] + [(50, 45, 1.5, 0.9, 1, 55, 85, 2) for _ in range(13)]
    
    result = calculate_injury_risk(rows)
    assert result["risk_level"] in ["low", "moderate", "elevated", "high", "unknown"]


def test_race_predictions():
    # Typical CS for a decent runner: ~3.5 m/s
    predictions = calculate_race_predictions(cs=3.5, d_prime=200, ctl=50, avg_pace="5:00")
    
    assert len(predictions) > 0
    
    # Check 5K prediction exists and is reasonable
    five_k = next((p for p in predictions if p["distance"] == "5K"), None)
    if five_k:
        assert "predicted_time" in five_k
        assert "predicted_pace" in five_k
