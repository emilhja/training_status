import { useEffect, useState } from 'react'
import { fetchProjections } from '../../api'
import type { Projection } from '../../types'

export default function ProjectionsChart() {
  const [projections, setProjections] = useState<Projection[]>([])
  const [daysToPositive, setDaysToPositive] = useState<number | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjections()
      .then(data => {
        setProjections(data.projections || [])
        setDaysToPositive(data.days_to_positive_tsb)
      })
      .catch(err => {
        console.error('Failed to fetch projections:', err)
        setError('Failed to load projections')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading projections...</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>
  
  if (projections.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">7-Day Projection</h3>
        <p className="text-sm text-gray-500">No projection data available.</p>
      </div>
    )
  }

  // Fixed range for better visual comparison (-20 to +20 TSB)
  const MIN_DISPLAY = -20
  const MAX_DISPLAY = 20
  const RANGE = MAX_DISPLAY - MIN_DISPLAY

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">7-Day Recovery Projection</h3>
        <span className="text-xs text-gray-500">If you rest 🛌</span>
      </div>

      {/* Recovery countdown pill */}
      {daysToPositive !== undefined && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3
          ${daysToPositive === null
            ? 'bg-green-900/40 text-green-400'
            : 'bg-orange-900/40 text-orange-400'}`}>
          {daysToPositive === null
            ? '✓ TSB already positive — you\'re fresh'
            : `⏱ TSB turns positive in ${daysToPositive} day${daysToPositive !== 1 ? 's' : ''}`}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mb-4">
        Projected Form (TSB) if you take complete rest. Higher = more recovered.
      </p>
      
      <div className="relative flex items-end gap-1 h-40 px-1">
        {/* Background zones */}
        <div className="absolute inset-0 flex flex-col opacity-20">
          <div className="flex-1 bg-green-500" /> {/* Fresh zone */}
          <div className="h-[1px] bg-gray-500" /> {/* Zero line */}
          <div className="flex-1 bg-red-500" /> {/* Overreach zone */}
        </div>
        
        {/* Zero line label */}
        <div className="absolute left-0 right-0 top-1/2 border-t border-gray-500 z-10">
          <span className="absolute -right-8 -top-2 text-[10px] text-gray-500">0</span>
        </div>
        
        {/* Zone labels */}
        <div className="absolute left-1 top-1 text-[10px] text-green-400 font-medium">Fresh</div>
        <div className="absolute left-1 bottom-1 text-[10px] text-red-400 font-medium">Fatigued</div>
        
        {projections.map((p, i) => {
          // Calculate position relative to fixed range
          const pct = ((p.tsb - MIN_DISPLAY) / RANGE) * 100
          const clampedPct = Math.max(2, Math.min(98, pct))
          
          // Determine color based on TSB value
          let colorClass = 'bg-gray-500'
          let glowClass = ''
          if (p.tsb > 5) {
            colorClass = 'bg-gradient-to-t from-green-600 to-green-400'
            glowClass = 'shadow-lg shadow-green-500/30'
          } else if (p.tsb > -10) {
            colorClass = 'bg-gradient-to-t from-yellow-600 to-yellow-400'
            glowClass = 'shadow-lg shadow-yellow-500/20'
          } else {
            colorClass = 'bg-gradient-to-t from-red-600 to-red-400'
            glowClass = 'shadow-lg shadow-red-500/30'
          }
          
          // Add emoji indicator for readiness
          let emoji = '😴'
          if (p.tsb > 10) emoji = '🔥'
          else if (p.tsb > 5) emoji = '✅'
          else if (p.tsb > -5) emoji = '😐'
          else if (p.tsb > -15) emoji = '😓'
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 relative z-20">
              {/* TSB value */}
              <div className={`text-xs font-bold ${p.tsb > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p.tsb > 0 ? '+' : ''}{p.tsb.toFixed(0)}
              </div>
              
              {/* Emoji indicator */}
              <div className="text-sm">{emoji}</div>
              
              {/* Bar container */}
              <div className="w-full h-20 relative">
                {/* The bar - positioned from bottom */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 w-6 ${colorClass} ${glowClass} rounded-t transition-all duration-500`}
                  style={{ 
                    bottom: `${clampedPct}%`,
                    height: p.tsb >= 0 ? '4px' : `${Math.min(100 - clampedPct, 40)}px`,
                    minHeight: '4px'
                  }}
                  title={`Day ${p.day}: TSB ${p.tsb.toFixed(1)} (${p.zone})`}
                />
                
                {/* Dot marker at the value position */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-gray-900 ${
                    p.tsb > 5 ? 'bg-green-400' : p.tsb > -10 ? 'bg-yellow-400' : 'bg-red-400'
                  } transition-all duration-500`}
                  style={{ bottom: `${clampedPct}%` }}
                />
              </div>
              
              {/* Day label */}
              <div className="text-[10px] text-gray-500 font-medium">
                {p.day === 1 ? '1d' : `+${p.day}d`}
              </div>
              
              {/* Zone label for first and last */}
              {(i === 0 || i === projections.length - 1) && (
                <div className={`text-[9px] ${p.tsb > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {p.zone}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
          <div className="w-3 h-3 rounded bg-green-500" />
          <div>
            <div className="text-green-400 font-medium">Fresh</div>
            <div className="text-gray-500 text-[10px]">TSB &gt; 5</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <div>
            <div className="text-yellow-400 font-medium">Grey Zone</div>
            <div className="text-gray-500 text-[10px]">-10 to 5</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded">
          <div className="w-3 h-3 rounded bg-red-500" />
          <div>
            <div className="text-red-400 font-medium">Overreach</div>
            <div className="text-gray-500 text-[10px]">TSB &lt; -10</div>
          </div>
        </div>
      </div>

      {/* Summary text */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
        <p className="text-sm text-gray-300">
          {projections[projections.length - 1].tsb > 5 
            ? '✅ After 7 days rest, you\'ll be fully recovered and ready for hard training!'
            : projections[projections.length - 1].tsb > 0
            ? `⚠️ You'll reach positive TSB around day ${projections.findIndex(p => p.tsb > 0) + 1}. Almost there!`
            : '🔴 You need more than 7 days of rest to fully recover. Consider a very light week.'
          }
        </p>
      </div>
    </div>
  )
}
