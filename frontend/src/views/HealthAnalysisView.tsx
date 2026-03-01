import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { fetchHealthAnalysis } from '../api'
import type { HealthAnalysisData, HealthMetricPoint, Snapshot } from '../types'
import MetricCard from '../components/current/MetricCard'
import { fmt } from '../utils/metrics'

interface Props {
  s: Snapshot
}

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-blue-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30'
  if (score >= 60) return 'bg-blue-500/10 border-blue-500/30'
  if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

function strengthBadge(s: string): string {
  if (s === 'strong')   return 'bg-red-500/20 text-red-300'
  if (s === 'moderate') return 'bg-yellow-500/20 text-yellow-300'
  return 'bg-gray-700 text-gray-400'
}

function directionIcon(d: string): string {
  return d === 'positive' ? '↑' : '↓'
}

// ------------------------------------------------------------------ //
// Sub-components
// ------------------------------------------------------------------ //

const TooltipStyle = {
  backgroundColor: '#1f2937',
  border: 'none',
  borderRadius: '8px',
  color: '#f3f4f6',
  fontSize: 12,
}

interface TrendPoint { date: string; value: number | null }

function trendData(
  series: Record<string, HealthMetricPoint[]>,
): TrendPoint[] {
  // Merge multiple series keyed by date
  const byDate: Record<string, Record<string, number | null>> = {}
  for (const [key, pts] of Object.entries(series)) {
    for (const pt of pts) {
      if (!byDate[pt.date]) byDate[pt.date] = {}
      byDate[pt.date][key] = pt.value
    }
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals } as TrendPoint))
}

const LINE_COLORS: Record<string, string> = {
  RHR:     '#ef4444',
  HRV:     '#22c55e',
  Sleep:   '#a855f7',
  Stress:  '#f97316',
  ATL:     '#3b82f6',
}

function HealthTrendChart({
  rhrTrend, hrvTrend, sleepTrend, stressTrend, atlTrend,
}: {
  rhrTrend: HealthMetricPoint[]
  hrvTrend: HealthMetricPoint[]
  sleepTrend: HealthMetricPoint[]
  stressTrend: HealthMetricPoint[]
  atlTrend: HealthMetricPoint[]
}) {
  type ActiveKey = 'RHR' | 'HRV' | 'Sleep' | 'Stress' | 'ATL'
  const [active, setActive] = useState<Set<ActiveKey>>(
    new Set(['RHR', 'HRV', 'Sleep', 'Stress'])
  )

  const seriesMap: Record<ActiveKey, HealthMetricPoint[]> = {
    RHR: rhrTrend, HRV: hrvTrend, Sleep: sleepTrend, Stress: stressTrend, ATL: atlTrend,
  }

  const selected = Object.fromEntries(
    [...active].map(k => [k, seriesMap[k]])
  ) as Record<string, HealthMetricPoint[]>

  const data = trendData(selected)

  const toggleKey = (k: ActiveKey) => {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(k)) { next.delete(k) } else { next.add(k) }
      return next
    })
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Health Trends (30 days)</h3>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(seriesMap) as ActiveKey[]).map(k => (
            <button
              key={k}
              onClick={() => toggleKey(k)}
              className={`text-xs px-2 py-0.5 rounded transition-opacity ${
                active.has(k) ? 'opacity-100' : 'opacity-40'
              }`}
              style={{ color: LINE_COLORS[k], border: `1px solid ${LINE_COLORS[k]}40` }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px] sm:h-[260px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip contentStyle={TooltipStyle} />
            {[...active].map(k => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={LINE_COLORS[k]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600 mt-1">Toggle series with buttons above. Note: metrics have different scales.</p>
    </div>
  )
}

// ------------------------------------------------------------------ //
// Wellbeing bars
// ------------------------------------------------------------------ //

function WellbeingBar({ label, value, max = 5, invert = false }: {
  label: string
  value: number | null
  max?: number
  invert?: boolean
}) {
  if (value === null) return null
  const pct = (value / max) * 100
  const effectivePct = invert ? 100 - pct : pct
  const color = effectivePct >= 70 ? 'bg-green-500' : effectivePct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 w-8 text-right">{value}/{max}</span>
    </div>
  )
}

// ------------------------------------------------------------------ //
// Correlation card
// ------------------------------------------------------------------ //

function CorrelationCard({ c }: { c: HealthAnalysisData['correlations'][0] }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-gray-200">
          {directionIcon(c.direction)} {c.title}
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${strengthBadge(c.strength)}`}>
          {c.strength}
        </span>
      </div>
      <p className="text-xs text-gray-400">{c.description}</p>
    </div>
  )
}

// ------------------------------------------------------------------ //
// Main view
// ------------------------------------------------------------------ //

export default function HealthAnalysisView({ s }: Props) {
  const [data, setData] = useState<HealthAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealthAnalysis()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const scoreClass = data ? scoreColor(data.readiness_score) : 'text-gray-400'
  const bgClass    = data ? scoreBg(data.readiness_score)    : 'bg-gray-800 border-gray-700'

  return (
    <div className="space-y-6">
      {/* Top metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard label="Resting HR"     value={s.resting_hr ?? '—'} unit="bpm" glossaryKey="resting_hr" />
        <MetricCard label="HRV (RMSSD)"    value={fmt(s.hrv, 0)}       unit="ms"  glossaryKey="hrv" />
        <MetricCard label="Sleep Score"    value={s.sleep_score ? Math.round(s.sleep_score) : '—'} unit="/100" glossaryKey="sleep" />
        {s.stress !== null && <MetricCard label="Stress"   value={s.stress}  unit="/100" glossaryKey="stress" />}
        {s.spo2   !== null && <MetricCard label="SpO2"     value={s.spo2}    unit="%"    glossaryKey="spo2" />}
        {s.respiratory_rate !== null && (
          <MetricCard label="Resp. Rate" value={fmt(s.respiratory_rate, 1)} unit="br/min" />
        )}
        {/* Body Battery placeholder */}
        <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Body Battery</p>
          <p className="text-xl font-semibold text-gray-500">—</p>
          <p className="text-xs text-gray-600">Garmin Connect</p>
        </div>
      </div>

      {/* Readiness score + narrative */}
      {loading ? (
        <div className="bg-gray-900 rounded-xl p-4 animate-pulse h-28" />
      ) : data ? (
        <div className={`rounded-xl p-4 border ${bgClass}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Health Readiness</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${bgClass} ${scoreClass}`}>
              {data.readiness_label}
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-center">
              <p className={`text-5xl font-bold ${scoreClass}`}>{data.readiness_score}</p>
              <p className="text-xs text-gray-500 mt-0.5">/100</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{data.narrative}</p>
          </div>
        </div>
      ) : null}

      {/* Health trends chart */}
      {data && (
        <HealthTrendChart
          rhrTrend={data.rhr_trend}
          hrvTrend={data.hrv_trend}
          sleepTrend={data.sleep_trend}
          stressTrend={data.stress_trend}
          atlTrend={data.atl_trend}
        />
      )}

      {/* Wellbeing + Training load */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subjective wellbeing */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Subjective Wellbeing <span className="text-gray-600 font-normal">(7-day avg)</span>
          </h3>
          {data ? (
            <div className="space-y-3">
              <WellbeingBar label="Mood"       value={data.avg_mood}       />
              <WellbeingBar label="Motivation" value={data.avg_motivation} />
              <WellbeingBar label="Fatigue"    value={data.avg_fatigue}    invert />
              <WellbeingBar label="Soreness"   value={data.avg_soreness}   invert />
            </div>
          ) : (
            <p className="text-sm text-gray-600">No subjective data logged yet.</p>
          )}
        </div>

        {/* Training load impact */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Training Load Impact</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Acute Load (ATL)</span>
              <span className="text-gray-200 font-medium">{fmt(s.atl)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chronic Load (CTL)</span>
              <span className="text-gray-200 font-medium">{fmt(s.ctl)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Form (TSB)</span>
              <span className={`font-medium ${
                (s.tsb ?? 0) > 5 ? 'text-green-400' : (s.tsb ?? 0) < -15 ? 'text-red-400' : 'text-yellow-400'
              }`}>{fmt(s.tsb)}</span>
            </div>
            {s.readiness !== null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Intervals Readiness</span>
                <span className="text-gray-200 font-medium">{s.readiness}/100</span>
              </div>
            )}
            <div className="mt-2 p-2 bg-gray-800/60 rounded-lg text-xs text-gray-400">
              {s.atl !== null && s.ctl !== null
                ? s.atl > (s.ctl ?? 0) * 1.3
                  ? 'ATL is significantly above CTL — high fatigue phase. Recovery is key.'
                  : s.atl < (s.ctl ?? 0) * 0.7
                  ? 'ATL well below CTL — you have capacity to increase load safely.'
                  : 'ATL and CTL are balanced — sustainable training phase.'
                : 'Log more data to see training load analysis.'}
            </div>
          </div>
        </div>
      </div>

      {/* Correlations */}
      {data && data.correlations.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Cross-Metric Correlations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.correlations.map((c, i) => (
              <CorrelationCard key={i} c={c} />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">Based on {data.data_points} data points.</p>
        </div>
      )}

      {data && data.correlations.length === 0 && data.data_points < 10 && (
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            Cross-metric correlations appear once you have 10+ snapshots.
            Currently at <span className="text-gray-300">{data.data_points}</span>.
          </p>
        </div>
      )}
    </div>
  )
}
