// DiffView: side-by-side snapshot comparison — Feature B
import { useState, useMemo } from 'react'
import type { Snapshot } from '../types'

interface Props {
  snapshots: Snapshot[]
}

interface MetricDef {
  key: keyof Snapshot
  label: string
  unit?: string
  higherIsBetter?: boolean  // undefined = neutral
  format?: (v: number) => string
}

const METRICS: MetricDef[] = [
  { key: 'ctl',          label: 'CTL (Fitness)',        higherIsBetter: true },
  { key: 'atl',          label: 'ATL (Fatigue)',        higherIsBetter: false },
  { key: 'tsb',          label: 'TSB (Form)',           higherIsBetter: true },
  { key: 'ramp_rate',    label: 'Ramp Rate',            higherIsBetter: undefined },
  { key: 'hrv',          label: 'HRV',    unit: 'ms',   higherIsBetter: true },
  { key: 'resting_hr',   label: 'Resting HR', unit: 'bpm', higherIsBetter: false },
  { key: 'sleep_score',  label: 'Sleep Score', unit: '/100', higherIsBetter: true },
  { key: 'vo2max',       label: 'VO2max',               higherIsBetter: true },
  { key: 'weight',       label: 'Weight',   unit: 'kg', higherIsBetter: undefined },
  { key: 'week_0_km',    label: 'This Week', unit: 'km', higherIsBetter: true },
  { key: 'critical_speed', label: 'Critical Speed', unit: 'm/s', higherIsBetter: true },
  { key: 'stress',       label: 'Stress',               higherIsBetter: false },
  { key: 'readiness',    label: 'Readiness',            higherIsBetter: true },
  { key: 'mood',         label: 'Mood',      unit: '/5', higherIsBetter: true },
  { key: 'fatigue',      label: 'Fatigue',   unit: '/5', higherIsBetter: false },
  { key: 'soreness',     label: 'Soreness',  unit: '/5', higherIsBetter: false },
  { key: 'motivation',   label: 'Motivation', unit: '/5', higherIsBetter: true },
]

function fmt(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(decimals)
}

function DeltaCell({ a, b, higherIsBetter }: { a: number | null | undefined; b: number | null | undefined; higherIsBetter?: boolean }) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return <td className="px-3 py-2 text-center text-gray-600 text-sm">—</td>
  }
  const delta = b - a
  if (Math.abs(delta) < 0.01) {
    return <td className="px-3 py-2 text-center text-gray-400 text-sm">0</td>
  }
  let color = 'text-gray-400'
  if (higherIsBetter !== undefined) {
    const improved = higherIsBetter ? delta > 0 : delta < 0
    color = improved ? 'text-green-400' : 'text-red-400'
  }
  return (
    <td className={`px-3 py-2 text-center text-sm font-medium ${color}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}
    </td>
  )
}

export default function DiffView({ snapshots }: Props) {
  // Deduplicate to one snapshot per day (latest per date)
  const byDate = useMemo(() => {
    const map = new Map<string, Snapshot>()
    for (const s of snapshots) {
      const date = s.recorded_at.slice(0, 10)
      map.set(date, s)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))  // newest first
  }, [snapshots])

  const dates = byDate.map(([d]) => d)
  const [dateA, setDateA] = useState<string>(dates[1] ?? dates[0] ?? '')
  const [dateB, setDateB] = useState<string>(dates[0] ?? '')

  const snapA = useMemo(() => byDate.find(([d]) => d === dateA)?.[1], [byDate, dateA])
  const snapB = useMemo(() => byDate.find(([d]) => d === dateB)?.[1], [byDate, dateB])

  if (snapshots.length < 2) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">Not enough data</p>
        <p className="text-sm">Need at least 2 snapshots to compare.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date pickers */}
      <div className="flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Snapshot A (baseline)</label>
          <select
            value={dateA}
            onChange={e => setDateA(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {dates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="text-2xl text-gray-600 pb-1">⇄</div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Snapshot B (compare to)</label>
          <select
            value={dateB}
            onChange={e => setDateB(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {dates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison table */}
      {snapA && snapB ? (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wider w-40">Metric</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 uppercase tracking-wider">{dateA}</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 uppercase tracking-wider">{dateB}</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 uppercase tracking-wider">Delta</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map(({ key, label, unit, higherIsBetter }) => {
                const vA = snapA[key] as number | null | undefined
                const vB = snapB[key] as number | null | undefined
                const hasData = vA !== null && vA !== undefined && vB !== null && vB !== undefined
                return (
                  <tr key={key} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-2 text-gray-400 text-xs">
                      {label}{unit ? <span className="text-gray-600 ml-1">{unit}</span> : null}
                    </td>
                    <td className={`px-3 py-2 text-center font-medium ${hasData ? 'text-gray-200' : 'text-gray-600'}`}>
                      {fmt(vA)}
                    </td>
                    <td className={`px-3 py-2 text-center font-medium ${hasData ? 'text-gray-200' : 'text-gray-600'}`}>
                      {fmt(vB)}
                    </td>
                    <DeltaCell a={vA} b={vB} higherIsBetter={higherIsBetter} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Select two different dates to compare.</p>
      )}

      <p className="text-xs text-gray-600">
        Delta = B minus A. Green = improvement, red = regression. Grey = neutral metric.
      </p>
    </div>
  )
}
