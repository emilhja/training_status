// Layout A: Sidebar Navigation
// Dashboard-style with left sidebar navigation instead of top tabs
// Good for: Users who prefer persistent navigation and a more app-like feel

import { useState } from 'react'
import { useLatestSnapshot } from '../hooks/useLatestSnapshot'
import { useSnapshots } from '../hooks/useSnapshots'
import MetricCard from '../components/current/MetricCard'
import TrainingLoadChart from '../components/charts/TrainingLoadChart'
import HrvChart from '../components/charts/HrvChart'
import WeeklyKmChart from '../components/charts/WeeklyKmChart'
import type { Status } from '../types'

const navItems = [
  { id: 'overview', label: 'Overview', icon: '⊞' },
  { id: 'training', label: 'Training Load', icon: '▲' },
  { id: 'health', label: 'Health', icon: '♥' },
  { id: 'running', label: 'Running', icon: '👟' },
  { id: 'charts', label: 'Charts', icon: '📊' },
  { id: 'history', label: 'History', icon: '📋' },
]

// Status helpers (copied from CurrentTab)
function ctlStatus(ramp: number | null): Status {
  if (ramp === null) return 'neutral'
  if (ramp > 2)  return 'good'
  if (ramp >= 0) return 'ok'
  return 'bad'
}

function atlStatus(atl: number | null, ctl: number | null): Status {
  if (!atl || !ctl) return 'neutral'
  const r = atl / ctl
  if (r < 1.0)  return 'good'
  if (r <= 1.3) return 'ok'
  return 'bad'
}

function tsbStatus(tsb: number | null): Status {
  if (tsb === null) return 'neutral'
  if (tsb > 5)   return 'good'
  if (tsb > -10) return 'ok'
  return 'bad'
}

function tsbZone(tsb: number | null): string {
  if (tsb === null) return ''
  if (tsb > 25)  return 'Transition'
  if (tsb > 5)   return 'Fresh'
  if (tsb > -10) return 'Grey Zone'
  if (tsb > -30) return 'Overreaching'
  return 'Very Overreached'
}

function acStatus(ac: number | null): Status {
  if (ac === null) return 'neutral'
  if (ac < 0.8 || ac > 1.5) return 'bad'
  if (ac <= 1.3) return 'good'
  return 'ok'
}

function sleepStatus(q: number | null): Status {
  if (q === 1) return 'good'
  if (q === 2) return 'ok'
  if (q === 3) return 'bad'
  return 'neutral'
}

function fmtSleep(secs: number | null): string {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h${String(m).padStart(2, '0')}m`
}

function fmt(v: number | null, decimals = 1): string {
  if (v === null) return '—'
  return v.toFixed(decimals)
}

export default function LayoutA_Sidebar() {
  const [activeNav, setActiveNav] = useState('overview')
  const { data: s, loading, error } = useLatestSnapshot()
  const { data: historyData } = useSnapshots(90)
  const snapshots = historyData ? [...historyData.items].reverse() : []

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)

  const renderContent = () => {
    switch (activeNav) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Key Metrics Row */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Key Metrics</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
                <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
                <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" />
                <MetricCard label="HRV" value={fmt(s.hrv, 0)} unit="ms" />
              </div>
            </div>
            {/* Quick Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Training Load Trend</h3>
                {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-4">HRV Trend</h3>
                {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
              </div>
            </div>
          </div>
        )
      case 'training':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
            <MetricCard label="Fatigue (ATL)" value={fmt(s.atl)} status={atlStatus(s.atl, s.ctl)} />
            <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
            <MetricCard label="Workload (A:C)" value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} />
            <MetricCard label="Monotony" value={fmt(s.monotony, 2)} />
            <MetricCard label="Training Strain" value={s.training_strain ?? '—'} />
            <MetricCard label="Rest Days" value={s.rest_days ?? '—'} unit="days" />
          </div>
        )
      case 'health':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" />
              <MetricCard label="HRV (RMSSD)" value={fmt(s.hrv, 0)} unit="ms" />
              {s.hrv_sdnn !== null && <MetricCard label="HRV (SDNN)" value={fmt(s.hrv_sdnn, 0)} unit="ms" />}
              <MetricCard label="Sleep" value={fmtSleep(s.sleep_secs)} status={sleepStatus(s.sleep_quality)}
                          sub={s.sleep_score ? `${Math.round(s.sleep_score)}/100` : undefined} />
              <MetricCard label="VO2max" value={s.vo2max ?? '—'} />
              <MetricCard label="Steps" value={s.steps?.toLocaleString() ?? '—'} />
              {s.spo2 !== null && <MetricCard label="SpO2" value={s.spo2} unit="%" />}
            </div>
            {(s.stress !== null || s.readiness !== null || s.weight !== null || s.body_fat !== null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Wellness (Garmin/Intervals)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {s.stress !== null && <MetricCard label="Stress" value={s.stress} unit="/100" />}
                  {s.readiness !== null && <MetricCard label="Readiness" value={s.readiness} unit="/100" />}
                  {s.weight !== null && <MetricCard label="Weight" value={fmt(s.weight)} unit="kg" />}
                  {s.body_fat !== null && <MetricCard label="Body Fat" value={fmt(s.body_fat)} unit="%" />}
                </div>
              </div>
            )}
            {(s.mood !== null || s.motivation !== null || s.fatigue !== null || s.soreness !== null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Subjective Wellness</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {s.mood !== null && <MetricCard label="Mood" value={s.mood} unit="/5" />}
                  {s.motivation !== null && <MetricCard label="Motivation" value={s.motivation} unit="/5" />}
                  {s.fatigue !== null && <MetricCard label="Fatigue" value={s.fatigue} unit="/5" />}
                  {s.soreness !== null && <MetricCard label="Soreness" value={s.soreness} unit="/5" />}
                </div>
              </div>
            )}
            {s.comments && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Notes</h3>
                <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{s.comments}</p>
              </div>
            )}
          </div>
        )
      case 'running':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="Total Distance" value={fmt(s.total_distance_km, 0)} unit="km" />
              <MetricCard label="Run Count" value={s.run_count ?? '—'} />
              <MetricCard label="Longest Run" value={fmt(s.longest_run_km)} unit="km" />
              <MetricCard label="Avg Pace" value={s.avg_pace ?? '—'} unit="min/km" />
              <MetricCard label="This Week" value={fmt(s.week_0_km)} unit="km" />
              <MetricCard label="Last Month" value={fmt(s.last_month_km)} unit="km" />
            </div>
            {(s.elevation_gain_m !== null || s.avg_cadence !== null || s.max_hr !== null || s.icu_rpe !== null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Latest Activity</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {s.elevation_gain_m !== null && <MetricCard label="Elevation" value={fmt(s.elevation_gain_m)} unit="m" />}
                  {s.avg_cadence !== null && <MetricCard label="Cadence" value={Math.round(s.avg_cadence * 2)} unit="spm" />}
                  {s.max_hr !== null && <MetricCard label="Max HR" value={s.max_hr} unit="bpm" />}
                  {s.icu_rpe !== null && <MetricCard label="RPE" value={s.icu_rpe} unit="/10" />}
                  {s.feel !== null && <MetricCard label="Feel" value={s.feel} unit="/5" />}
                </div>
              </div>
            )}
            {(s.longest_streak !== null || s.avg_days_run_per_week !== null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Running Patterns</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {s.longest_streak !== null && <MetricCard label="Longest Streak" value={s.longest_streak} unit="days" />}
                  {s.longest_break_days !== null && <MetricCard label="Longest Break" value={s.longest_break_days} unit="days" />}
                  {s.avg_days_run_per_week !== null && <MetricCard label="Avg Days/Week" value={fmt(s.avg_days_run_per_week, 1)} />}
                  {s.most_often_run_day !== null && <MetricCard label="Fav Day" value={s.most_often_run_day} />}
                </div>
              </div>
            )}
            {(s.weather_temp !== null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Weather (Latest Run)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {s.weather_temp !== null && <MetricCard label="Temperature" value={s.weather_temp} unit="°C" />}
                  {s.weather_humidity !== null && <MetricCard label="Humidity" value={s.weather_humidity} unit="%" />}
                  {s.weather_wind_speed !== null && <MetricCard label="Wind" value={fmt(s.weather_wind_speed)} unit="km/h" />}
                  {s.weather_type !== null && <MetricCard label="Conditions" value={s.weather_type} />}
                </div>
              </div>
            )}
          </div>
        )
      case 'charts':
        return (
          <div className="space-y-8">
            {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
            {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
            {snapshots.length > 0 && <WeeklyKmChart snapshot={snapshots[snapshots.length - 1]} />}
          </div>
        )
      case 'history':
        return (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">CTL</th>
                  <th className="px-4 py-3 text-left">TSB</th>
                  <th className="px-4 py-3 text-left">HRV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {historyData?.items.slice(0, 20).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">{item.recorded_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">{fmt(item.ctl)}</td>
                    <td className="px-4 py-3">{fmt(item.tsb)}</td>
                    <td className="px-4 py-3">{fmt(item.hrv, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold tracking-tight">Training Status</h1>
          <p className="text-xs text-gray-500 mt-1">{recorded}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${activeNav === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
            Refresh Data
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}
