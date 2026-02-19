import { useEffect, useState } from 'react'
import { fetchRecommendation } from '../../api'
import type { Recommendation as RecommendationType } from '../../types'

export default function RecoveryRecommendation() {
  const [rec, setRec] = useState<RecommendationType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendation()
      .then(data => setRec(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>
  if (!rec) return null

  const colorClasses = {
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
  }

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[rec.color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{rec.recommendation.split(' ')[0]}</span>
        <div>
          <h3 className="font-semibold">{rec.recommendation.split(' ').slice(1).join(' ')}</h3>
          {rec.urgency === 'high' && (
            <span className="text-xs px-2 py-0.5 bg-red-500/30 rounded">High Priority</span>
          )}
        </div>
      </div>
      <p className="text-sm opacity-80">{rec.reason}</p>
    </div>
  )
}
