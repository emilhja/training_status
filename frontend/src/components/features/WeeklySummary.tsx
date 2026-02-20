import { useState, useEffect } from 'react'
import { fetchWeeklySummary } from '../../api'
import type { WeeklySummary as WeeklySummaryType } from '../../types'

export default function WeeklySummary() {
  const [data, setData] = useState<WeeklySummaryType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklySummary()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>
  if (!data) return null

  const trendIcon =
    data.tsb_trend === 'improving' ? '↑' : data.tsb_trend === 'declining' ? '↓' : '→'
  const trendColor =
    data.tsb_trend === 'improving'
      ? 'text-green-400'
      : data.tsb_trend === 'declining'
        ? 'text-red-400'
        : 'text-gray-400'

  const ctlArrow =
    data.ctl_change === null
      ? null
      : data.ctl_change > 0
        ? `+${data.ctl_change}`
        : String(data.ctl_change)
  const ctlColor =
    data.ctl_change === null
      ? 'text-gray-400'
      : data.ctl_change > 0
        ? 'text-green-400'
        : data.ctl_change < 0
          ? 'text-red-400'
          : 'text-gray-400'

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">This Week</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ctlArrow !== null && (
          <div>
            <p className="text-xs text-gray-500">CTL change</p>
            <p className={`text-lg font-semibold ${ctlColor}`}>{ctlArrow}</p>
          </div>
        )}
        {data.total_km !== null && (
          <div>
            <p className="text-xs text-gray-500">Weekly km</p>
            <p className="text-lg font-semibold text-gray-200">{data.total_km}</p>
          </div>
        )}
        {data.avg_hrv !== null && (
          <div>
            <p className="text-xs text-gray-500">Avg HRV</p>
            <p className="text-lg font-semibold text-gray-200">{data.avg_hrv}</p>
          </div>
        )}
        {data.rest_days !== null && (
          <div>
            <p className="text-xs text-gray-500">Rest days</p>
            <p className="text-lg font-semibold text-gray-200">{data.rest_days}</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <span>TSB trend:</span>
        <span className={`font-medium ${trendColor}`}>
          {trendIcon} {data.tsb_trend}
        </span>
      </div>
    </div>
  )
}
