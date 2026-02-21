import type {
  Snapshot, SnapshotsResponse, FetchResult, Goal, ConsistencyScore, Recommendation,
  InjuryRisk, CorrelationsResponse, RacePredictorResponse,
  ProjectionsResponse, DetrainingResponse, WeeklySummary, AdherenceReport,
  PersonalRecord, Note, StravaStatus, ReadinessScoreData, WorkoutSuggestionData,
  OverloadResponse, TrainingZonesData, HrDriftData, SleepInsightsData, TaperData,
  GearItem, HealthEvent, AnnotationItem
} from './types'

export async function fetchLatest(): Promise<Snapshot> {
  const res = await fetch('/api/snapshots/latest')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchSnapshots(limit = 90): Promise<SnapshotsResponse> {
  const res = await fetch(`/api/snapshots?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function triggerFetch(): Promise<FetchResult> {
  const res = await fetch('/api/fetch', { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Goals API
export async function fetchGoals(): Promise<{ items: Goal[] }> {
  const res = await fetch('/api/goals')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createGoal(goal_type: string, target_value: number, period_start?: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal_type, target_value, period_start: period_start ?? null }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteGoal(goalId: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Analytics API
export async function fetchConsistencyScore(): Promise<ConsistencyScore> {
  const res = await fetch('/api/analytics/consistency')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchRecommendation(): Promise<Recommendation> {
  const res = await fetch('/api/analytics/recommendation')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchProjections(): Promise<ProjectionsResponse> {
  const res = await fetch('/api/analytics/projections')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Export API
export function getExportJsonUrl(): string {
  return '/api/export/json'
}

export function getExportCsvUrl(): string {
  return '/api/export/csv'
}

// New Analytics APIs
export async function fetchInjuryRisk(): Promise<InjuryRisk> {
  const res = await fetch('/api/analytics/injury-risk')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchCorrelations(): Promise<CorrelationsResponse> {
  const res = await fetch('/api/analytics/correlations')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchRacePredictions(): Promise<RacePredictorResponse> {
  const res = await fetch('/api/analytics/race-predictor')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchDetraining(): Promise<DetrainingResponse> {
  const res = await fetch('/api/analytics/detraining')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchWeeklySummary(): Promise<WeeklySummary> {
  const res = await fetch('/api/analytics/summary')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAdherence(): Promise<AdherenceReport[]> {
  const res = await fetch('/api/analytics/adherence')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchPersonalRecords(): Promise<{ records: PersonalRecord[] }> {
  const res = await fetch('/api/personal-records')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchNotes(limit = 50): Promise<{ items: Note[] }> {
  const res = await fetch(`/api/notes?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createNote(note_date: string, content: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_date, content }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteNote(noteId: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchStravaStatus(): Promise<StravaStatus> {
  const res = await fetch('/api/strava/status')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- New Analytics APIs ---

export async function fetchReadiness(): Promise<ReadinessScoreData> {
  const res = await fetch('/api/analytics/readiness')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchWorkoutSuggestion(): Promise<WorkoutSuggestionData> {
  const res = await fetch('/api/analytics/workout-suggestion')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchOverload(): Promise<OverloadResponse> {
  const res = await fetch('/api/analytics/overload')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchTrainingZones(): Promise<TrainingZonesData> {
  const res = await fetch('/api/analytics/zones')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchHrDrift(): Promise<HrDriftData> {
  const res = await fetch('/api/analytics/hr-drift')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchSleepInsights(): Promise<SleepInsightsData> {
  const res = await fetch('/api/analytics/sleep-insights')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchTaper(raceDate: string, model = 'exponential'): Promise<TaperData> {
  const res = await fetch(`/api/analytics/taper?race_date=${raceDate}&model=${model}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Gear APIs ---

export async function fetchGear(): Promise<{ items: GearItem[] }> {
  const res = await fetch('/api/gear')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createGear(data: { name: string; gear_type: string; brand?: string; purchase_date?: string; retirement_km: number }): Promise<{ success: boolean }> {
  const res = await fetch('/api/gear', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateGear(id: number, data: Record<string, unknown>): Promise<{ success: boolean }> {
  const res = await fetch(`/api/gear/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteGear(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/gear/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Health Events APIs ---

export async function fetchHealthEvents(): Promise<{ items: HealthEvent[] }> {
  const res = await fetch('/api/health-events')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createHealthEvent(data: { event_date: string; end_date?: string; event_type: string; description: string; tags?: string }): Promise<{ success: boolean }> {
  const res = await fetch('/api/health-events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteHealthEvent(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/health-events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Annotations APIs ---

export async function fetchAnnotations(metric?: string): Promise<{ items: AnnotationItem[] }> {
  const url = metric ? `/api/annotations?metric=${metric}` : '/api/annotations'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createAnnotation(data: { annotation_date: string; metric: string; content: string }): Promise<{ success: boolean }> {
  const res = await fetch('/api/annotations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteAnnotation(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/annotations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Share APIs ---

export async function createShareLink(expiresDays?: number): Promise<{ token: string; url: string; expires_at: string | null }> {
  const res = await fetch('/api/share', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expires_days: expiresDays ?? null }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchSharedView(token: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/shared/${token}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Reports APIs ---

export async function fetchReports(): Promise<{ reports: string[] }> {
  const res = await fetch('/api/reports')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function generateReport(): Promise<{ success: boolean }> {
  const res = await fetch('/api/reports/generate', { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
