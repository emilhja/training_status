import { useSnapshots } from '../../hooks/useSnapshots'
import type { Snapshot } from '../../types'

function tsbColor(tsb: number | null): string {
  if (tsb === null) return 'text-gray-400'
  if (tsb > 5)   return 'text-green-400'
  if (tsb > -10) return 'text-yellow-400'
  return 'text-red-400'
}

function fmt(v: number | null, d = 1): string {
  return v !== null ? v.toFixed(d) : '—'
}

const HEADERS: { label: string; key: keyof Snapshot; decimals?: number; color?: (s: Snapshot) => string }[] = [
  { label: 'Date/Time',  key: 'recorded_at' },
  { label: 'CTL',        key: 'ctl' },
  { label: 'ATL',        key: 'atl' },
  { label: 'TSB',        key: 'tsb',        color: s => tsbColor(s.tsb) },
  { label: 'A:C',        key: 'ac_ratio',   decimals: 2 },
  { label: 'HR',         key: 'resting_hr', decimals: 0 },
  { label: 'HRV',        key: 'hrv',        decimals: 0 },
  { label: 'Sleep',      key: 'sleep_score',decimals: 0 },
  { label: 'VO2max',     key: 'vo2max',     decimals: 1 },
  { label: 'W1 km',      key: 'week_1_km' },
  { label: 'W2 km',      key: 'week_2_km' },
  { label: 'W3 km',      key: 'week_3_km' },
  { label: 'W4 km',      key: 'week_4_km' },
  { label: 'Mo km',      key: 'last_month_km' },
]

function cellValue(s: Snapshot, col: typeof HEADERS[number]): string {
  const v = s[col.key]
  if (col.key === 'recorded_at') return String(v).replace('T', ' ').slice(0, 16)
  if (typeof v === 'number') return fmt(v, col.decimals ?? 1)
  return v !== null ? String(v) : '—'
}

export default function HistoryTab() {
  const { data, loading, error } = useSnapshots(90)

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!data || data.items.length === 0) return <p className="p-6 text-gray-500">No data yet.</p>

  return (
    <div className="py-6 px-4">
      <p className="text-xs text-gray-500 mb-3">{data.total} snapshots total</p>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {HEADERS.map(h => (
                <th key={h.key} className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap sticky top-0 bg-gray-900">
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map(s => (
              <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                {HEADERS.map(col => (
                  <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.color ? col.color(s) : 'text-gray-300'}`}>
                    {cellValue(s, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
