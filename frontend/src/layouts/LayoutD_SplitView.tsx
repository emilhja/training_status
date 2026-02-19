// Layout D: Split View
// Charts on the left, metrics on the right (or top/bottom on mobile)
// Good for: Data visualization focused users, seeing trends alongside current values

import { useState } from 'react'
import { useLatestSnapshot } from '../hooks/useLatestSnapshot'
import { useSnapshots } from '../hooks/useSnapshots'
import MetricCard from '../components/current/MetricCard'
import TrainingLoadChart from '../components/charts/TrainingLoadChart'
import HrvChart from '../components/charts/HrvChart'
import WeeklyKmChart from '../components/charts/WeeklyKmChart'
import {
  ctlStatus, atlStatus, tsbStatus, tsbZone, acStatus, sleepStatus, subjectiveStatus,
  fmtSleep, fmt, fmtCadence,
} from '../utils/metrics'

type RightPanelTab = 'training' | 'health' | 'running' | 'all'
const tabButtons: { id: RightPanelTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'training', label: 'Training' },
  { id: 'health', label: 'Health' },
  { id: 'running', label: 'Running' },
]

export default function LayoutD_SplitView() {
  const [rightTab, setRightTab] = useState<RightPanelTab>('all')
  const { data: s, loading, error } = useLatestSnapshot()
  const { data: historyData } = useSnapshots(90)
  const snapshots = historyData ? [...historyData.items].reverse() : []

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)

  const renderMetrics = () => {
    const showTraining = rightTab === 'all' || rightTab === 'training'
    const showHealth = rightTab === 'all' || rightTab === 'health'
    const showRunning = rightTab === 'all' || rightTab === 'running'

    return (
      <div className="space-y-4">
        {showTraining && (
          <div>
            {rightTab === 'all' && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Training Load</h3>}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="CTL" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
              <MetricCard label="ATL" value={fmt(s.atl)} status={atlStatus(s.atl, s.ctl)} />
              <MetricCard label="TSB" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
              <MetricCard label="A:C" value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} />
            </div>
          </div>
        )}

        {showHealth && (
          <div>
            {rightTab === 'all' && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Health</h3>}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" />
              <MetricCard label="HRV" value={fmt(s.hrv, 0)} unit="ms" />
              <MetricCard label="Sleep" value={fmtSleep(s.sleep_secs)} status={sleepStatus(s.sleep_quality)}
                          sub={s.sleep_score ? `${Math.round(s.sleep_score)}/100` : undefined} />
              <MetricCard label="VO2max" value={s.vo2max ?? '—'} />
              {s.hrv_sdnn !== null && <MetricCard label="HRV(SDNN)" value={fmt(s.hrv_sdnn, 0)} unit="ms" />}
              {s.stress !== null && <MetricCard label="Stress" value={s.stress} unit="/100" />}
              {s.readiness !== null && <MetricCard label="Ready" value={s.readiness} unit="/100" />}
            </div>
            {(s.mood !== null || s.motivation !== null || s.fatigue !== null || s.soreness !== null) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {s.mood !== null && <MetricCard label="Mood" value={s.mood} unit="/5" status={subjectiveStatus(s.mood)} />}
                {s.motivation !== null && <MetricCard label="Motivation" value={s.motivation} unit="/5" status={subjectiveStatus(s.motivation)} />}
                {s.fatigue !== null && <MetricCard label="Fatigue" value={s.fatigue} unit="/5" status={subjectiveStatus(s.fatigue) === 'good' ? 'bad' : subjectiveStatus(s.fatigue) === 'bad' ? 'good' : 'ok'} />}
                {s.soreness !== null && <MetricCard label="Soreness" value={s.soreness} unit="/5" status={subjectiveStatus(s.soreness) === 'good' ? 'bad' : subjectiveStatus(s.soreness) === 'bad' ? 'good' : 'ok'} />}
              </div>
            )}
          </div>
        )}

        {showRunning && (
          <div>
            {rightTab === 'all' && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Running</h3>}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="This Week" value={fmt(s.week_0_km)} unit="km" />
              <MetricCard label="Last Month" value={fmt(s.last_month_km)} unit="km" />
              <MetricCard label="Total" value={fmt(s.total_distance_km, 0)} unit="km" />
              <MetricCard label="Runs" value={s.run_count ?? '—'} />
              {s.elevation_gain_m !== null && <MetricCard label="Elevation" value={fmt(s.elevation_gain_m)} unit="m" />}
              {s.avg_cadence !== null && <MetricCard label="Cadence" value={fmtCadence(s.avg_cadence)} unit="spm" />}
              {s.icu_rpe !== null && <MetricCard label="RPE" value={s.icu_rpe} unit="/10" />}
              {s.feel !== null && <MetricCard label="Feel" value={s.feel} unit="/5" status={subjectiveStatus(s.feel)} />}
            </div>
            {(s.longest_streak !== null || s.avg_days_run_per_week !== null || s.weather_temp !== null) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {s.longest_streak !== null && <MetricCard label="Best Streak" value={s.longest_streak} unit="d" />}
                {s.avg_days_run_per_week !== null && <MetricCard label="Days/Wk" value={fmt(s.avg_days_run_per_week, 1)} />}
                {s.weather_temp !== null && <MetricCard label="Temp" value={s.weather_temp} unit="°C" />}
                {s.weather_humidity !== null && <MetricCard label="Humidity" value={s.weather_humidity} unit="%" />}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold tracking-tight">Training Status</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">{recorded}</span>
        </div>
        <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors">
          Refresh
        </button>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Left Panel: Charts */}
        <div className="flex-1 lg:border-r border-gray-800">
          <div className="p-4 space-y-6">
            {/* Training Load Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300">Training Load Trend</h2>
                <span className="text-xs text-gray-500">Last 90 days</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
              </div>
            </div>

            {/* HRV Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300">HRV & Resting HR</h2>
                <span className="text-xs text-gray-500">Last 90 days</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-4">
                {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
              </div>
            </div>

            {/* Weekly KM */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300">Weekly Volume</h2>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 max-w-md">
                <WeeklyKmChart snapshot={s} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Metrics */}
        <div className="w-full lg:w-80 xl:w-96 bg-gray-950 border-t lg:border-t-0 border-gray-800">
          <div className="p-4">
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-1 mb-4 p-1 bg-gray-900 rounded-lg">
              {tabButtons.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors
                    ${rightTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Metrics */}
            {renderMetrics()}

            {/* Mini History */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent History</h3>
              <div className="space-y-2 max-h-48 overflow-auto">
                {historyData?.items.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-900 last:border-0">
                    <span className="text-gray-500">{item.recorded_at.slice(0, 10)}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-400">CTL: <span className="text-gray-200">{fmt(item.ctl)}</span></span>
                      <span className="text-gray-400">TSB: <span className="text-gray-200">{fmt(item.tsb)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
