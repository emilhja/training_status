import { useState, useEffect } from 'react'
import { fetchPersonalRecords } from '../../api'
import type { PersonalRecord } from '../../types'

function formatTime(secs: number): string {
  const totalSec = Math.round(secs)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function PersonalRecords() {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonalRecords()
      .then((r) => setRecords(r.records))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>

  if (records.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Personal Records</h3>
        <p className="text-sm text-gray-600">
          No PRs detected yet. PRs are auto-detected from activities at standard distances (800m,
          1 Mile, 5K, 10K, Half Marathon, Marathon ±8%).
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Personal Records 🏆</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-gray-800">
            <th className="text-left py-1 pr-4">Distance</th>
            <th className="text-right py-1 pr-4">Time</th>
            <th className="text-right py-1 pr-4">Pace</th>
            <th className="text-right py-1">Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-gray-800/50">
              <td className="py-2 pr-4 font-medium text-gray-200">{r.distance_label}</td>
              <td className="py-2 pr-4 text-right text-green-400 font-mono">
                {formatTime(r.time_secs)}
              </td>
              <td className="py-2 pr-4 text-right text-gray-400 font-mono">{r.pace_str}</td>
              <td className="py-2 text-right text-gray-500">{r.activity_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
