import type { Snapshot } from '../../types'

interface Props {
  snapshot: Snapshot
}

export default function FatiguePattern({ snapshot }: Props) {
  const am = snapshot.days_run_am || 0
  const pm = snapshot.days_run_pm || 0
  const both = snapshot.days_run_both || 0
  const total = am + pm + both

  if (total === 0) return null

  const amPct = (am / total) * 100
  const pmPct = (pm / total) * 100

  const dominant = am > pm ? 'AM' : 'PM'
  const suggestion = dominant === 'PM' 
    ? '67% of runs are PM - consider morning runs for better consistency?'
    : 'Good morning running habit!'

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Time of Day Pattern</h3>
      
      {/* Donut-like visualization */}
      <div className="flex items-center justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{am}</div>
          <div className="text-xs text-gray-500">AM Runs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{pm}</div>
          <div className="text-xs text-gray-500">PM Runs</div>
        </div>
        {both > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{both}</div>
            <div className="text-xs text-gray-500">Both</div>
          </div>
        )}
      </div>

      {/* Bars */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs text-gray-400">AM</span>
          <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${amPct}%` }} />
          </div>
          <span className="w-10 text-right text-xs text-gray-300">{amPct.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs text-gray-400">PM</span>
          <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${pmPct}%` }} />
          </div>
          <span className="w-10 text-right text-xs text-gray-300">{pmPct.toFixed(0)}%</span>
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-4">{suggestion}</p>
    </div>
  )
}
