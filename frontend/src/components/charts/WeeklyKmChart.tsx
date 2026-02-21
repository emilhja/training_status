import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import type { Snapshot } from '../../types'

interface Props { snapshot: Snapshot }

export default function WeeklyKmChart({ snapshot: s }: Props) {
  const data = [
    { week: 'W-0',       km: s.week_0_km },
    { week: 'W-1',       km: s.week_1_km },
    { week: 'W-2',       km: s.week_2_km },
    { week: 'W-3',       km: s.week_3_km },
    { week: 'W-4',       km: s.week_4_km },
  ]

  const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4', '#6366f1']

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Weekly Running (km)</h3>
      <div className="h-[200px] sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
            formatter={(v: number | undefined) => [`${v != null ? v.toFixed(1) : '—'} km`, 'Distance']}
          />
          <Bar dataKey="km" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
