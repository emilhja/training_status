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
    """limit < 1 is rejected with 422."""
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
    with patch("training_status.cli.generate_report") as mock_report:
        mock_report.return_value = None
        resp = client.post("/api/fetch")
    assert resp.status_code == 200
    body = resp.json()
    assert "success" in body
    assert body["success"] is True
    mock_report.assert_called_once()


def test_fetch_handles_exception(client: TestClient):
    """POST /api/fetch returns success=False when generate_report() raises."""
    with patch("training_status.cli.generate_report", side_effect=RuntimeError("API down")):
        resp = client.post("/api/fetch")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is False
    assert "API down" in body["error"]
