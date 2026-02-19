// Layout B: Compact Dashboard
// All-in-one view with compact widgets, no tabs needed
// Good for: Quick overview at a glance, power users who want everything visible

import { useLatestSnapshot } from '../hooks/useLatestSnapshot'
import { useSnapshots } from '../hooks/useSnapshots'
import TrainingLoadChart from '../components/charts/TrainingLoadChart'
import HrvChart from '../components/charts/HrvChart'
import WeeklyKmChart from '../components/charts/WeeklyKmChart'
import {
  ctlStatus, atlStatus, tsbStatus, tsbZone, acStatus, sleepStatus,
  fmtSleep, fmt, fmtCadence,
} from '../utils/metrics'
import type { Status } from '../types'

const statusBg: Record<Status, string> = {
  good:    'bg-green-500/20 text-green-400 border-green-500/30',
  ok:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bad:     'bg-red-500/20 text-red-400 border-red-500/30',
  neutral: 'bg-gray-800 text-gray-400 border-gray-700',
}

interface CompactMetricProps {
  label: string
  value: string | number
  unit?: string
  status?: Status
  sub?: string
}

function CompactMetric({ label, value, unit, status = 'neutral', sub }: CompactMetricProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${statusBg[status]}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-lg font-semibold">
        {value}
        {unit && <span className="text-xs ml-1 opacity-70">{unit}</span>}
      </p>
      {sub && <p className="text-[10px] opacity-60">{sub}</p>}
    </div>
  )
}

export default function LayoutB_CompactDashboard() {
  const { data: s, loading, error } = useLatestSnapshot()
  const { data: historyData } = useSnapshots(90)
  const snapshots = historyData ? [...historyData.items].reverse() : []

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold tracking-tight">Training Status</h1>
          <span className="text-xs text-gray-500">{recorded}</span>
        </div>
        <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors">
          Refresh
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Top Row: Key Metrics */}
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2 mb-4">
          <CompactMetric label="CTL" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
          <CompactMetric label="ATL" value={fmt(s.atl)} status={atlStatus(s.atl, s.ctl)} />
          <CompactMetric label="TSB" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
          <CompactMetric label="A:C" value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} />
          <CompactMetric label="RHR" value={s.resting_hr ?? '—'} unit="bpm" />
          <CompactMetric label="HRV" value={fmt(s.hrv, 0)} unit="ms" />
          <CompactMetric label="Sleep" value={fmtSleep(s.sleep_secs)} status={sleepStatus(s.sleep_quality)} />
          <CompactMetric label="VO2max" value={s.vo2max ?? '—'} />
        </div>

        {/* Middle Row: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 bg-gray-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Training Load (30 days)</h3>
            {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots.slice(-30)} />}
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Volume</h3>
            <WeeklyKmChart snapshot={s} />
          </div>
        </div>

        {/* Bottom Row: More Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Secondary Training Metrics */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Training Details</h3>
            <div className="grid grid-cols-3 gap-2">
              <CompactMetric label="Monotony" value={fmt(s.monotony, 2)} />
              <CompactMetric label="Strain" value={s.training_strain ?? '—'} />
              <CompactMetric label="Rest Days" value={s.rest_days ?? '—'} />
              {s.icu_rpe !== null && <CompactMetric label="RPE" value={s.icu_rpe} unit="/10" />}
              {s.avg_cadence !== null && <CompactMetric label="Cadence" value={fmtCadence(s.avg_cadence)} unit="spm" />}
              {s.elevation_gain_m !== null && <CompactMetric label="Elevation" value={fmt(s.elevation_gain_m)} unit="m" />}
            </div>
          </div>

          {/* Middle: Health & Wellness */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Health & Wellness</h3>
            <div className="grid grid-cols-3 gap-2">
              <CompactMetric label="Steps" value={s.steps?.toLocaleString() ?? '—'} />
              {s.spo2 !== null && <CompactMetric label="SpO2" value={s.spo2} unit="%" />}
              <CompactMetric label="Sleep Score" value={s.sleep_score ? Math.round(s.sleep_score) : '—'} unit="/100" />
              {s.hrv_sdnn !== null && <CompactMetric label="HRV(SDNN)" value={fmt(s.hrv_sdnn, 0)} unit="ms" />}
              {s.stress !== null && <CompactMetric label="Stress" value={s.stress} unit="/100" />}
              {s.readiness !== null && <CompactMetric label="Ready" value={s.readiness} unit="/100" />}
            </div>
          </div>

          {/* Right: Running Stats */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Running</h3>
            <div className="grid grid-cols-2 gap-2">
              <CompactMetric label="This Week" value={fmt(s.week_0_km)} unit="km" />
              <CompactMetric label="Last Month" value={fmt(s.last_month_km)} unit="km" />
              <CompactMetric label="Total" value={fmt(s.total_distance_km, 0)} unit="km" />
              <CompactMetric label="Runs" value={s.run_count ?? '—'} />
              {s.longest_streak !== null && <CompactMetric label="Best Streak" value={s.longest_streak} unit="d" />}
              {s.avg_days_run_per_week !== null && <CompactMetric label="Days/Wk" value={fmt(s.avg_days_run_per_week, 1)} />}
            </div>
          </div>
        </div>

        {/* Weather Row */}
        {(s.weather_temp !== null || s.weather_humidity !== null) && (
          <div className="mt-4 bg-gray-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weather (Latest Run)</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {s.weather_temp !== null && <CompactMetric label="Temp" value={s.weather_temp} unit="°C" />}
              {s.weather_humidity !== null && <CompactMetric label="Humidity" value={s.weather_humidity} unit="%" />}
              {s.weather_wind_speed !== null && <CompactMetric label="Wind" value={fmt(s.weather_wind_speed)} unit="km/h" />}
              {s.weather_type !== null && <CompactMetric label="Conditions" value={s.weather_type} />}
            </div>
          </div>
        )}

        {/* HRV Chart Full Width */}
        <div className="mt-4 bg-gray-900 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">HRV Trend</h3>
          {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
        </div>
      </main>
    </div>
  )
}
