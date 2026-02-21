import { useState, useEffect } from 'react'
import { fetchHrDrift } from '../../api'
import type { HrDriftData } from '../../types'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function HrDriftAnalysis() {
  const [data, setData] = useState<HrDriftData | null>(null)

  useEffect(() => {
    fetchHrDrift().then(setData).catch(() => {})
  }, [])

  if (!data) return null

  const trendColor =
    data.trend === 'improving' ? 'text-green-400' :
    data.trend === 'declining' ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">HR Drift Analysis</h3>
        <span className={`text-xs font-medium ${trendColor}`}>{data.trend}</span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{data.message}</p>
      {data.points.length > 2 && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={[...data.points].reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }} />
            <Line
              type="monotone" dataKey="z2_ratio" name="Z2 Ratio %"
              stroke={data.trend === 'improving' ? '#22c55e' : data.trend === 'declining' ? '#ef4444' : '#6b7280'}
              strokeWidth={2} dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
