import { useState, useEffect } from 'react'
import { fetchSleepInsights } from '../../api'
import type { SleepInsightsData } from '../../types'

export default function SleepInsights() {
  const [data, setData] = useState<SleepInsightsData | null>(null)

  useEffect(() => {
    fetchSleepInsights().then(setData).catch(() => {})
  }, [])

  if (!data) return null

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sleep Insights</h3>
      <div className="space-y-3">
        {data.insights.map((insight, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-200">{insight.title}</p>
            <p className="text-sm text-gray-400 mt-1">{insight.finding}</p>
            <p className="text-xs text-blue-400 mt-1">{insight.recommendation}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-2">Based on {data.data_points} data points</p>
    </div>
  )
}
