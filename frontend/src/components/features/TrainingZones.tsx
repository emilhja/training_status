import { useState, useEffect } from 'react'
import { fetchTrainingZones } from '../../api'
import type { TrainingZonesData } from '../../types'

const zoneColors: Record<string, string> = {
  'Z1 Recovery': 'bg-blue-500/20 text-blue-400',
  'Z2 Aerobic': 'bg-green-500/20 text-green-400',
  'Z3 Tempo': 'bg-yellow-500/20 text-yellow-400',
  'Z4 Threshold': 'bg-orange-500/20 text-orange-400',
  'Z5 VO2max': 'bg-red-500/20 text-red-400',
  'Z6 Anaerobic': 'bg-purple-500/20 text-purple-400',
}

export default function TrainingZones() {
  const [data, setData] = useState<TrainingZonesData | null>(null)

  useEffect(() => {
    fetchTrainingZones().then(setData).catch(() => {})
  }, [])

  if (!data || data.data_quality === 'none') return null

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Training Zones</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.hr_zones.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Heart Rate Zones</p>
            <div className="space-y-1">
              {data.hr_zones.map(z => (
                <div key={z.zone} className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${zoneColors[z.zone] ?? 'bg-gray-800 text-gray-300'}`}>
                  <span className="font-medium">{z.zone}</span>
                  <span>{z.hr_low} - {z.hr_high} bpm</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.pace_zones.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Pace Zones</p>
            <div className="space-y-1">
              {data.pace_zones.map(z => (
                <div key={z.zone} className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${zoneColors[z.zone] ?? 'bg-gray-800 text-gray-300'}`}>
                  <span className="font-medium">{z.zone}</span>
                  <span>{z.pace_high} - {z.pace_low}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
