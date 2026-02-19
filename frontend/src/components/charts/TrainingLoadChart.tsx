import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Snapshot } from '../../types'

interface Props { snapshots: Snapshot[] }

export default function TrainingLoadChart({ snapshots }: Props) {
  const data = snapshots.map(s => ({
    date: s.recorded_at.slice(0, 10),
    CTL:  s.ctl,
    ATL:  s.atl,
    TSB:  s.tsb,
  }))

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Training Load (CTL / ATL / TSB)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
          <Line type="monotone" dataKey="CTL" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ATL" stroke="#f97316" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="TSB" stroke="#a855f7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
