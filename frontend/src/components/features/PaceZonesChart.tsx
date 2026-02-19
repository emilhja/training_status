import type { Snapshot } from '../../types'

interface Props {
  snapshot: Snapshot
}

export default function PaceZonesChart({ snapshot }: Props) {
  const zones = [
    { name: 'Z1', secs: snapshot.hr_zone_z1_secs || 0, color: 'bg-blue-500' },
    { name: 'Z2', secs: snapshot.hr_zone_z2_secs || 0, color: 'bg-green-500' },
    { name: 'Z3', secs: snapshot.hr_zone_z3_secs || 0, color: 'bg-yellow-500' },
    { name: 'Z4', secs: snapshot.hr_zone_z4_secs || 0, color: 'bg-orange-500' },
    { name: 'Z5', secs: snapshot.hr_zone_z5_secs || 0, color: 'bg-red-500' },
  ]

  const total = zones.reduce((sum, z) => sum + z.secs, 0)
  
  // Calculate insight
  const maxZone = zones.reduce((max, z) => z.secs > max.secs ? z : max, zones[0])
  let insight = ''
  if (maxZone.name === 'Z1' || maxZone.name === 'Z2') insight = 'Mostly aerobic - good base building!'
  else if (maxZone.name === 'Z3') insight = 'Tempo/threshold focused run'
  else if (maxZone.name === 'Z4' || maxZone.name === 'Z5') insight = 'High intensity - ensure adequate recovery'

  if (total === 0) return null

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Latest Run: Time in Zones</h3>
      
      {/* Horizontal bar */}
      <div className="h-6 flex rounded-full overflow-hidden mb-3">
        {zones.map(zone => {
          const pct = (zone.secs / total) * 100
          if (pct < 2) return null
          return (
            <div
              key={zone.name}
              className={`${zone.color} h-full relative group`}
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {pct > 10 ? zone.name : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {zones.map(zone => {
          const pct = (zone.secs / total) * 100
          const mins = Math.round(zone.secs / 60)
          return (
            <div key={zone.name} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${zone.color}`} />
              <span className="text-gray-400">
                {zone.name}: <span className="text-gray-200">{mins}m</span> ({pct.toFixed(0)}%)
              </span>
            </div>
          )
        })}
      </div>

      {/* Insight */}
      {insight && (
        <p className="mt-3 text-sm text-gray-400 italic">{insight}</p>
      )}
    </div>
  )
}
