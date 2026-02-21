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

    # Strava (optional supplement)
    strava_weekly_km: float | None = None
    strava_total_km: float | None = None
    strava_run_count: int | None = None
    strava_ytd_km: float | None = None


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
    days_to_positive_tsb: int | None = None


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


# --- Detraining Models ---


class DetrainingPoint(BaseModel):
    """Single week in detraining forecast."""

    week: int
    ctl: float
    atl: float
    tsb: float
    ctl_pct_lost: float


class DetrainingResponse(BaseModel):
    """Detraining estimator response."""

    points: list[DetrainingPoint]
    current_ctl: float
    current_atl: float
    message: str


# --- Weekly Summary Models ---


class WeeklySummary(BaseModel):
    """7-day training summary."""

    ctl_change: float | None = None
    total_km: float | None = None
    avg_hrv: float | None = None
    rest_days: int | None = None
    tsb_trend: str
    message: str


# --- Goal Adherence Models ---


class WeekAdherence(BaseModel):
    """Single week adherence entry."""

    week_start: str
    planned_km: float
    actual_km: float
    achieved: bool


class AdherenceReport(BaseModel):
    """Goal adherence report."""

    target_km: float
    overall_pct: int | None = None
    streak: int
    weeks: list[WeekAdherence]
    message: str


# --- Personal Record Models ---


class PersonalRecord(BaseModel):
    """A personal best for a given distance."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    detected_at: str
    distance_label: str
    distance_m: int
    time_secs: float
    pace_str: str
    activity_date: str
    activity_id: str | None = None


class PersonalRecordsResponse(BaseModel):
    """All personal records."""

    records: list[PersonalRecord]


# --- Training Note Models ---


class Note(BaseModel):
    """A training log entry."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: str
    note_date: str
    content: str


class NoteCreate(BaseModel):
    """Create a training note."""

    note_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    content: str = Field(..., min_length=1, max_length=2000)


class NoteList(BaseModel):
    """List of training notes."""

    items: list[Note]


# --- Strava Status Model ---


class StravaStatus(BaseModel):
    """Strava integration status."""

    configured: bool
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


# --- Readiness Score Models ---


class ReadinessComponents(BaseModel):
    tsb: float | None = None
    hrv_trend: float | None = None
    sleep: float | None = None
    fatigue: float | None = None
    soreness: float | None = None


class ReadinessScore(BaseModel):
    score: int
    label: str
    components: ReadinessComponents


# --- Workout Suggestion Models ---


class WorkoutSuggestion(BaseModel):
    type: str
    title: str
    description: str
    duration_min: int
    intensity: str
    color: str


# --- Overload Tracker Models ---


class OverloadWeek(BaseModel):
    label: str
    current_km: float
    previous_km: float
    change_pct: float
    flagged: bool


class OverloadResponse(BaseModel):
    weeks: list[OverloadWeek]
    safe: bool
    recommendation: str


# --- Training Zones Models ---


class HrZone(BaseModel):
    zone: str
    hr_low: int
    hr_high: int


class PaceZone(BaseModel):
    zone: str
    pace_low: str
    pace_high: str
    speed_low_ms: float
    speed_high_ms: float


class TrainingZonesResponse(BaseModel):
    hr_zones: list[HrZone]
    pace_zones: list[PaceZone]
    data_quality: str


# --- HR Drift Models ---


class HrDriftPoint(BaseModel):
    date: str
    z2_ratio: float
    easy_pct: float


class HrDriftResponse(BaseModel):
    points: list[HrDriftPoint]
    assessment: str
    message: str
    trend: str


# --- Sleep Insights Models ---


class SleepInsight(BaseModel):
    type: str
    title: str
    finding: str
    recommendation: str


class SleepInsightsResponse(BaseModel):
    insights: list[SleepInsight]
    data_points: int


# --- Taper Models ---


class TaperWeek(BaseModel):
    week: int
    label: str
    days_to_race: int
    target_volume_pct: float
    reduction_pct: float
    projected_ctl: float


class TaperResponse(BaseModel):
    race_date: str
    days_to_race: int | None = None
    taper_weeks: int | None = None
    current_ctl: float | None = None
    model: str | None = None
    weeks: list[TaperWeek]
    error: str | None = None


# --- Gear Models ---


class Gear(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    gear_type: str
    brand: str | None = None
    purchase_date: str | None = None
    retirement_km: float
    accumulated_km: float
    is_active: bool
    created_at: str


class GearCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    gear_type: str = Field("shoe", pattern=r"^(shoe|apparel|accessory)$")
    brand: str | None = None
    purchase_date: str | None = None
    retirement_km: float = Field(800.0, gt=0)


class GearUpdate(BaseModel):
    name: str | None = None
    brand: str | None = None
    retirement_km: float | None = None
    accumulated_km: float | None = None


class GearList(BaseModel):
    items: list[Gear]


# --- Health Event Models ---


class HealthEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_date: str
    end_date: str | None = None
    event_type: str
    description: str
    tags: str | None = None
    created_at: str


class HealthEventCreate(BaseModel):
    event_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str | None = None
    event_type: str = Field(..., pattern=r"^(illness|injury|rest_period)$")
    description: str = Field(..., min_length=1, max_length=500)
    tags: str | None = None


class HealthEventUpdate(BaseModel):
    end_date: str | None = None
    description: str | None = None
    tags: str | None = None


class HealthEventList(BaseModel):
    items: list[HealthEvent]


# --- Annotation Models ---


class Annotation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    annotation_date: str
    metric: str
    content: str
    created_at: str


class AnnotationCreate(BaseModel):
    annotation_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    metric: str = Field("general", pattern=r"^(ctl|hrv|tsb|general)$")
    content: str = Field(..., min_length=1, max_length=500)


class AnnotationList(BaseModel):
    items: list[Annotation]


# --- Shared Link Models ---


class SharedLink(BaseModel):
    token: str
    created_at: str
    expires_at: str | None = None
    is_active: bool


class SharedLinkCreate(BaseModel):
    expires_days: int | None = Field(None, ge=1, le=365)
