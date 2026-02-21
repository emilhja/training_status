import { useState, useEffect } from 'react'
import { fetchOverload } from '../../api'
import type { OverloadResponse } from '../../types'

export default function OverloadTracker() {
  const [data, setData] = useState<OverloadResponse | null>(null)

  useEffect(() => {
    fetchOverload().then(setData).catch(() => {})
  }, [])

  if (!data || data.weeks.length === 0) return null

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Progressive Overload</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${data.safe ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {data.safe ? 'Safe' : 'Warning'}
        </span>
      </div>
      <div className="space-y-2">
        {data.weeks.map((w, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-400 w-36">{w.label}</span>
            <span className="text-gray-500 text-xs">{w.previous_km} → {w.current_km} km</span>
            <span className={`font-medium w-16 text-right ${w.flagged ? 'text-red-400' : w.change_pct > 0 ? 'text-green-400' : 'text-gray-400'}`}>
              {w.change_pct > 0 ? '+' : ''}{w.change_pct}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">{data.recommendation}</p>
    </div>
  )
}
