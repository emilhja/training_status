import type { Snapshot } from '../../types'

interface Props {
  snapshots: Snapshot[]
  dataKey: keyof Snapshot
  color?: string
  height?: number
}

export default function SparklineChart({ snapshots, dataKey, color = '#22c55e', height = 40 }: Props) {
  // Get last 7 snapshots
  const data = snapshots.slice(-7).map(s => s[dataKey] as number | null).filter(v => v !== null) as number[]
  
  if (data.length < 2) return <div className="text-xs text-gray-500">Not enough data</div>

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const W = 120

  // Create SVG path
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const lastValue = data[data.length - 1]
  const prevValue = data[data.length - 2]
  const change = lastValue - prevValue
  const trend = change > 0 ? '↑' : change < 0 ? '↓' : '→'

  return (
    <div className="flex items-center gap-3">
      <svg width={W} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        {/* Dot at end */}
        <circle
          cx={W}
          cy={height - ((lastValue - min) / range) * height}
          r="3"
          fill={color}
        />
      </svg>
      <div className="text-sm">
        <span className="font-medium text-gray-200">{lastValue.toFixed(1)}</span>
        <span className={`ml-1 text-xs ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {trend} {Math.abs(change).toFixed(1)}
        </span>
      </div>
    </div>
  )
}
