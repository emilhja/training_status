import { useEffect, useState } from 'react'
import { fetchGoals } from '../../api'
import type { Snapshot, Goal } from '../../types'

interface Props {
  snapshot: Snapshot
}

interface Progress {
  current: number
  target: number
  pct: number
  remaining: number
  timeLabel: string   // e.g. "5 days left"
  paceNeeded: number  // km/day to hit target
  daysLeft: number
}

function getWeeklyProgress(snapshot: Snapshot, goal: Goal): Progress {
  const current = snapshot.week_0_km || 0
  const target = goal.target_value
  const pct = Math.min(100, (current / target) * 100)
  const remaining = Math.max(0, target - current)
  // Days remaining in week; treat Monday as start (Sun=0 → 1 day left)
  const dayOfWeek = new Date().getDay()
  const daysLeft = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const paceNeeded = daysLeft > 0 ? remaining / daysLeft : 0
  return { current, target, pct, remaining, timeLabel: `${daysLeft}d left`, paceNeeded, daysLeft }
}

function getMonthlyProgress(snapshot: Snapshot, goal: Goal): Progress {
  // last_month_km is a rolling ~30-day total — the closest field we have to a
  // current-month figure. Labelled clearly in the UI to avoid ambiguity.
  const current = snapshot.last_month_km || 0
  const target = goal.target_value
  const pct = Math.min(100, (current / target) * 100)
  const remaining = Math.max(0, target - current)
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate()
  const paceNeeded = daysLeft > 0 ? remaining / daysLeft : 0
  return { current, target, pct, remaining, timeLabel: `${daysLeft}d left in month`, paceNeeded, daysLeft }
}

function getYearlyProgress(snapshot: Snapshot, goal: Goal): Progress {
  // Estimate year-to-date km from recent weekly averages extrapolated to weeks elapsed.
  // A dedicated yearly API field would be more accurate; this is the best proxy available.
  const weeks = [
    snapshot.week_0_km || 0,
    snapshot.week_1_km || 0,
    snapshot.week_2_km || 0,
    snapshot.week_3_km || 0,
    snapshot.week_4_km || 0,
  ]
  const avgWeeklyKm = weeks.reduce((a, b) => a + b, 0) / weeks.length
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weeksElapsed = Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 3600 * 1000)))
  const current = Math.round(avgWeeklyKm * weeksElapsed)
  const target = goal.target_value
  const pct = Math.min(100, (current / target) * 100)
  const remaining = Math.max(0, target - current)
  const endOfYear = new Date(now.getFullYear(), 11, 31)
  const daysLeft = Math.ceil((endOfYear.getTime() - now.getTime()) / (24 * 3600 * 1000))
  const paceNeeded = daysLeft > 0 ? remaining / daysLeft : 0
  return { current, target, pct, remaining, timeLabel: `${daysLeft}d left in year`, paceNeeded, daysLeft }
}

function getGoalProgress(snapshot: Snapshot, goal: Goal): Progress {
  switch (goal.goal_type) {
    case 'weekly_km':  return getWeeklyProgress(snapshot, goal)
    case 'monthly_km': return getMonthlyProgress(snapshot, goal)
    case 'yearly_km':  return getYearlyProgress(snapshot, goal)
  }
}

const GOAL_LABELS: Record<Goal['goal_type'], string> = {
  weekly_km:  'Weekly Goal',
  monthly_km: 'Monthly Goal (last 30d)',
  yearly_km:  'Yearly Goal (estimated)',
}

function getColor(pct: number) {
  if (pct >= 90) return 'bg-green-500'
  if (pct >= 70) return 'bg-yellow-500'
  if (pct >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

function getStatus(pct: number, daysLeft: number) {
  if (pct >= 100)                        return { text: 'Done!',       color: 'text-green-400' }
  const needed = daysLeft / (pct / 100 || 0.01)
  if (needed <= 7)                       return { text: 'On track!',   color: 'text-green-400' }
  if (needed <= 8)                       return { text: 'Close',       color: 'text-yellow-400' }
  return                                        { text: 'Behind pace', color: 'text-red-400' }
}

export default function GoalProgress({ snapshot }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
      .then(data => setGoals(data.items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading goals...</div>
  if (goals.length === 0) return null

  return (
    <div className="space-y-4">
      {goals.map(goal => {
        const { current, target, pct, remaining, timeLabel, paceNeeded, daysLeft } = getGoalProgress(snapshot, goal)
        const status = getStatus(pct, daysLeft)

        return (
          <div key={goal.id} className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300">{GOAL_LABELS[goal.goal_type]}</h3>
              <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-gray-100">{current.toFixed(1)}</span>
              <span className="text-sm text-gray-500">/ {target} km</span>
              <span className="text-sm text-gray-400">({pct.toFixed(0)}%)</span>
            </div>

            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full ${getColor(pct)} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{remaining.toFixed(1)} km remaining</span>
              <span>{timeLabel} • need {paceNeeded.toFixed(1)} km/day</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
