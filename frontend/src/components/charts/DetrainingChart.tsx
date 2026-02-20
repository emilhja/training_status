import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { fetchDetraining } from '../../api'
import type { DetrainingResponse } from '../../types'

export default function DetrainingChart() {
  const [data, setData] = useState<DetrainingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDetraining()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>
  if (!data || data.points.length === 0) return null

  const chartData = data.points.map((p) => ({
    week: p.week === 0 ? 'Now' : `W${p.week}`,
    CTL: p.ctl,
    ATL: p.atl,
    TSB: p.tsb,
  }))

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
        Detraining Estimator
      </h3>
      <p className="text-xs text-gray-600 mb-4">{data.message}</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="CTL"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="ATL"
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="TSB"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
