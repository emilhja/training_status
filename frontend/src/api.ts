import type { Snapshot, SnapshotsResponse, FetchResult, Goal, ConsistencyScore, Recommendation, Projection, InjuryRisk, CorrelationsResponse, RacePredictorResponse } from './types'

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
  const params = new URLSearchParams({ goal_type, target_value: target_value.toString() })
  if (period_start) params.append('period_start', period_start)
  const res = await fetch(`/api/goals?${params}`, { method: 'POST' })
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

export async function fetchProjections(): Promise<{ projections: Projection[] }> {
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
