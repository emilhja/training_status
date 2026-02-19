import type { Snapshot } from '../../types'

interface Props {
  snapshot: Snapshot
}

export default function CompareMode({ snapshot }: Props) {
  const thisWeek = snapshot.week_0_km || 0
  const lastWeek = snapshot.week_1_km || 0
  const avg4Week = ((snapshot.week_1_km || 0) + (snapshot.week_2_km || 0) + 
                    (snapshot.week_3_km || 0) + (snapshot.week_4_km || 0)) / 4

  const changeVsLast = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0
  const changeVsAvg = avg4Week > 0 ? ((thisWeek - avg4Week) / avg4Week) * 100 : 0

  const maxVal = Math.max(thisWeek, lastWeek, avg4Week) * 1.2

  const Bar = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{value.toFixed(1)} km</span>
      </div>
      <div className="h-6 bg-gray-800 rounded overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, (value / maxVal) * 100)}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Volume Comparison</h3>
      
      <div className="space-y-4">
        <Bar value={thisWeek} label="This Week" color="bg-blue-500" />
        <Bar value={lastWeek} label="Last Week" color="bg-gray-600" />
        <Bar value={avg4Week} label="4-Week Average" color="bg-green-600" />
      </div>

      {/* Change indicators */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500">vs Last Week</p>
          <p className={`text-lg font-semibold ${changeVsLast >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {changeVsLast >= 0 ? '+' : ''}{changeVsLast.toFixed(0)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">vs 4-Week Avg</p>
          <p className={`text-lg font-semibold ${changeVsAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {changeVsAvg >= 0 ? '+' : ''}{changeVsAvg.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  )
}
