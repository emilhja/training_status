import type {
  Snapshot, SnapshotsResponse, FetchResult, Goal, ConsistencyScore, Recommendation,
  InjuryRisk, CorrelationsResponse, RacePredictorResponse,
  ProjectionsResponse, DetrainingResponse, WeeklySummary, AdherenceReport,
  PersonalRecord, Note, StravaStatus, ReadinessScoreData, WorkoutSuggestionData,
  OverloadResponse, TrainingZonesData, HrDriftData, SleepInsightsData, TaperData,
  GearItem, HealthEvent, AnnotationItem
} from './types'
import { getCached, setCached, deleteCached, clearCache } from './idb'

/**
 * Network-first GET with IndexedDB fallback.
 * On success: caches response in IDB and returns it.
 * On failure: returns cached version from IDB (offline mode).
 * If no cache exists either, throws.
 */
async function cachedGet<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: T = await res.json()
    setCached(url, data) // fire-and-forget
    return data
  } catch (err) {
    const cached = await getCached<T>(url)
    if (cached !== null) return cached
    throw err
  }
}

export async function fetchLatest(): Promise<Snapshot> {
  return cachedGet('/api/snapshots/latest')
}

export async function fetchSnapshots(limit = 90): Promise<SnapshotsResponse> {
  return cachedGet(`/api/snapshots?limit=${limit}`)
}

export async function triggerFetch(): Promise<FetchResult> {
  const res = await fetch('/api/fetch', { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: FetchResult = await res.json()
  await clearCache() // new data arrived — invalidate all cached responses
  return data
}

// Goals API
export async function fetchGoals(): Promise<{ items: Goal[] }> {
  return cachedGet('/api/goals')
}

export async function createGoal(goal_type: string, target_value: number, period_start?: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal_type, target_value, period_start: period_start ?? null }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/goals')
  return res.json()
}

export async function deleteGoal(goalId: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/goals')
  return res.json()
}

// Analytics API
export async function fetchConsistencyScore(): Promise<ConsistencyScore> {
  return cachedGet('/api/analytics/consistency')
}

export async function fetchRecommendation(): Promise<Recommendation> {
  return cachedGet('/api/analytics/recommendation')
}

export async function fetchProjections(): Promise<ProjectionsResponse> {
  return cachedGet('/api/analytics/projections')
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
  return cachedGet('/api/analytics/injury-risk')
}

export async function fetchCorrelations(): Promise<CorrelationsResponse> {
  return cachedGet('/api/analytics/correlations')
}

export async function fetchRacePredictions(): Promise<RacePredictorResponse> {
  return cachedGet('/api/analytics/race-predictor')
}

export async function fetchDetraining(): Promise<DetrainingResponse> {
  return cachedGet('/api/analytics/detraining')
}

export async function fetchWeeklySummary(): Promise<WeeklySummary> {
  return cachedGet('/api/analytics/summary')
}

export async function fetchAdherence(): Promise<AdherenceReport[]> {
  return cachedGet('/api/analytics/adherence')
}

export async function fetchPersonalRecords(): Promise<{ records: PersonalRecord[] }> {
  return cachedGet('/api/personal-records')
}

export async function fetchNotes(limit = 50): Promise<{ items: Note[] }> {
  return cachedGet(`/api/notes?limit=${limit}`)
}

export async function createNote(note_date: string, content: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_date, content }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/notes?limit=50')
  return res.json()
}

export async function deleteNote(noteId: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/notes?limit=50')
  return res.json()
}

export async function fetchStravaStatus(): Promise<StravaStatus> {
  return cachedGet('/api/strava/status')
}

// --- New Analytics APIs ---

export async function fetchReadiness(): Promise<ReadinessScoreData> {
  return cachedGet('/api/analytics/readiness')
}

export async function fetchWorkoutSuggestion(): Promise<WorkoutSuggestionData> {
  return cachedGet('/api/analytics/workout-suggestion')
}

export async function fetchOverload(): Promise<OverloadResponse> {
  return cachedGet('/api/analytics/overload')
}

export async function fetchTrainingZones(): Promise<TrainingZonesData> {
  return cachedGet('/api/analytics/zones')
}

export async function fetchHrDrift(): Promise<HrDriftData> {
  return cachedGet('/api/analytics/hr-drift')
}

export async function fetchSleepInsights(): Promise<SleepInsightsData> {
  return cachedGet('/api/analytics/sleep-insights')
}

export async function fetchTaper(raceDate: string, model = 'exponential'): Promise<TaperData> {
  return cachedGet(`/api/analytics/taper?race_date=${raceDate}&model=${model}`)
}

// --- Gear APIs ---

export async function fetchGear(): Promise<{ items: GearItem[] }> {
  return cachedGet('/api/gear')
}

export async function createGear(data: { name: string; gear_type: string; brand?: string; purchase_date?: string; retirement_km: number }): Promise<{ success: boolean }> {
  const res = await fetch('/api/gear', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/gear')
  return res.json()
}

export async function updateGear(id: number, data: Record<string, unknown>): Promise<{ success: boolean }> {
  const res = await fetch(`/api/gear/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/gear')
  return res.json()
}

export async function deleteGear(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/gear/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/gear')
  return res.json()
}

// --- Health Events APIs ---

export async function fetchHealthEvents(): Promise<{ items: HealthEvent[] }> {
  return cachedGet('/api/health-events')
}

export async function createHealthEvent(data: { event_date: string; end_date?: string; event_type: string; description: string; tags?: string }): Promise<{ success: boolean }> {
  const res = await fetch('/api/health-events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/health-events')
  return res.json()
}

export async function deleteHealthEvent(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/health-events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/health-events')
  return res.json()
}

// --- Annotations APIs ---

export async function fetchAnnotations(metric?: string): Promise<{ items: AnnotationItem[] }> {
  const url = metric ? `/api/annotations?metric=${metric}` : '/api/annotations'
  return cachedGet(url)
}

export async function createAnnotation(data: { annotation_date: string; metric: string; content: string }): Promise<{ success: boolean }> {
  const res = await fetch('/api/annotations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/annotations')
  return res.json()
}

export async function deleteAnnotation(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/annotations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/annotations')
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
  return cachedGet(`/api/shared/${token}`)
}

// --- Reports APIs ---

export async function fetchReports(): Promise<{ reports: string[] }> {
  return cachedGet('/api/reports')
}

export async function generateReport(): Promise<{ success: boolean }> {
  const res = await fetch('/api/reports/generate', { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await deleteCached('/api/reports')
  return res.json()
}
