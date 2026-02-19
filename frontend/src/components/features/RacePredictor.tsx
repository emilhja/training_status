import { useEffect, useState } from 'react'
import { fetchRacePredictions } from '../../api'
import type { RacePrediction } from '../../types'

export default function RacePredictor() {
  const [data, setData] = useState<{
    predictions: RacePrediction[]
    critical_speed_ms: number
    d_prime_meters: number
    fitness_level: string
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRacePredictions()
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Calculating predictions...</div>
  if (!data || data.predictions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Race Predictor</h3>
        <p className="text-sm text-gray-500">{data?.message || "Need more data for predictions."}</p>
      </div>
    )
  }

  const fitnessEmoji = data.fitness_level === 'excellent' ? '🔥' : 
                      data.fitness_level === 'good' ? '✅' : '📈'

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Race Predictions</h3>
        <span className="text-xs text-gray-500">Based on Critical Speed</span>
      </div>

      {/* Fitness level badge */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-gray-800/50 rounded-lg">
        <span className="text-xl">{fitnessEmoji}</span>
        <div>
          <p className="text-sm font-medium text-gray-300">Fitness Level: {data.fitness_level}</p>
          <p className="text-xs text-gray-500">
            CS: {data.critical_speed_ms.toFixed(2)} m/s 
            {data.d_prime_meters > 0 && `| D': ${data.d_prime_meters.toFixed(0)}m`}
          </p>
        </div>
      </div>

      {/* Predictions table */}
      <div className="space-y-2">
        {data.predictions.map((pred, i) => (
          <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-800/50 rounded transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {pred.distance === '800m' ? '🏃' :
                 pred.distance === '1 mile' ? '🏃' :
                 pred.distance === '5K' ? '🏃‍♂️' :
                 pred.distance === '10K' ? '🏃‍♂️' :
                 pred.distance === 'Half Marathon' ? '🏃‍♂️' : '🏃‍♂️'}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-300">{pred.distance}</p>
                <p className="text-xs text-gray-500">{pred.typical_range} typical</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-400">{pred.predicted_time}</p>
              <p className="text-xs text-gray-500">{pred.predicted_pace}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Predictions assume good conditions and proper tapering. 
        Actual performance varies with weather, course, and race strategy.
      </p>
    </div>
  )
}
