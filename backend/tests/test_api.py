"""Tests for FastAPI endpoints."""

import copy
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from training_status.api import app
from training_status.database import Database

from .conftest import SNAPSHOT_DATA


@pytest.fixture
def client(temp_db: Database):
    """TestClient with get_db patched to use the temp database."""
    with patch("training_status.api.get_db", return_value=temp_db):
        yield TestClient(app)


@pytest.fixture
def client_with_snapshot(temp_db: Database):
    """TestClient pre-loaded with one snapshot."""
    temp_db.insert_snapshot(SNAPSHOT_DATA)
    with patch("training_status.api.get_db", return_value=temp_db):
        yield TestClient(app)


# --- /api/snapshots/latest ---


def test_latest_snapshot_empty(client: TestClient):
    """Returns 404 when no snapshots exist."""
    response = client.get("/api/snapshots/latest")
    assert response.status_code == 404


def test_latest_snapshot_returns_data(client_with_snapshot: TestClient):
    """Returns 200 and correct snapshot fields."""
    response = client_with_snapshot.get("/api/snapshots/latest")
    assert response.status_code == 200
    body = response.json()
    assert body["ctl"] == pytest.approx(45.0)
    assert body["tsb"] == pytest.approx(5.0)
    assert body["recorded_at"] == "2026-02-19T10:00:00"


# --- /api/snapshots ---


def test_snapshots_empty_list(client: TestClient):
    """Returns paginated response with total=0 and empty items."""
    response = client.get("/api/snapshots")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["items"] == []


def test_snapshots_pagination(temp_db: Database):
    """Limit/offset parameters are respected."""
    for i in range(5):
        data = copy.copy(SNAPSHOT_DATA)
        data["recorded_at"] = f"2026-02-{10 + i:02d}T10:00:00"
        temp_db.insert_snapshot(data)

    with patch("training_status.api.get_db", return_value=temp_db):
        c = TestClient(app)
        r1 = c.get("/api/snapshots?limit=3&offset=0")
        r2 = c.get("/api/snapshots?limit=3&offset=3")

    assert r1.status_code == 200
    assert len(r1.json()["items"]) == 3
    assert r1.json()["total"] == 5

    assert r2.status_code == 200
    assert len(r2.json()["items"]) == 2


def test_snapshots_invalid_limit(client: TestClient):
    """Limit < 1 is rejected with 422."""
    response = client.get("/api/snapshots?limit=0")
    assert response.status_code == 422


# --- /api/goals ---


def test_create_and_list_goals(client: TestClient):
    """POST then GET goals round-trip."""
    resp = client.post("/api/goals", json={"goal_type": "weekly_km", "target_value": 50.0})
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    resp2 = client.get("/api/goals")
    assert resp2.status_code == 200
    items = resp2.json()["items"]
    assert len(items) == 1
    assert items[0]["goal_type"] == "weekly_km"
    assert items[0]["target_value"] == pytest.approx(50.0)


def test_delete_goal(client: TestClient):
    """DELETE deactivates goal; it no longer appears in GET /api/goals."""
    client.post("/api/goals", json={"goal_type": "monthly_km", "target_value": 200.0})
    goal_id = client.get("/api/goals").json()["items"][0]["id"]

    del_resp = client.delete(f"/api/goals/{goal_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    remaining = client.get("/api/goals").json()["items"]
    assert remaining == []


def test_create_goal_invalid_type(client: TestClient):
    """Invalid goal_type is rejected with 422."""
    resp = client.post("/api/goals", json={"goal_type": "daily_km", "target_value": 10.0})
    assert resp.status_code == 422


def test_create_goal_negative_value(client: TestClient):
    """Non-positive target_value is rejected with 422."""
    resp = client.post("/api/goals", json={"goal_type": "weekly_km", "target_value": -5.0})
    assert resp.status_code == 422


# --- /api/export ---


def test_export_json(client_with_snapshot: TestClient):
    """JSON export returns list of snapshots."""
    resp = client_with_snapshot.get("/api/export/json")
    assert resp.status_code == 200
    body = resp.json()
    assert "snapshots" in body
    assert len(body["snapshots"]) == 1


def test_export_csv(client_with_snapshot: TestClient):
    """CSV export returns a text/csv response with a header row."""
    resp = client_with_snapshot.get("/api/export/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    lines = resp.text.strip().splitlines()
    assert len(lines) == 2  # header + 1 data row
    assert "recorded_at" in lines[0]


def test_export_csv_empty(client: TestClient):
    """CSV export with no data returns only the header."""
    resp = client.get("/api/export/csv")
    assert resp.status_code == 200
    lines = resp.text.strip().splitlines()
    assert len(lines) == 1
    assert "recorded_at" in lines[0]


# --- /api/fetch ---


def test_fetch_calls_generate_report(client: TestClient):
    """POST /api/fetch invokes generate_report() and returns a response.

    generate_report is imported lazily inside trigger_fetch, so we patch it
    at its source module (training_status.cli) rather than in the api module.
    """
    import training_status.api as api_module
    api_module._last_fetch_time = 0.0
    with patch("training_status.cli.generate_report") as mock_report:
        mock_report.return_value = None
        resp = client.post("/api/fetch")
    assert resp.status_code == 200
    body = resp.json()
    assert "success" in body
    assert body["success"] is True
    mock_report.assert_called_once()
    api_module._last_fetch_time = 0.0


def test_fetch_handles_exception(client: TestClient):
    """POST /api/fetch returns success=False when generate_report() raises."""
    import training_status.api as api_module
    api_module._last_fetch_time = 0.0
    with patch("training_status.cli.generate_report", side_effect=RuntimeError("API down")):
        resp = client.post("/api/fetch")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is False
    assert "API down" in body["error"]
    api_module._last_fetch_time = 0.0


# --- Rate limiting ---


def test_fetch_rate_limit(client: TestClient):
    """Second immediate POST /api/fetch is rejected with 429."""
    import training_status.api as api_module

    # Reset cooldown so first call succeeds
    api_module._last_fetch_time = 0.0
    with patch("training_status.cli.generate_report", return_value=None):
        r1 = client.post("/api/fetch")
    assert r1.status_code == 200

    # Immediately fire again — cooldown not elapsed
    r2 = client.post("/api/fetch")
    assert r2.status_code == 429
    assert "wait" in r2.json()["detail"].lower()

    # Cleanup: reset so other tests are not affected
    api_module._last_fetch_time = 0.0


# --- Authentication (#1 backend side) ---


def test_auth_disabled_when_no_key_set(client_with_snapshot: TestClient):
    """Without APP_API_KEY configured all requests succeed (open LAN mode)."""
    with patch("training_status.api.get_settings") as mock_settings:
        from training_status.config import Settings
        mock_settings.return_value = Settings(
            intervals_id="x", intervals_api_key="x", smashrun_token="x", app_api_key=None
        )
        resp = client_with_snapshot.get("/api/snapshots/latest")
    assert resp.status_code == 200


def test_auth_rejects_missing_key(temp_db: Database):
    """When APP_API_KEY is set, requests without X-API-Key get 401."""
    from training_status.config import Settings

    temp_db.insert_snapshot(SNAPSHOT_DATA)
    settings_with_auth = Settings(
        intervals_id="x", intervals_api_key="x", smashrun_token="x", app_api_key="secret"
    )
    with patch("training_status.api.get_db", return_value=temp_db), \
         patch("training_status.api.get_settings", return_value=settings_with_auth):
        c = TestClient(app)
        resp = c.get("/api/snapshots/latest")
    assert resp.status_code == 401


def test_auth_accepts_correct_key(temp_db: Database):
    """Correct X-API-Key header is accepted."""
    from training_status.config import Settings

    temp_db.insert_snapshot(SNAPSHOT_DATA)
    settings_with_auth = Settings(
        intervals_id="x", intervals_api_key="x", smashrun_token="x", app_api_key="secret"
    )
    with patch("training_status.api.get_db", return_value=temp_db), \
         patch("training_status.api.get_settings", return_value=settings_with_auth):
        c = TestClient(app)
        resp = c.get("/api/snapshots/latest", headers={"X-API-Key": "secret"})
    assert resp.status_code == 200


# --- /api/health (Feature D) ---


def test_health_check_ok(client_with_snapshot: TestClient):
    """GET /api/health returns status=ok with all tables present."""
    resp = client_with_snapshot.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "snapshots" in body["tables"]
    assert body["latest_snapshot_age_hours"] is not None


def test_health_check_no_snapshot(client: TestClient):
    """GET /api/health still returns ok even with no snapshots yet."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["latest_snapshot_age_hours"] is None


# --- Analytics endpoints (#12) ---


def test_readiness_no_data(client: TestClient):
    """GET /api/analytics/readiness returns default when no snapshots."""
    resp = client.get("/api/analytics/readiness")
    assert resp.status_code == 200
    body = resp.json()
    assert "score" in body
    assert "label" in body


def test_readiness_with_data(client_with_snapshot: TestClient):
    """GET /api/analytics/readiness returns a score 0-100 with snapshot data."""
    resp = client_with_snapshot.get("/api/analytics/readiness")
    assert resp.status_code == 200
    body = resp.json()
    assert 0 <= body["score"] <= 100


def test_workout_suggestion_no_data(client: TestClient):
    """GET /api/analytics/workout-suggestion returns a valid suggestion with no data."""
    resp = client.get("/api/analytics/workout-suggestion")
    assert resp.status_code == 200
    body = resp.json()
    assert "type" in body
    assert "title" in body
    assert "duration_min" in body


def test_workout_suggestion_with_data(client_with_snapshot: TestClient):
    """GET /api/analytics/workout-suggestion works with snapshot data."""
    resp = client_with_snapshot.get("/api/analytics/workout-suggestion")
    assert resp.status_code == 200
    body = resp.json()
    assert body["type"] in ("rest", "easy", "moderate", "hard", "race", "long")


def test_overload_no_data(client: TestClient):
    """GET /api/analytics/overload returns empty weeks when no data."""
    resp = client.get("/api/analytics/overload")
    assert resp.status_code == 200
    assert "weeks" in resp.json()


def test_overload_with_data(client_with_snapshot: TestClient):
    """GET /api/analytics/overload returns week-over-week data."""
    resp = client_with_snapshot.get("/api/analytics/overload")
    assert resp.status_code == 200
    body = resp.json()
    assert "safe" in body
    assert "recommendation" in body


def test_zones_no_data(client: TestClient):
    """GET /api/analytics/zones returns empty zones when no HR data."""
    resp = client.get("/api/analytics/zones")
    assert resp.status_code == 200
    body = resp.json()
    assert "hr_zones" in body
    assert "pace_zones" in body


def test_hr_drift_no_data(client: TestClient):
    """GET /api/analytics/hr-drift returns gracefully with no data."""
    resp = client.get("/api/analytics/hr-drift")
    assert resp.status_code == 200
    body = resp.json()
    assert "points" in body
    assert "assessment" in body


def test_sleep_insights_no_data(client: TestClient):
    """GET /api/analytics/sleep-insights returns gracefully with no data."""
    resp = client.get("/api/analytics/sleep-insights")
    assert resp.status_code == 200
    assert "insights" in resp.json()


def test_sleep_insights_with_data(client_with_snapshot: TestClient):
    """GET /api/analytics/sleep-insights returns insights with data."""
    resp = client_with_snapshot.get("/api/analytics/sleep-insights")
    assert resp.status_code == 200
    body = resp.json()
    assert "data_points" in body


def test_taper_valid_date(client_with_snapshot: TestClient):
    """GET /api/analytics/taper returns a schedule for a future race date."""
    resp = client_with_snapshot.get("/api/analytics/taper?race_date=2026-06-01")
    assert resp.status_code == 200
    body = resp.json()
    assert body["race_date"] == "2026-06-01"
    assert "weeks" in body


def test_taper_invalid_model(client_with_snapshot: TestClient):
    """GET /api/analytics/taper rejects an invalid model name with 422."""
    resp = client_with_snapshot.get("/api/analytics/taper?race_date=2026-06-01&model=invalid")
    assert resp.status_code == 422


def test_health_analysis_no_data(client: TestClient):
    """GET /api/analytics/health-analysis returns gracefully with no data."""
    resp = client.get("/api/analytics/health-analysis")
    assert resp.status_code == 200
    body = resp.json()
    assert "readiness_score" in body
    assert "narrative" in body


def test_health_analysis_with_data(client_with_snapshot: TestClient):
    """GET /api/analytics/health-analysis returns full response with data."""
    resp = client_with_snapshot.get("/api/analytics/health-analysis")
    assert resp.status_code == 200
    body = resp.json()
    assert "hrv_trend" in body
    assert "rhr_trend" in body


# --- /api/export/db (Feature E) ---


def test_export_db(client_with_snapshot: TestClient):
    """GET /api/export/db returns the SQLite file."""
    resp = client_with_snapshot.get("/api/export/db")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/x-sqlite3"
    # SQLite files start with this magic header
    assert resp.content[:6] == b"SQLite"


# --- /api/reports/{filename} path traversal guard (#3) ---


def test_report_invalid_filename(client: TestClient):
    """GET /api/reports with non-matching filename returns 400."""
    resp = client.get("/api/reports/not_a_valid_report.txt")
    assert resp.status_code == 400


# --- Annotation metric expansion (Feature C) ---


def test_create_annotation_expanded_metrics(client: TestClient):
    """New annotation metric values are accepted."""
    for metric in ("atl", "resting_hr", "sleep_score", "vo2max", "weight", "week_0_km"):
        resp = client.post("/api/annotations", json={
            "annotation_date": "2026-03-01",
            "metric": metric,
            "content": f"test {metric}",
        })
        assert resp.status_code == 200, f"Failed for metric={metric}: {resp.json()}"


def test_create_annotation_invalid_metric(client: TestClient):
    """Unknown annotation metrics are rejected with 422."""
    resp = client.post("/api/annotations", json={
        "annotation_date": "2026-03-01",
        "metric": "unknown_metric",
        "content": "test",
    })
    assert resp.status_code == 422


# --- Notes snapshot_id (Feature H) ---


def test_create_note_with_snapshot_id(client_with_snapshot: TestClient):
    """POST /api/notes with snapshot_id stores the link."""
    resp = client_with_snapshot.post("/api/notes", json={
        "note_date": "2026-03-01",
        "content": "Felt strong today",
        "snapshot_id": 1,
    })
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    notes = client_with_snapshot.get("/api/notes").json()["items"]
    assert len(notes) == 1
    assert notes[0]["snapshot_id"] == 1


def test_create_note_without_snapshot_id(client: TestClient):
    """POST /api/notes without snapshot_id still works (backward compat)."""
    resp = client.post("/api/notes", json={
        "note_date": "2026-03-01",
        "content": "Easy recovery run",
    })
    assert resp.status_code == 200
