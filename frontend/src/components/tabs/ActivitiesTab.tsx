import { useState, useEffect } from 'react'
import { fetchWeeklyActivities, fetchGoals } from '../../api'
import type { WeeklyActivitiesData, ActivityItem, Goal } from '../../types'

const RUN_TYPES = new Set(['Run', 'VirtualRun', 'Treadmill'])
const LIFT_TYPES = new Set(['WeightTraining', 'Strength', 'Weights'])

const TYPE_ICONS: Record<string, string> = {
  Run: '🏃', VirtualRun: '🏃', Treadmill: '🏃',
  WeightTraining: '🏋️', Strength: '🏋️', Weights: '🏋️',
  Ride: '🚴', VirtualRide: '🚴',
  Swim: '🏊', Walk: '🚶', Hike: '🥾',
  Yoga: '🧘', Workout: '💪',
}

function typeIcon(type: string) { return TYPE_ICONS[type] ?? '🏅' }
function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`
}

// ---- Heatmap ----
const HEATMAP_DAYS = 56 // 8 weeks

function buildDayMap(activities: ActivityItem[]) {
  const map: Record<string, { run: boolean; lift: boolean }> = {}
  for (const a of activities) {
    if (!map[a.date]) map[a.date] = { run: false, lift: false }
    if (RUN_TYPES.has(a.type)) map[a.date].run = true
    if (LIFT_TYPES.has(a.type)) map[a.date].lift = true
  }
  return map
}

function dayCell(info: { run: boolean; lift: boolean } | undefined) {
  if (!info) return 'bg-gray-800'
  if (info.run && info.lift) return 'bg-green-500' // both: show green, half yellow via border
  if (info.run) return 'bg-green-500'
  if (info.lift) return 'bg-yellow-400'
  return 'bg-gray-800'
}

function Heatmap({ activities }: { activities: ActivityItem[] }) {
  const dayMap = buildDayMap(activities)
  const today = new Date()

  // Build grid: 8 columns (weeks), 7 rows (days Mon–Sun)
  // Start from the Monday 8 weeks ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - HEATMAP_DAYS + 1)
  // Roll back to nearest Monday
  const dow = startDate.getDay() // 0=Sun
  const daysToMon = (dow === 0 ? -6 : 1 - dow)
  startDate.setDate(startDate.getDate() + daysToMon)

  const weeks: Date[][] = []
  const cur = new Date(startDate)
  while (cur <= today || weeks.length < 8) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (weeks.length >= 8) break
  }

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="text-[10px] text-gray-600 h-4 flex items-center">{l}</span>
          ))}
        </div>
        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const iso = day.toISOString().slice(0, 10)
              const isFuture = day > today
              const info = dayMap[iso]
              const isToday = iso === today.toISOString().slice(0, 10)
              const hasBoth = info?.run && info?.lift

              return (
                <div key={di} className="relative group">
                  <div
                    className={`w-4 h-4 rounded-sm ${isFuture ? 'bg-gray-900 opacity-30' : dayCell(info)} ${isToday ? 'ring-1 ring-blue-400' : ''}`}
                  >
                    {/* Split indicator for both run + lift */}
                    {hasBoth && (
                      <div className="absolute inset-0 rounded-sm overflow-hidden">
                        <div className="absolute left-0 top-0 w-full h-1/2 bg-green-500" />
                        <div className="absolute left-0 bottom-0 w-full h-1/2 bg-yellow-400" />
                      </div>
                    )}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-700 text-gray-100 text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {iso}{info ? ` · ${[info.run && 'Run', info.lift && 'Lift'].filter(Boolean).join(' + ')}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Run</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Lift</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block overflow-hidden relative">
            <span className="absolute inset-0 top-0 h-1/2 bg-green-500 block" />
            <span className="absolute inset-0 top-1/2 h-1/2 bg-yellow-400 block" />
          </span> Both
        </span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-800 inline-block" /> Rest</span>
      </div>
    </div>
  )
}

// ---- Streak ----
function computeStreak(activities: ActivityItem[]): number {
  const activeDays = new Set(activities.map(a => a.date))
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    if (activeDays.has(iso)) streak++
    else break
  }
  return streak
}

function streakMessage(streak: number): string {
  if (streak === 0) return ''
  if (streak === 1) return 'Active today — great start!'
  if (streak === 2) return `${streak} days in a row — keep it up!`
  if (streak === 3) return `${streak} consecutive days — nice consistency!`
  if (streak <= 5) return `${streak} day streak — you're on a roll!`
  if (streak <= 7) return `${streak} day streak — impressive week!`
  return `${streak} day streak — exceptional dedication! 🔥`
}

// ---- Weekly target progress ----
function WeeklyProgress({ activities, liftGoal }: { activities: ActivityItem[]; liftGoal: Goal | null }) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)) // Monday
  weekStart.setHours(0, 0, 0, 0)

  const thisWeekActs = activities.filter(a => new Date(a.date) >= weekStart)
  const liftCount = thisWeekActs.filter(a => LIFT_TYPES.has(a.type)).length
  const runCount = thisWeekActs.filter(a => RUN_TYPES.has(a.type)).length
  const liftTarget = liftGoal?.target_value ?? null

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-1">Runs this week</p>
        <p className="text-2xl font-bold text-green-400">{runCount}</p>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-1">Lifts this week</p>
        <div className="flex items-end gap-1">
          <p className="text-2xl font-bold text-yellow-400">{liftCount}</p>
          {liftTarget != null && (
            <p className="text-sm text-gray-500 mb-0.5">/ {liftTarget}</p>
          )}
        </div>
        {liftTarget != null && (
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (liftCount / liftTarget) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Main ----
export default function ActivitiesTab() {
  const [data, setData] = useState<WeeklyActivitiesData | null>(null)
  const [heatmapData, setHeatmapData] = useState<WeeklyActivitiesData | null>(null)
  const [liftGoal, setLiftGoal] = useState<Goal | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchWeeklyActivities(7).then(setData).catch(() => setError(true))
    fetchWeeklyActivities(HEATMAP_DAYS).then(setHeatmapData).catch(() => {})
    fetchGoals().then(d => {
      const g = d.items.find(g => g.goal_type === 'weekly_weightlifting_sessions' && g.is_active)
      setLiftGoal(g ?? null)
    }).catch(() => {})
  }, [])

  if (error) return (
    <div className="p-6 text-gray-500 text-sm">Could not load activities. Try refreshing data first.</div>
  )
  if (!data) return (
    <div className="p-6 text-gray-500 text-sm">Loading…</div>
  )

  const allActivities = heatmapData?.activities ?? data.activities
  const streak = computeStreak(allActivities)
  const msg = streakMessage(streak)

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Streak banner */}
      {streak > 0 && (
        <div className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center gap-3">
          <span className="text-2xl">{streak >= 6 ? '🔥' : '⚡'}</span>
          <p className="text-sm text-gray-200">{msg}</p>
        </div>
      )}

      {/* Weekly progress */}
      <WeeklyProgress activities={data.activities} liftGoal={liftGoal} />

      {/* Heatmap */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Last 8 Weeks</h3>
        {heatmapData ? <Heatmap activities={heatmapData.activities} /> : <p className="text-xs text-gray-600">Loading…</p>}
      </div>

      {/* Summary by type */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">This Week</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.summary.map(s => (
            <div key={s.type} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{typeIcon(s.type)}</span>
                <span className="text-sm font-medium text-gray-200">{s.type}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.count}×</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDuration(s.total_minutes)}{s.total_km > 0 ? ` · ${s.total_km} km` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">All Activities (7 days)</h3>
        <div className="space-y-2">
          {data.activities.map(a => (
            <div key={a.id} className="bg-gray-900 rounded-lg px-4 py-3 border border-gray-800 flex items-center gap-3">
              <span className="text-lg">{typeIcon(a.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{a.name}</p>
                <p className="text-xs text-gray-500">{a.date}</p>
              </div>
              <div className="text-right shrink-0">
                {a.distance_km > 0 && <p className="text-sm text-gray-300">{a.distance_km} km</p>}
                <p className="text-xs text-gray-500">{formatDuration(a.duration_min)}</p>
              </div>
              {a.load != null && (
                <div className="text-right shrink-0 w-12">
                  <p className="text-xs text-gray-500">load</p>
                  <p className="text-sm text-gray-300">{a.load}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
