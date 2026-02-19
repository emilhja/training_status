import { useEffect, useState } from 'react'
import { fetchGoals } from '../../api'
import type { Snapshot, Goal } from '../../types'

interface Props {
  snapshot: Snapshot
}

export default function GoalProgress({ snapshot }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
      .then(data => setGoals(data.items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading goals...</div>
  if (goals.length === 0) return null

  const getGoalProgress = (goal: Goal) => {
    const current = snapshot.week_0_km || 0
    const target = goal.target_value
    const pct = Math.min(100, (current / target) * 100)
    const remaining = Math.max(0, target - current)
    const daysLeft = 7 - new Date().getDay()
    const paceNeeded = daysLeft > 0 ? remaining / daysLeft : 0
    
    return { current, target, pct, remaining, paceNeeded, daysLeft }
  }

  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500'
    if (pct >= 70) return 'bg-yellow-500'
    if (pct >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatus = (pct: number, daysLeft: number) => {
    const daysNeeded = daysLeft / (pct / 100)
    if (daysNeeded <= 7) return { text: 'On track!', color: 'text-green-400' }
    if (daysNeeded <= 8) return { text: 'Close', color: 'text-yellow-400' }
    return { text: 'Behind pace', color: 'text-red-400' }
  }

  return (
    <div className="space-y-4">
      {goals.filter(g => g.goal_type === 'weekly_km').map(goal => {
        const { current, target, pct, remaining, paceNeeded, daysLeft } = getGoalProgress(goal)
        const status = getStatus(pct, daysLeft)
        
        return (
          <div key={goal.id} className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300">Weekly Goal</h3>
              <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-gray-100">{current.toFixed(1)}</span>
              <span className="text-sm text-gray-500">/ {target} km</span>
              <span className="text-sm text-gray-400">({pct.toFixed(0)}%)</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full ${getColor(pct)} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            
            {/* Sub info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{remaining.toFixed(1)} km remaining</span>
              <span>{daysLeft} days left • need {paceNeeded.toFixed(1)} km/day</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
