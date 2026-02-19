import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Snapshot } from '../../types'

interface Props {
  snapshots: Snapshot[]
}

export default function Vo2maxChart({ snapshots }: Props) {
  // Filter snapshots with VO2max data
  const data = snapshots
    .filter(s => s.vo2max !== null)
    .map(s => ({
      date: s.recorded_at.slice(5, 10),
      vo2max: s.vo2max
    }))

  if (data.length < 2) {
    return <div className="text-sm text-gray-500 text-center py-8">Not enough VO2max data</div>
  }

  const trend = data[data.length - 1].vo2max! - data[0].vo2max!

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">VO2max Trend</h3>
        <span className={`text-xs font-medium ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)} ml/kg/min
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis 
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            width={30}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
            itemStyle={{ color: '#22c55e' }}
          />
          <Line 
            type="monotone" 
            dataKey="vo2max" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
