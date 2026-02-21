import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Snapshot, AnnotationItem } from '../../types'
import { fetchAnnotations } from '../../api'

interface Props { snapshots: Snapshot[] }

export default function HrvChart({ snapshots }: Props) {
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])

  useEffect(() => {
    fetchAnnotations('hrv').then(d => setAnnotations(d.items)).catch(() => {})
  }, [])

  const data = snapshots.map(s => ({
    date:         s.recorded_at.slice(0, 10),
    HRV:          s.hrv,
    'Resting HR': s.resting_hr,
  }))

  const dates = new Set(data.map(d => d.date))

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">HRV &amp; Resting HR</h3>
      <div className="h-[200px] sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis yAxisId="hrv" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis yAxisId="hr" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
          {annotations.filter(a => dates.has(a.annotation_date)).map(a => (
            <ReferenceLine key={a.id} yAxisId="hrv" x={a.annotation_date} stroke="#fbbf24" strokeDasharray="4 2" label={{ value: a.content, position: 'top', fill: '#fbbf24', fontSize: 10 }} />
          ))}
          <Line yAxisId="hrv" type="monotone" dataKey="HRV"         stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line yAxisId="hr"  type="monotone" dataKey="Resting HR"  stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
