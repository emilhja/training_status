import { useMemo } from 'react'
import type { Snapshot } from '../../types'

interface Props {
  snapshots: Snapshot[]
}

export default function WeatherImpact({ snapshots }: Props) {
  const analysis = useMemo(() => {
    // Group runs by temperature range
    const ranges: Record<string, { count: number; avgPace?: number }> = {
      'cold': { count: 0 },    // < 5°C
      'cool': { count: 0 },    // 5-15°C
      'mild': { count: 0 },    // 15-25°C
      'warm': { count: 0 },    // > 25°C
    }

    snapshots.forEach(s => {
      if (s.weather_temp === null) return
      
      if (s.weather_temp < 5) ranges.cold.count++
      else if (s.weather_temp < 15) ranges.cool.count++
      else if (s.weather_temp < 25) ranges.mild.count++
      else ranges.warm.count++
    })

    const total = Object.values(ranges).reduce((sum, r) => sum + r.count, 0)
    if (total === 0) return null

    // Find preferred range
    const preferred = Object.entries(ranges).reduce((max, [key, val]) => 
      val.count > max.count ? { key, count: val.count } : max,
      { key: '', count: 0 }
    )

    const labels: Record<string, string> = {
      cold: 'Cold (< 5°C)',
      cool: 'Cool (5-15°C)',
      mild: 'Mild (15-25°C)',
      warm: 'Warm (> 25°C)'
    }

    return { ranges, total, preferred: labels[preferred.key] }
  }, [snapshots])

  if (!analysis) return null

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Weather Patterns</h3>
      
      <div className="space-y-3">
        {Object.entries(analysis.ranges).map(([key, data]) => {
          if (data.count === 0) return null
          const pct = (data.count / analysis.total) * 100
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-400">
                {key === 'cold' && '❄️ Cold'}
                {key === 'cool' && '🌤️ Cool'}
                {key === 'mild' && '☀️ Mild'}
                {key === 'warm' && '🔥 Warm'}
              </div>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    key === 'cold' ? 'bg-blue-500' :
                    key === 'cool' ? 'bg-green-500' :
                    key === 'mild' ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs text-gray-300">{data.count}</div>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-gray-400 mt-4">
        Most runs in: <span className="text-gray-200 font-medium">{analysis.preferred}</span>
      </p>
    </div>
  )
}
