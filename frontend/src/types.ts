export interface Snapshot {
  id: number
  recorded_at: string
  
  // Training Load
  ctl: number | null
  atl: number | null
  tsb: number | null
  ramp_rate: number | null
  ac_ratio: number | null
  rest_days: number | null
  monotony: number | null
  training_strain: number | null
  
  // Health & Wellness
  resting_hr: number | null
  hrv: number | null
  hrv_sdnn: number | null
  sleep_secs: number | null
  sleep_quality: number | null  // 1=Good 2=OK 3=Bad
  sleep_score: number | null
  vo2max: number | null
  steps: number | null
  spo2: number | null
  
  // Subjective Wellness
  stress: number | null
  readiness: number | null
  weight: number | null
  body_fat: number | null
  mood: number | null           // 1-5
  motivation: number | null     // 1-5
  fatigue: number | null        // 1-5
  soreness: number | null       // 1-5
  comments: string | null
  
  // Activity Metrics (latest)
  elevation_gain_m: number | null
  avg_cadence: number | null
  max_hr: number | null
  hr_zone_z1_secs: number | null
  hr_zone_z2_secs: number | null
  hr_zone_z3_secs: number | null
  hr_zone_z4_secs: number | null
  hr_zone_z5_secs: number | null
  icu_rpe: number | null       // 1-10
  feel: number | null           // 1-5
  
  // Critical Speed
  critical_speed: number | null
  d_prime: number | null
  
  // Smashrun Stats
  total_distance_km: number | null
  run_count: number | null
  longest_run_km: number | null
  avg_pace: string | null
  week_0_km: number | null
  week_1_km: number | null
  week_2_km: number | null
  week_3_km: number | null
  week_4_km: number | null
  last_month_km: number | null
  longest_streak: number | null
  longest_streak_date: string | null
  longest_break_days: number | null
  longest_break_date: string | null
  avg_days_run_per_week: number | null
  days_run_am: number | null
  days_run_pm: number | null
  days_run_both: number | null
  most_often_run_day: string | null
  
  // Weather (latest activity)
  weather_temp: number | null
  weather_temp_feels_like: number | null
  weather_humidity: number | null
  weather_wind_speed: number | null
  weather_type: string | null

  // Strava (optional supplement)
  strava_weekly_km: number | null
  strava_total_km: number | null
  strava_run_count: number | null
  strava_ytd_km: number | null
}

export interface SnapshotsResponse {
  total: number
  items: Snapshot[]
}

export interface FetchResult {
  success: boolean
  output: string
  error: string | null
}

export type Status = 'good' | 'ok' | 'bad' | 'neutral'

export interface Goal {
  id: number
  created_at: string
  goal_type: 'weekly_km' | 'monthly_km' | 'yearly_km'
  target_value: number
  period_start: string | null
  is_active: number
}

export interface ConsistencyScore {
  score: number
  volume_score: number
  rest_score: number
  monotony_score: number
  assessment: string
}

export interface Recommendation {
  recommendation: string
  reason: string
  urgency: 'high' | 'medium' | 'low'
  color: 'red' | 'yellow' | 'green' | 'blue'
}

export interface Projection {
  day: number
  ctl: number
  atl: number
  tsb: number
  zone: string
}

export interface Theme {
  mode: 'dark' | 'light'
}

export interface InjuryRisk {
  risk_score: number
  risk_level: 'low' | 'moderate' | 'elevated' | 'high' | 'unknown'
  message: string
  factors: {
    factor: string
    value: string
    severity: 'low' | 'medium' | 'high'
    message: string
  }[]
  recommendations: (string | null)[]
}

export interface CorrelationInsight {
  type: string
  title: string
  description: string
  recommendation: string
}

export interface CorrelationsResponse {
  insights: CorrelationInsight[]
  data_points: number
  message: string
}

export interface RacePrediction {
  distance: string
  meters: number
  predicted_time: string
  predicted_pace: string
  typical_range: string
}

export interface RacePredictorResponse {
  predictions: RacePrediction[]
  critical_speed_ms: number
  d_prime_meters: number
  fitness_level: string
  message: string
}

export interface ProjectionsResponse {
  projections: Projection[]
  current: { ctl: number; atl: number; tsb: number } | null
  days_to_positive_tsb: number | null
  debug?: string
}

export interface DetrainingPoint {
  week: number
  ctl: number
  atl: number
  tsb: number
  ctl_pct_lost: number
}

export interface DetrainingResponse {
  points: DetrainingPoint[]
  current_ctl: number
  current_atl: number
  message: string
}

export interface WeeklySummary {
  ctl_change: number | null
  total_km: number | null
  avg_hrv: number | null
  rest_days: number | null
  tsb_trend: 'improving' | 'declining' | 'stable' | 'unknown'
  message: string
}

export interface WeekAdherence {
  week_start: string
  planned_km: number
  actual_km: number
  achieved: boolean
}

export interface AdherenceReport {
  target_km: number
  overall_pct: number | null
  streak: number
  weeks: WeekAdherence[]
  message: string
}

export interface PersonalRecord {
  id: number
  detected_at: string
  distance_label: string
  distance_m: number
  time_secs: number
  pace_str: string
  activity_date: string
  activity_id: string | null
}

export interface Note {
  id: number
  created_at: string
  note_date: string
  content: string
}

export interface StravaStatus {
  configured: boolean
  message: string
}
