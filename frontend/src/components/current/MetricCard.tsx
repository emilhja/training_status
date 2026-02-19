import type { Status } from '../../types'

interface Props {
  label: string
  value: string | number
  unit?: string
  status?: Status
  sub?: string
}

const borderColor: Record<Status, string> = {
  good:    'border-green-500',
  ok:      'border-yellow-500',
  bad:     'border-red-500',
  neutral: 'border-gray-700',
}

const valueColor: Record<Status, string> = {
  good:    'text-green-400',
  ok:      'text-yellow-400',
  bad:     'text-red-400',
  neutral: 'text-gray-300',
}

export default function MetricCard({ label, value, unit, status = 'neutral', sub }: Props) {
  return (
    <div className={`bg-gray-900 rounded-xl border-l-4 ${borderColor[status]} p-4`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${valueColor[status]}`}>
        {value}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
