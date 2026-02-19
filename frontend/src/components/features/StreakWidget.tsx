import type { Snapshot } from '../../types'

interface Props {
  snapshot: Snapshot
}

export default function StreakWidget({ snapshot }: Props) {
  const bestStreak = snapshot.longest_streak || 0
  const restDays = snapshot.rest_days || 0

  // The API provides longest_streak (all-time best) but not a separate current-streak
  // counter. We approximate: if rest_days is 0, the user ran today and the streak
  // is still alive; otherwise the current streak has been broken.
  const currentStreak = restDays === 0 ? bestStreak : 0

  // Generate a 14-day visual: mark the last `restDays` slots as rest.
  const days = Array(14).fill(null).map((_, i) => i < (14 - restDays) ? 'active' : 'rest')

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Streak Status</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-200">{currentStreak}</p>
          <p className="text-xs text-gray-500">Current Streak</p>
          <p className="text-[10px] text-gray-600 mt-0.5">{restDays > 0 ? 'streak broken' : 'if ran today'}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-400">{bestStreak}</p>
          <p className="text-xs text-gray-500">Best Streak</p>
          {snapshot.longest_streak_date && (
            <p className="text-[10px] text-gray-600 mt-0.5">{snapshot.longest_streak_date.slice(0, 10)}</p>
          )}
        </div>
      </div>

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

      {restDays > 3 && (
        <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-400 text-center">
          ⚠️ {restDays} rest days — consider an easy run
        </div>
      )}
    </div>
  )
}
