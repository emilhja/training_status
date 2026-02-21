import { useState, useEffect } from 'react'
import { fetchReadiness } from '../../api'
import type { ReadinessScoreData } from '../../types'

export default function ReadinessScore() {
  const [data, setData] = useState<ReadinessScoreData | null>(null)

  useEffect(() => {
    fetchReadiness().then(setData).catch(() => {})
  }, [])

  if (!data) return null

  const colorClass =
    data.score >= 80 ? 'text-green-400' :
    data.score >= 60 ? 'text-blue-400' :
    data.score >= 40 ? 'text-yellow-400' : 'text-red-400'

  const bgClass =
    data.score >= 80 ? 'bg-green-500/10 border-green-500/30' :
    data.score >= 60 ? 'bg-blue-500/10 border-blue-500/30' :
    data.score >= 40 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'

  const components = [
    { label: 'TSB', value: data.components.tsb },
    { label: 'HRV Trend', value: data.components.hrv_trend },
    { label: 'Sleep', value: data.components.sleep },
    { label: 'Fatigue', value: data.components.fatigue },
    { label: 'Soreness', value: data.components.soreness },
  ]

  return (
    <div className={`rounded-xl p-4 border ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Training Readiness</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${bgClass} ${colorClass}`}>{data.label}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-bold ${colorClass}`}>{data.score}</div>
        <div className="flex-1 space-y-1.5">
          {components.map(c => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">{c.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${(c.value ?? 0) >= 70 ? 'bg-green-500' : (c.value ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, c.value ?? 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
