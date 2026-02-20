"""Pydantic models for request/response validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# --- Snapshot Models ---

class SnapshotBase(BaseModel):
    """Base snapshot data."""
    recorded_at: datetime
    
    # Training load
    ctl: Optional[float] = None
    atl: Optional[float] = None
    tsb: Optional[float] = None
    ramp_rate: Optional[float] = None
    ac_ratio: Optional[float] = None
    
    # Health metrics
    resting_hr: Optional[int] = None
    hrv: Optional[float] = None
    hrv_sdnn: Optional[float] = None
    sleep_secs: Optional[int] = None
    sleep_quality: Optional[int] = None
    sleep_score: Optional[float] = None
    steps: Optional[int] = None
    spo2: Optional[float] = None
    
    # Training metrics
    rest_days: Optional[int] = None
    monotony: Optional[float] = None
    training_strain: Optional[float] = None
    vo2max: Optional[float] = None
    
    # Wellness
    stress: Optional[float] = None
    readiness: Optional[float] = None
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    mood: Optional[int] = Field(None, ge=1, le=5)
    motivation: Optional[int] = Field(None, ge=1, le=5)
    fatigue: Optional[int] = Field(None, ge=1, le=5)
    soreness: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None
    
    # Activity metrics
    elevation_gain_m: Optional[float] = None
    avg_cadence: Optional[float] = None
    max_hr: Optional[int] = None
    hr_zone_z1_secs: Optional[int] = None
    hr_zone_z2_secs: Optional[int] = None
    hr_zone_z3_secs: Optional[int] = None
    hr_zone_z4_secs: Optional[int] = None
    hr_zone_z5_secs: Optional[int] = None
    icu_rpe: Optional[int] = Field(None, ge=1, le=10)
    feel: Optional[int] = Field(None, ge=1, le=5)
    
    # Critical speed
    critical_speed: Optional[float] = None
    d_prime: Optional[float] = None
    
    # Smashrun stats
    total_distance_km: Optional[float] = None
    run_count: Optional[int] = None
    longest_run_km: Optional[float] = None
    avg_pace: Optional[str] = None
    week_0_km: Optional[float] = None
    week_1_km: Optional[float] = None
    week_2_km: Optional[float] = None
    week_3_km: Optional[float] = None
    week_4_km: Optional[float] = None
    last_month_km: Optional[float] = None
    
    # Streaks
    longest_streak: Optional[int] = None
    longest_streak_date: Optional[str] = None
    longest_break_days: Optional[int] = None
    longest_break_date: Optional[str] = None
    avg_days_run_per_week: Optional[float] = None
    days_run_am: Optional[int] = None
    days_run_pm: Optional[int] = None
    days_run_both: Optional[int] = None
    most_often_run_day: Optional[str] = None
    
    # Weather
    weather_temp: Optional[float] = None
    weather_temp_feels_like: Optional[float] = None
    weather_humidity: Optional[int] = None
    weather_wind_speed: Optional[float] = None
    weather_type: Optional[str] = None


class Snapshot(SnapshotBase):
    """Full snapshot with ID."""
    model_config = ConfigDict(from_attributes=True)

    id: int


class SnapshotList(BaseModel):
    """Paginated snapshot list."""
    total: int
    items: list[Snapshot]


# --- Goal Models ---

class Goal(BaseModel):
    """Training goal."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    goal_type: str
    target_value: float
    period_start: Optional[str] = None
    is_active: bool = True


class GoalCreate(BaseModel):
    """Create a new goal."""
    goal_type: str = Field(..., pattern=r"^(weekly_km|monthly_km|yearly_km)$")
    target_value: float = Field(..., gt=0)
    period_start: Optional[str] = None


class GoalList(BaseModel):
    """List of goals."""
    items: list[Goal]


# --- Analytics Models ---

class ConsistencyScore(BaseModel):
    """Training consistency analysis."""
    score: Optional[int] = None
    volume_score: Optional[int] = None
    rest_score: Optional[int] = None
    monotony_score: Optional[int] = None
    assessment: str
    reason: Optional[str] = None


class Recommendation(BaseModel):
    """Training recommendation."""
    recommendation: str
    reason: str
    urgency: str = Field(..., pattern=r"^(low|medium|high)$")
    color: str = Field(..., pattern=r"^(green|yellow|red|blue)$")


class Projection(BaseModel):
    """Future training load projection."""
    day: int
    ctl: float
    atl: float
    tsb: float
    zone: str


class ProjectionsResponse(BaseModel):
    """Projections response."""
    projections: list[Projection]
    current: Optional[dict] = None
    debug: Optional[str] = None


class RiskFactor(BaseModel):
    """Individual risk factor."""
    factor: str
    value: str
    severity: str
    message: str


class InjuryRisk(BaseModel):
    """Injury risk assessment."""
    risk_score: Optional[int] = None
    risk_level: str
    message: str
    factors: list[RiskFactor]
    recommendations: list[Optional[str]]


class CorrelationInsight(BaseModel):
    """Data-driven insight."""
    type: str
    title: str
    description: str
    recommendation: str


class CorrelationsResponse(BaseModel):
    """Correlations analysis response."""
    insights: list[CorrelationInsight]
    data_points: int
    message: str


class RacePrediction(BaseModel):
    """Predicted race time."""
    distance: str
    meters: int
    predicted_time: str
    predicted_pace: str
    typical_range: str


class RacePredictorResponse(BaseModel):
    """Race predictor response."""
    predictions: list[RacePrediction]
    critical_speed_ms: Optional[float] = None
    d_prime_meters: Optional[float] = None
    fitness_level: str
    message: str


# --- API Response Models ---

class FetchResponse(BaseModel):
    """Data fetch trigger response."""
    success: bool
    output: str
    error: Optional[str] = None


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool
