import type { Snapshot } from '../types'
import MetricCard from '../components/current/MetricCard'
import WeeklyKmChart from '../components/charts/WeeklyKmChart'
import StreakWidget from '../components/features/StreakWidget'
import WeatherImpact from '../components/features/WeatherImpact'
import FatiguePattern from '../components/features/FatiguePattern'
import PersonalRecords from '../components/features/PersonalRecords'
import { fmt } from '../utils/metrics'

interface Props {
  s: Snapshot
  snapshots: Snapshot[]
}

export default function RunningView({ s, snapshots }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Distance" value={fmt(s.total_distance_km, 0)} unit="km" />
        <MetricCard label="Run Count" value={s.run_count ?? '—'} />
        <MetricCard label="Longest Run" value={fmt(s.longest_run_km)} unit="km" />
        <MetricCard label="Avg Pace" value={s.avg_pace ?? '—'} unit="min/km" />
        <MetricCard label="This Week" value={fmt(s.week_0_km)} unit="km" />
        <MetricCard label="Last Month" value={fmt(s.last_month_km)} unit="km" />
      </div>

      <StreakWidget snapshot={s} />

      {snapshots.length > 0 && <WeatherImpact snapshots={snapshots} />}

      <FatiguePattern snapshot={s} />

      {(s.longest_streak !== null || s.avg_days_run_per_week !== null || s.most_often_run_day !== null) && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Running Patterns</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {s.longest_streak !== null && <MetricCard label="Longest Streak" value={s.longest_streak} unit="days" />}
            {s.longest_break_days !== null && <MetricCard label="Longest Break" value={s.longest_break_days} unit="days" />}
            {s.avg_days_run_per_week !== null && <MetricCard label="Avg Days/Week" value={fmt(s.avg_days_run_per_week, 1)} />}
            {s.most_often_run_day !== null && <MetricCard label="Fav Day" value={s.most_often_run_day} />}
            {s.days_run_am !== null && <MetricCard label="AM Runs" value={s.days_run_am} />}
            {s.days_run_pm !== null && <MetricCard label="PM Runs" value={s.days_run_pm} />}
          </div>
        </div>
      )}

      <PersonalRecords />

      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Weekly Volume</h3>
        <WeeklyKmChart snapshot={s} />
      </div>
    </div>
  )
}
