import type { Snapshot } from '../../types'

interface Props {
  snapshot: Snapshot
}

interface Alert {
  id: string
  icon: string
  message: string
  type: 'warning' | 'danger' | 'info'
}

export default function SmartAlerts({ snapshot }: Props) {
  const alerts: Alert[] = []

  // Check various conditions
  if (snapshot.rest_days !== null && snapshot.rest_days > 5) {
    alerts.push({
      id: 'rest',
      icon: '⚠️',
      message: `${snapshot.rest_days} rest days - risk of detraining`,
      type: 'warning'
    })
  }

  if (snapshot.ramp_rate !== null && snapshot.ramp_rate > 5) {
    alerts.push({
      id: 'ramp',
      icon: '🔥',
      message: `High ramp rate (+${snapshot.ramp_rate.toFixed(1)}) - injury risk`,
      type: 'danger'
    })
  }

  if (snapshot.sleep_score !== null && snapshot.sleep_score < 50) {
    alerts.push({
      id: 'sleep',
      icon: '💤',
      message: `Poor sleep (${Math.round(snapshot.sleep_score)}/100) - prioritize recovery`,
      type: 'warning'
    })
  }

  if (snapshot.ac_ratio !== null && snapshot.ac_ratio > 1.5) {
    alerts.push({
      id: 'ac',
      icon: '😰',
      message: `High fatigue load (A:C ${snapshot.ac_ratio.toFixed(2)})`,
      type: 'danger'
    })
  }

  if (snapshot.monotony !== null && snapshot.monotony > 2) {
    alerts.push({
      id: 'mono',
      icon: '📊',
      message: 'Training monotony high - add variety',
      type: 'warning'
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
        <span className="text-2xl">✅</span>
        <p className="text-sm text-green-400 mt-1">All systems looking good!</p>
      </div>
    )
  }

  const typeClasses = {
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className={`rounded-lg p-3 border ${typeClasses[alert.type]} flex items-center gap-3`}>
          <span>{alert.icon}</span>
          <span className="text-sm">{alert.message}</span>
        </div>
      ))}
    </div>
  )
}
