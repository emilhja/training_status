import {
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { Snapshot } from '../../types'

interface Props {
  snapshots: Snapshot[]
}

export default function TsbZonesChart({ snapshots }: Props) {
  const data = [...snapshots]
    .reverse()
    .map((s) => ({
      date: s.recorded_at.slice(0, 10),
      TSB: s.tsb,
    }))

  if (data.length === 0) return null

  const tsbValues = data.map((d) => d.TSB).filter((v): v is number => v !== null)
  const minTsb = Math.min(...tsbValues, -35)
  const maxTsb = Math.max(...tsbValues, 30)

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
        TSB Training Zones
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Green = Fresh · Blue = Grey Zone · Red = Overreaching
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis domain={[minTsb - 5, maxTsb + 5]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
          />

          {/* Zone bands */}
          <ReferenceArea y1={5} y2={maxTsb + 5} fill="#16a34a" fillOpacity={0.08} />
          <ReferenceArea y1={-10} y2={5} fill="#3b82f6" fillOpacity={0.08} />
          <ReferenceArea y1={minTsb - 5} y2={-10} fill="#ef4444" fillOpacity={0.08} />

          {/* Zero line */}
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" />
          <ReferenceLine y={5} stroke="#16a34a" strokeDasharray="2 4" strokeOpacity={0.5} />
          <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="2 4" strokeOpacity={0.5} />

          <Line
            type="monotone"
            dataKey="TSB"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-900 inline-block" /> Fresh (TSB &gt; 5)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-900 inline-block" /> Grey Zone (−10 to 5)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-900 inline-block" /> Overreaching (&lt; −10)
        </span>
      </div>
    </div>
  )
}
