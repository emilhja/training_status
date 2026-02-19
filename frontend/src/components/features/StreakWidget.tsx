import type { Snapshot } from '../../types'

interface Props {
  snapshot: Snapshot
}

export default function StreakWidget({ snapshot }: Props) {
  const currentStreak = snapshot.longest_streak || 0
  const longestStreak = snapshot.longest_streak || 0 // Could track current separately
  const restDays = snapshot.rest_days || 0

  // Generate visual streak
  const days = Array(14).fill(null).map((_, i) => {
    if (i < (14 - restDays)) return 'active'
    return 'rest'
  })

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Streak Status</h3>
      
      {/* Current vs Longest */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-200">{restDays === 0 ? currentStreak : 0}</p>
          <p className="text-xs text-gray-500">Current Streak</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-400">{longestStreak}</p>
          <p className="text-xs text-gray-500">Best Streak</p>
        </div>
      </div>

      {/* Visual streak indicator */}
      <div className="flex gap-1 justify-center">
        {days.map((status, i) => (
          <div
            key={i}
            className={`w-5 h-8 rounded-sm ${
              status === 'active' 
                ? 'bg-green-500' 
                : 'bg-gray-800 border border-gray-700'
            }`}
            title={status === 'active' ? 'Run day' : 'Rest day'}
          />
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">Last 14 days</p>

      {/* Rest days alert */}
      {restDays > 3 && (
        <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-400 text-center">
          ⚠️ {restDays} rest days - consider an easy run
        </div>
      )}
    </div>
  )
}
