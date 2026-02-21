import type {
  Snapshot, SnapshotsResponse, FetchResult, Goal, ConsistencyScore, Recommendation,
  Projection, InjuryRisk, CorrelationsResponse, RacePredictorResponse,
  ProjectionsResponse, DetrainingResponse, WeeklySummary, AdherenceReport,
  PersonalRecord, Note, StravaStatus
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
