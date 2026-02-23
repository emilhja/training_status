import { useState, useEffect } from 'react'
import { fetchWorkoutSuggestion } from '../../api'
import type { WorkoutSuggestionData } from '../../types'

export default function WorkoutSuggestion() {
  const [data, setData] = useState<WorkoutSuggestionData | null>(null)

  useEffect(() => {
    fetchWorkoutSuggestion().then(setData).catch(() => {})
  }, [])

  if (!data) return null

  const borderColor: Record<string, string> = {
    red: 'border-red-500/40', yellow: 'border-yellow-500/40',
    green: 'border-green-500/40', blue: 'border-blue-500/40',
  }
  const iconColor: Record<string, string> = {
    red: 'text-red-400', yellow: 'text-yellow-400',
    green: 'text-green-400', blue: 'text-blue-400',
  }
  const typeIcons: Record<string, string> = {
    rest: '🛌', done: '✅', easy: '🚶', long: '🏃', tempo: '⚡', interval: '🔥',
  }

  const ageH = data.data_age_hours
  const isStale = ageH !== undefined && ageH >= 12
  const ageLabel = ageH !== undefined
    ? ageH < 24 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`
    : null

  return (
    <div className={`bg-gray-900 rounded-xl p-4 border ${borderColor[data.color] ?? 'border-gray-800'}`}>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Today's Workout</h3>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{typeIcons[data.type] ?? '🏃'}</span>
        <div className="flex-1">
          <p className={`text-lg font-semibold ${iconColor[data.color] ?? 'text-gray-200'}`}>{data.title}</p>
          <p className="text-sm text-gray-400 mt-1">{data.description}</p>
          {data.duration_min > 0 && (
            <span className="inline-block mt-2 text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
              ~{data.duration_min} min
            </span>
          )}
        </div>
      </div>
      {isStale && (
        <p className="mt-3 text-xs text-gray-500 border-t border-gray-800 pt-2">
          Last synced {ageLabel} — refresh if you've already trained today.
        </p>
      )}
    </div>
  )
}
