"""Pydantic models for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# --- Snapshot Models ---


class SnapshotBase(BaseModel):
    """Base snapshot data."""

    recorded_at: datetime

    # Training load
    ctl: float | None = None
    atl: float | None = None
    tsb: float | None = None
    ramp_rate: float | None = None
    ac_ratio: float | None = None

    # Health metrics
    resting_hr: int | None = None
    hrv: float | None = None
    hrv_sdnn: float | None = None
    sleep_secs: int | None = None
    sleep_quality: int | None = None
    sleep_score: float | None = None
    steps: int | None = None
    spo2: float | None = None

    # Training metrics
    rest_days: int | None = None
    monotony: float | None = None
    training_strain: float | None = None
    vo2max: float | None = None

    # Wellness
    stress: float | None = None
    readiness: float | None = None
    weight: float | None = None
    body_fat: float | None = None
    mood: int | None = Field(None, ge=1, le=5)
    motivation: int | None = Field(None, ge=1, le=5)
    fatigue: int | None = Field(None, ge=1, le=5)
    soreness: int | None = Field(None, ge=1, le=5)
    comments: str | None = None

    # Activity metrics
    elevation_gain_m: float | None = None
    avg_cadence: float | None = None
    max_hr: int | None = None
    hr_zone_z1_secs: int | None = None
    hr_zone_z2_secs: int | None = None
    hr_zone_z3_secs: int | None = None
    hr_zone_z4_secs: int | None = None
    hr_zone_z5_secs: int | None = None
    icu_rpe: int | None = Field(None, ge=1, le=10)
    feel: int | None = Field(None, ge=1, le=5)

    # Critical speed
    critical_speed: float | None = None
    d_prime: float | None = None

    # Smashrun stats
    total_distance_km: float | None = None
    run_count: int | None = None
    longest_run_km: float | None = None
    avg_pace: str | None = None
    week_0_km: float | None = None
    week_1_km: float | None = None
    week_2_km: float | None = None
    week_3_km: float | None = None
    week_4_km: float | None = None
    last_month_km: float | None = None

    # Streaks
    longest_streak: int | None = None
    longest_streak_date: str | None = None
    longest_break_days: int | None = None
    longest_break_date: str | None = None
    avg_days_run_per_week: float | None = None
    days_run_am: int | None = None
    days_run_pm: int | None = None
    days_run_both: int | None = None
    most_often_run_day: str | None = None

    # Weather
    weather_temp: float | None = None
    weather_temp_feels_like: float | None = None
    weather_humidity: int | None = None
    weather_wind_speed: float | None = None
    weather_type: str | None = None


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
    period_start: str | None = None
    is_active: bool = True


class GoalCreate(BaseModel):
    """Create a new goal."""

    goal_type: str = Field(..., pattern=r"^(weekly_km|monthly_km|yearly_km)$")
    target_value: float = Field(..., gt=0)
    period_start: str | None = None


class GoalList(BaseModel):
    """List of goals."""

    items: list[Goal]


# --- Analytics Models ---


class ConsistencyScore(BaseModel):
    """Training consistency analysis."""

    score: int | None = None
    volume_score: int | None = None
    rest_score: int | None = None
    monotony_score: int | None = None
    assessment: str
    reason: str | None = None


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
    current: dict | None = None
    debug: str | None = None


class RiskFactor(BaseModel):
    """Individual risk factor."""

    factor: str
    value: str
    severity: str
    message: str


class InjuryRisk(BaseModel):
    """Injury risk assessment."""

    risk_score: int | None = None
    risk_level: str
    message: str
    factors: list[RiskFactor]
    recommendations: list[str | None]


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
    critical_speed_ms: float | None = None
    d_prime_meters: float | None = None
    fitness_level: str
    message: str


# --- API Response Models ---


class FetchResponse(BaseModel):
    """Data fetch trigger response."""

    success: bool
    output: str
    error: str | None = None


class SuccessResponse(BaseModel):
    """Generic success response."""

    success: bool
