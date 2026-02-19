// Layout C: Card-Based with Accordion
// Expandable sections that replace tabs
// Good for: Mobile-friendly, progressive disclosure, focus on one section at a time

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

interface AccordionSectionProps {
  title: string
  icon: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  summary?: string
}

function AccordionSection({ title, icon, isOpen, onToggle, children, summary }: AccordionSectionProps) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <h2 className="font-semibold text-gray-200">{title}</h2>
            {summary && !isOpen && <p className="text-xs text-gray-500">{summary}</p>}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function LayoutC_Accordion() {
  const [openSections, setOpenSections] = useState<string[]>(['training'])
  const { data: s, loading, error } = useLatestSnapshot()
  const { data: historyData } = useSnapshots(90)
  const snapshots = historyData ? [...historyData.items].reverse() : []

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)

  const trainingSummary = `CTL: ${fmt(s.ctl)} · TSB: ${fmt(s.tsb)} · ${tsbZone(s.tsb)}`
  const healthSummary = `RHR: ${s.resting_hr ?? '—'} · HRV: ${fmt(s.hrv, 0)}ms · Sleep: ${fmtSleep(s.sleep_secs)}`
  const runningSummary = `${fmt(s.week_0_km)}km this week · ${s.run_count?.toLocaleString() ?? '—'} total runs`

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Training Status</h1>
            <p className="text-xs text-gray-500 mt-0.5">Last updated: {recorded}</p>
          </div>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">CTL</p>
            <p className={`text-xl font-bold ${ctlStatus(s.ramp_rate) === 'good' ? 'text-green-400' : 'text-gray-200'}`}>
              {fmt(s.ctl)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">TSB</p>
            <p className={`text-xl font-bold ${tsbStatus(s.tsb) === 'good' ? 'text-green-400' : tsbStatus(s.tsb) === 'bad' ? 'text-red-400' : 'text-gray-200'}`}>
              {fmt(s.tsb)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">HRV</p>
            <p className="text-xl font-bold text-gray-200">{fmt(s.hrv, 0)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">Week</p>
            <p className="text-xl font-bold text-gray-200">{fmt(s.week_0_km)}<span className="text-sm text-gray-500">km</span></p>
          </div>
        </div>

        {/* Accordion Sections */}
        <AccordionSection
          title="Training Load"
          icon="▲"
          isOpen={openSections.includes('training')}
          onToggle={() => toggleSection('training')}
          summary={trainingSummary}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
            <MetricCard label="Fatigue (ATL)" value={fmt(s.atl)} status={atlStatus(s.atl, s.ctl)} />
            <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
            <MetricCard label="Workload (A:C)" value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} />
            <MetricCard label="Monotony" value={fmt(s.monotony, 2)} />
            <MetricCard label="Training Strain" value={s.training_strain ?? '—'} />
            <MetricCard label="Rest Days" value={s.rest_days ?? '—'} unit="days" />
          </div>
          <div className="mt-4">
            {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Health Metrics"
          icon="♥"
          isOpen={openSections.includes('health')}
          onToggle={() => toggleSection('health')}
          summary={healthSummary}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {s.stress !== null && <MetricCard label="Stress" value={s.stress} unit="/100" />}
              {s.readiness !== null && <MetricCard label="Readiness" value={s.readiness} unit="/100" />}
              {s.weight !== null && <MetricCard label="Weight" value={fmt(s.weight)} unit="kg" />}
              {s.body_fat !== null && <MetricCard label="Body Fat" value={fmt(s.body_fat)} unit="%" />}
            </div>
          )}
          {(s.mood !== null || s.motivation !== null || s.fatigue !== null || s.soreness !== null) && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {s.mood !== null && <MetricCard label="Mood" value={s.mood} unit="/5" status={subjectiveStatus(s.mood)} />}
              {s.motivation !== null && <MetricCard label="Motivation" value={s.motivation} unit="/5" status={subjectiveStatus(s.motivation)} />}
              {s.fatigue !== null && <MetricCard label="Fatigue" value={s.fatigue} unit="/5" status={subjectiveStatus(s.fatigue) === 'good' ? 'bad' : subjectiveStatus(s.fatigue) === 'bad' ? 'good' : 'ok'} />}
              {s.soreness !== null && <MetricCard label="Soreness" value={s.soreness} unit="/5" status={subjectiveStatus(s.soreness) === 'good' ? 'bad' : subjectiveStatus(s.soreness) === 'bad' ? 'good' : 'ok'} />}
            </div>
          )}
          {s.comments && (
            <div className="mt-4">
              <p className="text-sm text-gray-300 bg-gray-950 rounded-lg p-3">{s.comments}</p>
            </div>
          )}
          <div className="mt-4">
            {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Running Volume"
          icon="👟"
          isOpen={openSections.includes('running')}
          onToggle={() => toggleSection('running')}
          summary={runningSummary}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label="Total Distance" value={fmt(s.total_distance_km, 0)} unit="km" />
            <MetricCard label="Run Count" value={s.run_count ?? '—'} />
            <MetricCard label="Longest Run" value={fmt(s.longest_run_km)} unit="km" />
            <MetricCard label="Avg Pace" value={s.avg_pace ?? '—'} unit="min/km" />
            <MetricCard label="This Week" value={fmt(s.week_0_km)} unit="km" />
            <MetricCard label="Last Month" value={fmt(s.last_month_km)} unit="km" />
          </div>
          {(s.elevation_gain_m !== null || s.avg_cadence !== null || s.max_hr !== null || s.icu_rpe !== null) && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Latest Activity</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {s.elevation_gain_m !== null && <MetricCard label="Elevation" value={fmt(s.elevation_gain_m)} unit="m" />}
                {s.avg_cadence !== null && <MetricCard label="Cadence" value={fmtCadence(s.avg_cadence)} unit="spm" />}
                {s.max_hr !== null && <MetricCard label="Max HR" value={s.max_hr} unit="bpm" />}
                {s.icu_rpe !== null && <MetricCard label="RPE" value={s.icu_rpe} unit="/10" />}
                {s.feel !== null && <MetricCard label="Feel" value={s.feel} unit="/5" status={subjectiveStatus(s.feel)} />}
              </div>
            </div>
          )}
          {(s.longest_streak !== null || s.avg_days_run_per_week !== null || s.most_often_run_day !== null) && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Running Patterns</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {s.longest_streak !== null && <MetricCard label="Longest Streak" value={s.longest_streak} unit="days" />}
                {s.avg_days_run_per_week !== null && <MetricCard label="Days/Week" value={fmt(s.avg_days_run_per_week, 1)} />}
                {s.most_often_run_day !== null && <MetricCard label="Fav Day" value={s.most_often_run_day} />}
              </div>
            </div>
          )}
          {(s.weather_temp !== null) && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weather (Latest Run)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {s.weather_temp !== null && <MetricCard label="Temperature" value={s.weather_temp} unit="°C" />}
                {s.weather_humidity !== null && <MetricCard label="Humidity" value={s.weather_humidity} unit="%" />}
                {s.weather_wind_speed !== null && <MetricCard label="Wind" value={fmt(s.weather_wind_speed)} unit="km/h" />}
                {s.weather_type !== null && <MetricCard label="Conditions" value={s.weather_type} />}
              </div>
            </div>
          )}
          <div className="mt-4">
            <WeeklyKmChart snapshot={s} />
          </div>
        </AccordionSection>

        <AccordionSection
          title="History"
          icon="📋"
          isOpen={openSections.includes('history')}
          onToggle={() => toggleSection('history')}
          summary={`${historyData?.items.length ?? 0} snapshots stored`}
        >
          <div className="bg-gray-950 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">CTL</th>
                  <th className="px-3 py-2 text-left">ATL</th>
                  <th className="px-3 py-2 text-left">TSB</th>
                  <th className="px-3 py-2 text-left">HRV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {historyData?.items.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-900/50">
                    <td className="px-3 py-2">{item.recorded_at.slice(0, 10)}</td>
                    <td className="px-3 py-2">{fmt(item.ctl)}</td>
                    <td className="px-3 py-2">{fmt(item.atl)}</td>
                    <td className="px-3 py-2">{fmt(item.tsb)}</td>
                    <td className="px-3 py-2">{fmt(item.hrv, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionSection>
      </main>
    </div>
  )
}
