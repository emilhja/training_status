import { useMemo } from 'react'
import type { Snapshot } from '../../types'

interface Props {
  snapshots: Snapshot[]
}

export default function CalendarHeatmap({ snapshots }: Props) {
  const heatmapData = useMemo(() => {
    // Group snapshots by date, taking the latest per day
    const byDate = new Map<string, number>()
    
    snapshots.forEach(s => {
      const date = s.recorded_at.slice(0, 10)
      // Use training_strain as intensity, or fallback to week_0_km change
      const intensity = s.training_strain || s.week_0_km || 0
      const existing = byDate.get(date) || 0
      if (intensity > existing) {
        byDate.set(date, intensity)
      }
    })
    
    // Get last 12 weeks
    const weeks: string[][] = []
    const today = new Date()
    
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (w * 7))
      
      const week: string[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + d)
        week.push(date.toISOString().slice(0, 10))
      }
      weeks.push(week)
    }
    
    return { weeks, byDate }
  }, [snapshots])

  const getIntensity = (date: string) => {
    const value = heatmapData.byDate.get(date)
    if (!value) return 0
    if (value > 300) return 4
    if (value > 200) return 3
    if (value > 100) return 2
    return 1
  }

  const intensityColors = [
    'bg-gray-800',
    'bg-green-900',
    'bg-green-700',
    'bg-green-500',
    'bg-green-400'
  ]

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity Heatmap (12 weeks)</h3>
      
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {dayLabels.map((d, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-xs text-gray-500">
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {heatmapData.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date, di) => {
                  const intensity = getIntensity(date)
                  const isToday = date === new Date().toISOString().slice(0, 10)
                  return (
                    <div
                      key={di}
                      className={`w-4 h-4 rounded-sm ${intensityColors[intensity]} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                      title={`${date}: ${heatmapData.byDate.get(date) || 'No data'}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {intensityColors.map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
