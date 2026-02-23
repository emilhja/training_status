import { useState, useEffect } from 'react'
import { fetchWeeklyActivities, fetchGoals } from '../../api'
import type { ActivityItem, Goal } from '../../types'

const RUN_TYPES = new Set(['Run', 'VirtualRun', 'Treadmill'])
const LIFT_TYPES = new Set(['WeightTraining', 'Strength', 'Weights'])

function buildDayMap(activities: ActivityItem[]) {
  const map: Record<string, { run: boolean; lift: boolean }> = {}
  for (const a of activities) {
    if (!map[a.date]) map[a.date] = { run: false, lift: false }
    if (RUN_TYPES.has(a.type)) map[a.date].run = true
    if (LIFT_TYPES.has(a.type)) map[a.date].lift = true
  }
  return map
}

function computeStreak(activities: ActivityItem[]): number {
  const activeDays = new Set(activities.map(a => a.date))
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (activeDays.has(d.toISOString().slice(0, 10))) streak++
    else break
  }
  return streak
}

function MiniHeatmap({ activities }: { activities: ActivityItem[] }) {
  const dayMap = buildDayMap(activities)
  const today = new Date()
  // Last 14 days, arranged in 2 rows of 7
  const days: Date[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }

  return (
    <div className="flex gap-1">
      {days.map((day, i) => {
        const iso = day.toISOString().slice(0, 10)
        const info = dayMap[iso]
        const isToday = iso === today.toISOString().slice(0, 10)
        const hasBoth = info?.run && info?.lift
        let bg = 'bg-gray-800'
        if (info?.run && !info?.lift) bg = 'bg-green-500'
        else if (info?.lift && !info?.run) bg = 'bg-yellow-400'
        else if (hasBoth) bg = 'bg-green-500'

        return (
          <div key={i} className="relative group">
            <div className={`w-5 h-5 rounded-sm ${bg} ${isToday ? 'ring-1 ring-blue-400' : ''} overflow-hidden`}>
              {hasBoth && (
                <>
                  <div className="absolute left-0 top-0 w-full h-1/2 bg-green-500" />
                  <div className="absolute left-0 bottom-0 w-full h-1/2 bg-yellow-400" />
                </>
              )}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-700 text-gray-100 text-[10px] px-2 py-1 rounded whitespace-nowrap">
                {iso.slice(5)}{info ? ` · ${[info.run && '🏃', info.lift && '🏋️'].filter(Boolean).join(' ')}` : ''}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function WeeklyActivitiesWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [liftGoal, setLiftGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchWeeklyActivities(14),
      fetchGoals(),
    ]).then(([data, goals]) => {
      setActivities(data.activities)
      const g = goals.items.find(g => g.goal_type === 'weekly_weightlifting_sessions' && g.is_active)
      setLiftGoal(g ?? null)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(weekStart.getDate() - 7)

  const thisWeek = activities.filter(a => new Date(a.date) >= weekStart)
  const lastWeek = activities.filter(a => { const d = new Date(a.date); return d >= lastWeekStart && d < weekStart })

  const runCount = thisWeek.filter(a => RUN_TYPES.has(a.type)).length
  const liftCount = thisWeek.filter(a => LIFT_TYPES.has(a.type)).length
  const lastRunCount = lastWeek.filter(a => RUN_TYPES.has(a.type)).length
  const lastLiftCount = lastWeek.filter(a => LIFT_TYPES.has(a.type)).length
  const liftTarget = liftGoal?.target_value ?? null
  const streak = computeStreak(activities)

  function delta(cur: number, prev: number) {
    const d = cur - prev
    if (d === 0) return null
    return <span className={`text-[10px] ${d > 0 ? 'text-green-400' : 'text-red-400'}`}>{d > 0 ? `+${d}` : d} vs last wk</span>
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">This Week</h3>
        {streak > 0 && (
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            {streak >= 6 ? '🔥' : '⚡'} {streak} day streak
          </span>
        )}
      </div>

      {/* Run + Lift counts */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏃</span>
            <span className="text-xl font-bold text-green-400">{runCount}</span>
            <span className="text-xs text-gray-500">runs</span>
          </div>
          {delta(runCount, lastRunCount)}
        </div>
        <div className="w-px h-8 bg-gray-800" />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏋️</span>
            <span className="text-xl font-bold text-yellow-400">{liftCount}</span>
            {liftTarget != null && <span className="text-xs text-gray-500">/ {liftTarget}</span>}
            <span className="text-xs text-gray-500">lifts</span>
          </div>
          {delta(liftCount, lastLiftCount)}
        </div>
        {liftTarget != null && (
          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden self-center">
            <div
              className="h-full bg-yellow-400 rounded-full"
              style={{ width: `${Math.min(100, (liftCount / liftTarget) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">14-day heatmap</p>
      <MiniHeatmap activities={activities} />
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Run</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Lift</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-800 inline-block" /> Rest</span>
      </div>
      <p className="mt-3 text-[10px] text-gray-600 border-t border-gray-800 pt-2">
        Live from Intervals.icu — a recent activity missing? It may not have synced from Garmin/Strava yet.
      </p>
    </div>
  )
}
