import { useEffect, useState } from 'react'
import { fetchConsistencyScore } from '../../api'
import type { ConsistencyScore as ConsistencyScoreType } from '../../types'

export default function ConsistencyScore() {
  const [score, setScore] = useState<ConsistencyScoreType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConsistencyScore()
      .then(data => setScore(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>
  if (!score || score.score === null) return null

  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-400'
    if (s >= 60) return 'text-yellow-400'
    if (s >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getBgColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-yellow-500'
    if (s >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Consistency Score</h3>
        <span className={`text-2xl font-bold ${getColor(score.score)}`}>{score.score}</span>
      </div>
      
      {/* Score bar */}
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${getBgColor(score.score)} transition-all duration-500`}
          style={{ width: `${score.score}%` }}
        />
      </div>

      <p className="text-sm text-gray-400 mb-3">{score.assessment}</p>

      {/* Breakdown */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Volume Consistency</span>
          <span className="text-gray-300">{score.volume_score}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Rest Pattern</span>
          <span className="text-gray-300">{score.rest_score}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Training Variety</span>
          <span className="text-gray-300">{score.monotony_score}/100</span>
        </div>
      </div>
    </div>
  )
}
