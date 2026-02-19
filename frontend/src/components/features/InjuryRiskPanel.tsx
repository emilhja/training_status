import { useEffect, useState } from 'react'
import { fetchInjuryRisk } from '../../api'
import type { InjuryRisk } from '../../types'

export default function InjuryRiskPanel() {
  const [risk, setRisk] = useState<InjuryRisk | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInjuryRisk()
      .then(data => setRisk(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Analyzing injury risk...</div>
  if (!risk || risk.risk_score === null) {
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Injury Risk Assessment</h3>
        <p className="text-sm text-gray-500">{risk?.message || "Not enough data yet."}</p>
      </div>
    )
  }

  const getColorClass = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'elevated': return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
      case 'moderate': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'low': return 'bg-green-500/20 border-green-500/50 text-green-400'
      default: return 'bg-gray-800 border-gray-700 text-gray-400'
    }
  }

  const getProgressColor = (score: number) => {
    if (score >= 60) return 'bg-red-500'
    if (score >= 40) return 'bg-orange-500'
    if (score >= 20) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`rounded-xl p-4 border ${getColorClass(risk.risk_level)}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Injury Risk Assessment</h3>
        <span className="text-2xl font-bold">{risk.risk_score}/100</span>
      </div>

      {/* Risk bar */}
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${getProgressColor(risk.risk_score)} transition-all duration-500`}
          style={{ width: `${risk.risk_score}%` }}
        />
      </div>

      <p className="text-sm mb-4">{risk.message}</p>

      {/* Risk factors */}
      {risk.factors.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-gray-400 uppercase">Risk Factors</h4>
          {risk.factors.map((factor, i) => (
            <div key={i} className="bg-black/20 rounded p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{factor.factor}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  factor.severity === 'high' ? 'bg-red-500/30 text-red-400' :
                  factor.severity === 'medium' ? 'bg-orange-500/30 text-orange-400' :
                  'bg-yellow-500/30 text-yellow-400'
                }`}>
                  {factor.value}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{factor.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {risk.recommendations.filter(Boolean).length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-gray-400 uppercase">Recommendations</h4>
          {risk.recommendations.filter(Boolean).map((rec, i) => (
            <p key={i} className="text-sm flex items-center gap-2">
              <span>💡</span> {rec}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
