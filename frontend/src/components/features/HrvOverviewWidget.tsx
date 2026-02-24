import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { Snapshot } from '../../types'

interface Props { snapshots: Snapshot[] }

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function barColor(value: number, baseline: number): string {
  const ratio = value / baseline
  if (ratio >= 1.05) return 'bg-green-500'
  if (ratio >= 0.95) return 'bg-yellow-400'
  return 'bg-red-500'
}

export default function HrvOverviewWidget({ snapshots }: Props) {
  // Need at least a few data points
  const withHrv = snapshots.filter(s => s.hrv != null)
  if (withHrv.length < 3) return null

  // Build a date → HRV map (snapshots are oldest→newest)
  const byDate: Record<string, number> = {}
  for (const s of withHrv) {
    byDate[s.recorded_at.slice(0, 10)] = s.hrv!
  }

  // Baseline: median of last 30 available values
  const last30 = withHrv.slice(-30).map(s => s.hrv!)
  const baseline = median(last30)

  // 7-day average
  const last7 = withHrv.slice(-7).map(s => s.hrv!)
  const avg7 = Math.round(last7.reduce((a, b) => a + b, 0) / last7.length)

  // Bars: last 28 days
  const today = new Date()
  const bars: { date: string; value: number | null }[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    bars.push({ date: iso, value: byDate[iso] ?? null })
  }

  // Trend line: last 28 days with value
  const trendData = bars
    .filter(b => b.value != null)
    .map(b => ({ date: b.date.slice(5), hrv: b.value }))

  // Min/max for bar scaling
  const allValues = bars.map(b => b.value).filter((v): v is number => v != null)
  const minV = Math.min(...allValues)
  const maxV = Math.max(...allValues)
  const range = maxV - minV || 1

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">HRV</h3>

      {/* Summary */}
      <div className="flex items-end gap-3 mb-4">
        <div>
          <span className="text-3xl font-bold text-gray-100">{avg7}</span>
          <span className="text-sm text-gray-500 ml-1">ms</span>
        </div>
        <span className="text-xs text-gray-500 mb-1">7d avg</span>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Baseline</p>
          <p className="text-sm font-medium text-gray-400">{Math.round(baseline)} ms</p>
        </div>
      </div>

      {/* Colored bars */}
      <div className="flex items-end gap-0.5 h-14 mb-1">
        {bars.map((b, i) => {
          if (b.value == null) {
            return <div key={i} className="flex-1 bg-gray-800 rounded-sm" style={{ height: '20%' }} />
          }
          const heightPct = 25 + ((b.value - minV) / range) * 75
          return (
            <div key={i} className="flex-1 group relative flex items-end">
              <div
                className={`w-full rounded-sm ${barColor(b.value, baseline)}`}
                style={{ height: `${heightPct}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-700 text-gray-100 text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  {b.date.slice(5)} · {b.value} ms
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Date labels: first and last */}
      <div className="flex justify-between text-[10px] text-gray-600 mb-3">
        <span>{bars[0].date.slice(5)}</span>
        <span>Today</span>
      </div>

      {/* Trend line */}
      <div className="border-t border-gray-800 pt-3">
        <p className="text-[10px] text-gray-600 mb-1">Last 4 weeks</p>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={trendData}>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px', fontSize: 11 }}
                formatter={(v: number | undefined) => v != null ? [`${v} ms`, 'HRV'] : ['—', 'HRV']}
                labelFormatter={l => l}
              />
              <Line type="monotone" dataKey="hrv" stroke="#22c55e" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> Above baseline</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400 inline-block" /> Near baseline</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Below baseline</span>
      </div>
    </div>
  )
}
