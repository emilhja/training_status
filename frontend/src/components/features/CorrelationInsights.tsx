import { useEffect, useState } from 'react'
import { fetchCorrelations } from '../../api'
import type { CorrelationInsight } from '../../types'

const typeIcons: Record<string, string> = {
  volume_recovery: '📊',
  weather: '🌤️',
  sleep_recovery: '😴',
  rest_recovery: '🛌',
  default: '💡'
}

export default function CorrelationInsights() {
  const [data, setData] = useState<{ insights: CorrelationInsight[]; data_points: number; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCorrelations()
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Analyzing patterns...</div>
  if (!data) return null

  if (data.insights.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Pattern Insights</h3>
        <p className="text-sm text-gray-500">{data.message}</p>
        <p className="text-xs text-gray-600 mt-2">Keep logging daily - patterns emerge with 15+ data points.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pattern Insights</h3>
        <span className="text-xs text-gray-500">{data.data_points} data points</span>
      </div>

      <div className="space-y-3">
        {data.insights.map((insight, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{typeIcons[insight.type] || typeIcons.default}</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-300">{insight.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{insight.description}</p>
                <p className="text-xs text-green-400 mt-2">💡 {insight.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
