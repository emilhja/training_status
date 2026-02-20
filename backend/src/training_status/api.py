"""FastAPI application with all endpoints."""

import csv
import io
import logging
from contextlib import asynccontextmanager, redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import SNAPSHOT_COLUMNS, get_db
from .models import (
    AdherenceReport,
    ConsistencyScore,
    CorrelationsResponse,
    DetrainingResponse,
    FetchResponse,
    GoalCreate,
    GoalList,
    InjuryRisk,
    NoteCreate,
    NoteList,
    PersonalRecordsResponse,
    ProjectionsResponse,
    RacePredictorResponse,
    Recommendation,
    Snapshot,
    SnapshotList,
    StravaStatus,
    SuccessResponse,
    WeeklySummary,
)
from .services.analytics import (
    calculate_consistency_score,
    calculate_detraining,
    calculate_goal_adherence,
    calculate_injury_risk,
    calculate_projections,
    calculate_race_predictions,
    calculate_weekly_summary,
    get_recommendation,
)

logger = logging.getLogger(__name__)

# Determine paths - project root is 3 levels up from api.py (src/training_status/)
BASE_DIR = Path(__file__).parent.parent.parent.parent
DIST_DIR = BASE_DIR / "frontend" / "dist"


def _run_scheduled_fetch() -> None:
    """Run the daily data fetch (called by the background scheduler)."""
    from .cli import generate_report

    try:
        generate_report()
        logger.info("Scheduled fetch completed successfully")
    except Exception as e:
        logger.error("Scheduled fetch failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:  # type: ignore[type-arg]
    """Start/stop the background scheduler on app lifecycle."""
    settings = get_settings()
    scheduler: BackgroundScheduler | None = None

    if settings.fetch_schedule:
        scheduler = BackgroundScheduler()
        # Parse standard 5-field cron: "minute hour day month day_of_week"
        fields = settings.fetch_schedule.split()
        if len(fields) == 5:
            minute, hour, day, month, day_of_week = fields
            scheduler.add_job(
                _run_scheduled_fetch,
                "cron",
                minute=minute,
                hour=hour,
                day=day,
                month=month,
                day_of_week=day_of_week,
                id="daily_fetch",
                replace_existing=True,
            )
            scheduler.start()
            logger.info("Scheduler started — fetch cron: %s", settings.fetch_schedule)
        else:
            logger.warning(
                "Invalid FETCH_SCHEDULE cron '%s' — scheduler disabled",
                settings.fetch_schedule,
            )

    yield

    if scheduler is not None:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")


app = FastAPI(title="Training Status API", lifespan=lifespan)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


def row_to_dict(row: tuple) -> dict[str, Any]:
    """Convert database row to dictionary."""
    return dict(zip(SNAPSHOT_COLUMNS, row))


# --- SNAPSHOT ENDPOINTS ---


@app.get("/api/snapshots/latest", response_model=Snapshot)
def get_latest() -> dict[str, Any]:
    """Get the most recent snapshot."""
    db = get_db()
    row = db.get_latest_snapshot()
    if not row:
        raise HTTPException(status_code=404, detail="No snapshots yet")
    return row_to_dict(row)


@app.get("/api/snapshots", response_model=SnapshotList)
def get_snapshots(
    limit: int = Query(90, ge=1, le=1000), offset: int = Query(0, ge=0)
) -> dict[str, Any]:
    """Get paginated snapshots."""
    db = get_db()
    total, rows = db.get_snapshots(limit=limit, offset=offset)
    return {"total": total, "items": [row_to_dict(r) for r in rows]}


@app.post("/api/fetch", response_model=FetchResponse)
def trigger_fetch() -> dict[str, Any]:
    """Trigger a data fetch from external APIs."""
    from .cli import generate_report

    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    try:
        with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
            generate_report()
        return {
            "success": True,
            "output": stdout_buf.getvalue(),
            "error": stderr_buf.getvalue() or None,
        }
    except Exception as e:
        return {
            "success": False,
            "output": stdout_buf.getvalue(),
            "error": f"{e}\n{stderr_buf.getvalue()}".strip(),
        }


# --- GOALS ENDPOINTS ---


@app.get("/api/goals", response_model=GoalList)
def get_goals() -> dict[str, Any]:
    """Get all active goals."""
    db = get_db()
    rows = db.get_active_goals()
    return {"items": [dict(r) for r in rows]}


@app.post("/api/goals", response_model=SuccessResponse)
def create_goal(goal: GoalCreate) -> dict[str, Any]:
    """Create a new goal."""
    db = get_db()
    db.create_goal(
        goal_type=goal.goal_type, target_value=goal.target_value, period_start=goal.period_start
    )
    return {"success": True}


@app.delete("/api/goals/{goal_id}", response_model=SuccessResponse)
def delete_goal(goal_id: int) -> dict[str, Any]:
    """Deactivate a goal."""
    db = get_db()
    db.deactivate_goal(goal_id)
    return {"success": True}


# --- ANALYTICS ENDPOINTS ---


@app.get("/api/analytics/consistency", response_model=ConsistencyScore)
def get_consistency_score() -> dict[str, Any]:
    """Calculate training consistency score (0-100)."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(columns=["week_0_km", "rest_days", "monotony"], limit=28)

    if len(rows) < 7:
        return {
            "score": None,
            "reason": "Not enough data",
            "assessment": "N/A",
            "volume_score": None,
            "rest_score": None,
            "monotony_score": None,
        }

    volumes = [r[0] for r in rows if r[0] is not None]
    rest_days = [r[1] for r in rows if r[1] is not None]
    monotony_values = [r[2] for r in rows if r[2] is not None]

    return calculate_consistency_score(volumes, rest_days, monotony_values)


@app.get("/api/analytics/recommendation", response_model=Recommendation)
def get_workout_recommendation() -> dict[str, Any]:
    """Get recovery/workout recommendation based on current state."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(
        columns=["tsb", "hrv", "resting_hr", "sleep_score", "fatigue", "soreness"], limit=1
    )

    if not rows:
        return {
            "recommendation": "No data available",
            "reason": "Take a run to get started!",
            "urgency": "low",
            "color": "blue",
        }

    tsb, hrv, resting_hr, sleep_score, fatigue, soreness = rows[0]
    return get_recommendation(tsb, hrv, resting_hr, sleep_score, fatigue)


@app.get("/api/analytics/projections", response_model=ProjectionsResponse)
def get_projections() -> dict[str, Any]:
    """Project fitness/fatigue for next 7 days."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(columns=["ctl", "atl", "tsb", "ramp_rate"], limit=1)

    if not rows:
        return {"projections": [], "debug": "No snapshots found"}

    ctl, atl, tsb, ramp_rate = rows[0]
    if ctl is None or atl is None:
        return {"projections": [], "debug": f"CTL={ctl}, ATL={atl} - missing data"}

    projections, days_to_positive = calculate_projections(ctl, atl, ramp_rate)
    return {
        "projections": projections,
        "current": {"ctl": ctl, "atl": atl, "tsb": tsb},
        "days_to_positive_tsb": days_to_positive,
    }


@app.get("/api/analytics/injury-risk", response_model=InjuryRisk)
def get_injury_risk() -> dict[str, Any]:
    """Calculate injury risk score based on multiple factors."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(
        columns=[
            "ctl",
            "atl",
            "ramp_rate",
            "ac_ratio",
            "rest_days",
            "hrv",
            "sleep_score",
            "fatigue",
        ],
        limit=14,
    )

    return calculate_injury_risk(rows)


@app.get("/api/analytics/correlations", response_model=CorrelationsResponse)
def get_correlations() -> dict[str, Any]:
    """Find correlations in training data."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(
        columns=[
            "week_0_km",
            "hrv",
            "sleep_score",
            "weather_temp",
            "avg_cadence",
            "elevation_gain_m",
            "icu_rpe",
            "feel",
        ],
        limit=30,
    )

    insights = []

    if len(rows) < 10:
        return {
            "insights": [],
            "data_points": len(rows),
            "message": "Need more data for correlation analysis",
        }

    # Extract columns
    volumes = [r[0] for r in rows if r[0] is not None]
    hrvs = [r[1] for r in rows if r[1] is not None]
    sleep_scores = [r[2] for r in rows if r[2] is not None]
    temps = [r[3] for r in rows if r[3] is not None]

    # Correlation 1: Volume vs HRV
    if len(volumes) >= 10 and len(hrvs) >= 10:
        high_vol_days = [i for i, v in enumerate(volumes) if v > 35]
        low_vol_days = [i for i, v in enumerate(volumes) if v < 20]

        if high_vol_days and low_vol_days:
            high_vol_hrv = [hrvs[i] for i in high_vol_days if i < len(hrvs)]
            low_vol_hrv = [hrvs[i] for i in low_vol_days if i < len(hrvs)]

            if high_vol_hrv and low_vol_hrv:
                avg_high = sum(high_vol_hrv) / len(high_vol_hrv)
                avg_low = sum(low_vol_hrv) / len(low_vol_hrv)
                diff_pct = ((avg_low - avg_high) / avg_high) * 100 if avg_high > 0 else 0

                if diff_pct > 10:
                    insights.append(
                        {
                            "type": "volume_recovery",
                            "title": "High Volume Impact",
                            "description": (
                                f"Your HRV is {diff_pct:.0f}% lower after"
                                " high volume weeks (>35km). Consider more recovery."
                            ),
                            "recommendation": "Schedule easier days after high volume",
                        }
                    )

    # Correlation 2: Temperature
    if len(temps) >= 10:
        insights.append(
            {
                "type": "weather",
                "title": "Temperature Sweet Spot",
                "description": (
                    f"You've run in temps from {min(temps):.0f}°C to {max(temps):.0f}°C."
                    " Most runners perform best at 8-15°C."
                ),
                "recommendation": "Adjust pace expectations in extreme temps",
            }
        )

    # Correlation 3: Sleep vs recovery
    if len(sleep_scores) >= 10 and len(hrvs) >= 10:
        good_sleep = [hrvs[i] for i, s in enumerate(sleep_scores) if s > 75 and i < len(hrvs)]
        poor_sleep = [hrvs[i] for i, s in enumerate(sleep_scores) if s < 60 and i < len(hrvs)]

        if good_sleep and poor_sleep:
            avg_good = sum(good_sleep) / len(good_sleep)
            avg_poor = sum(poor_sleep) / len(poor_sleep)
            diff = ((avg_good - avg_poor) / avg_poor) * 100 if avg_poor > 0 else 0

            if diff > 15:
                insights.append(
                    {
                        "type": "sleep_recovery",
                        "title": "Sleep Matters",
                        "description": (
                            f"Good sleep (>75 score) correlates with {diff:.0f}% higher HRV."
                            " Sleep is your superpower!"
                        ),
                        "recommendation": "Prioritize 7+ hours of quality sleep",
                    }
                )

    # Correlation 4: Rest day pattern
    rest_rows = db.get_snapshots_for_analytics(columns=["rest_days", "hrv"], limit=20)
    rest_data = [(r[0], r[1]) for r in rest_rows if r[0] is not None and r[1] is not None]

    if len(rest_data) >= 10:
        after_rest = [hrv for rest, hrv in rest_data if rest == 0]
        after_break = [hrv for rest, hrv in rest_data if rest >= 2]

        if after_rest and after_break and len(after_rest) > 2 and len(after_break) > 2:
            avg_after_rest = sum(after_rest) / len(after_rest)
            avg_after_break = sum(after_break) / len(after_break)

            if avg_after_break > avg_after_rest * 1.1:
                insights.append(
                    {
                        "type": "rest_recovery",
                        "title": "Rest Days Work",
                        "description": (
                            f"HRV is {((avg_after_break / avg_after_rest - 1) * 100):.0f}%"
                            " higher after 2+ rest days. Trust the process!"
                        ),
                        "recommendation": "Don't skip planned rest days",
                    }
                )

    return {
        "insights": insights,
        "data_points": len(rows),
        "message": f"Analyzed {len(rows)} snapshots"
        if insights
        else "Keep logging data - correlations will appear with more entries",
    }


@app.get("/api/analytics/race-predictor", response_model=RacePredictorResponse)
def get_race_prediction() -> dict[str, Any]:
    """Predict race times based on critical speed and recent training."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(
        columns=["critical_speed", "d_prime", "ctl", "week_0_km", "avg_pace"], limit=1
    )

    if not rows or rows[0][0] is None:
        return {
            "predictions": [],
            "critical_speed_ms": None,
            "d_prime_meters": None,
            "fitness_level": "unknown",
            "message": (
                "Need critical speed data for race predictions. Complete a few hard efforts (1-5K)."
            ),
        }

    cs, d_prime, ctl, week_km, avg_pace = rows[0]

    predictions = calculate_race_predictions(cs, d_prime, ctl, avg_pace)

    readiness = "excellent" if ctl and ctl > 40 else "good" if ctl and ctl > 25 else "building"

    return {
        "predictions": predictions,
        "critical_speed_ms": cs,
        "d_prime_meters": d_prime,
        "fitness_level": readiness,
        "message": f"Predictions based on Critical Speed model. Current fitness: {readiness}.",
    }


# --- DETRAINING ENDPOINT ---


@app.get("/api/analytics/detraining", response_model=DetrainingResponse)
def get_detraining() -> dict[str, Any]:
    """Estimate fitness/fatigue decay if training stops today."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(columns=["ctl", "atl"], limit=1)

    if not rows or rows[0][0] is None or rows[0][1] is None:
        return {
            "points": [],
            "current_ctl": 0.0,
            "current_atl": 0.0,
            "message": "No current fitness data available",
        }

    ctl, atl = rows[0]
    points = calculate_detraining(ctl, atl)
    week6_ctl = points[-1]["ctl"] if points else ctl
    pct_lost = round((1 - week6_ctl / ctl) * 100) if ctl > 0 else 0

    return {
        "points": points,
        "current_ctl": ctl,
        "current_atl": atl,
        "message": (
            f"After 6 weeks without training, CTL drops ~{pct_lost}%"
            f" (from {ctl:.0f} to {week6_ctl:.0f})"
        ),
    }


# --- WEEKLY SUMMARY ENDPOINT ---


@app.get("/api/analytics/summary", response_model=WeeklySummary)
def get_weekly_summary() -> dict[str, Any]:
    """Get a 7-day training digest vs the previous 7 days."""
    db = get_db()
    rows = db.get_snapshots_for_analytics(
        columns=["ctl", "atl", "tsb", "hrv", "week_0_km", "rest_days"], limit=14
    )
    return calculate_weekly_summary(rows)


# --- GOAL ADHERENCE ENDPOINT ---


@app.get("/api/analytics/adherence", response_model=list[AdherenceReport])
def get_goal_adherence() -> list[dict[str, Any]]:
    """Show adherence history for active weekly_km goals."""
    db = get_db()
    goals = db.get_active_goals()
    weekly_goals = [g for g in goals if g["goal_type"] == "weekly_km"]

    if not weekly_goals:
        return []

    rows = db.get_snapshots_for_analytics(columns=["recorded_at", "week_0_km"], limit=60)

    reports = []
    for goal in weekly_goals:
        report = calculate_goal_adherence(goal["target_value"], rows)
        reports.append(report)

    return reports


# --- PERSONAL RECORDS ENDPOINTS ---


@app.get("/api/personal-records", response_model=PersonalRecordsResponse)
def get_personal_records() -> dict[str, Any]:
    """Get all detected personal records."""
    db = get_db()
    rows = db.get_personal_records()
    return {"records": [dict(r) for r in rows]}


# --- TRAINING NOTES ENDPOINTS ---


@app.get("/api/notes", response_model=NoteList)
def get_notes(limit: int = Query(50, ge=1, le=200)) -> dict[str, Any]:
    """Get training log notes."""
    db = get_db()
    rows = db.get_notes(limit=limit)
    return {"items": [dict(r) for r in rows]}


@app.post("/api/notes", response_model=SuccessResponse)
def create_note(note: NoteCreate) -> dict[str, Any]:
    """Add a training log note."""
    db = get_db()
    db.create_note(note_date=note.note_date, content=note.content)
    return {"success": True}


@app.delete("/api/notes/{note_id}", response_model=SuccessResponse)
def delete_note(note_id: int) -> dict[str, Any]:
    """Delete a training log note."""
    db = get_db()
    db.delete_note(note_id)
    return {"success": True}


# --- STRAVA STATUS ENDPOINT ---


@app.get("/api/strava/status", response_model=StravaStatus)
def get_strava_status() -> dict[str, Any]:
    """Check if Strava integration is configured."""
    settings = get_settings()
    configured = bool(
        settings.strava_client_id
        and settings.strava_client_secret
        and settings.strava_refresh_token
    )
    return {
        "configured": configured,
        "message": (
            "Strava connected and active"
            if configured
            else "Strava not configured — add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET,"
            " STRAVA_REFRESH_TOKEN to .env"
        ),
    }


# --- EXPORT ENDPOINTS ---


@app.get("/api/export/json")
def export_json() -> JSONResponse:
    """Export all snapshots as JSON."""
    db = get_db()
    total, rows = db.get_snapshots(limit=10000, offset=0)
    data = [row_to_dict(r) for r in rows]
    return JSONResponse(content={"snapshots": data})


@app.get("/api/export/csv")
def export_csv() -> StreamingResponse:
    """Export all snapshots as CSV."""
    db = get_db()
    total, rows = db.get_snapshots(limit=10000, offset=0)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(SNAPSHOT_COLUMNS)
    writer.writerows(rows)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=training_data.csv"},
    )


# Serve built frontend with SPA support
if DIST_DIR.exists():
    # Mount static assets at /assets
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve individual static files at root
    @app.get("/vite.svg")
    async def vite_svg() -> FileResponse:
        return FileResponse(str(DIST_DIR / "vite.svg"))

    @app.get("/manifest.json")
    async def manifest() -> FileResponse:
        return FileResponse(str(DIST_DIR / "manifest.json"))

    @app.get("/sw.js")
    async def service_worker() -> FileResponse:
        return FileResponse(str(DIST_DIR / "sw.js"))

    # Serve index.html for root and all SPA routes
    @app.get("/")
    async def serve_index() -> FileResponse:
        return FileResponse(str(DIST_DIR / "index.html"))

    @app.get("/{path:path}")
    async def serve_spa(path: str) -> FileResponse:
        # Don't serve index.html for API routes or static assets
        if path.startswith("api/") or path.startswith("assets/"):
            raise HTTPException(status_code=404, detail="Not found")
        # For all other routes, serve the SPA
        return FileResponse(str(DIST_DIR / "index.html"))
