import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { fetchSharedView } from '../api'

export default function SharedView() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchSharedView(token)
      .then(setData)
      .catch(e => setError(e.message))
  }, [token])

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Link expired or not found</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  const metrics = [
    { label: 'Fitness (CTL)', value: data.ctl, fmt: (v: unknown) => Number(v).toFixed(1) },
    { label: 'Form (TSB)', value: data.tsb, fmt: (v: unknown) => Number(v).toFixed(1) },
    { label: 'HRV', value: data.hrv, fmt: (v: unknown) => `${Number(v).toFixed(0)} ms` },
    { label: 'This Week', value: data.week_0_km, fmt: (v: unknown) => `${Number(v).toFixed(1)} km` },
    { label: 'Rest Days', value: data.rest_days, fmt: (v: unknown) => String(v) },
    { label: 'VO2max', value: data.vo2max, fmt: (v: unknown) => Number(v).toFixed(1) },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-1">Training Status</h1>
        <p className="text-xs text-gray-500 mb-6">
          Last updated: {String(data.recorded_at ?? '').replace('T', ' ').slice(0, 16)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-lg font-semibold text-gray-200">
                {m.value != null ? m.fmt(m.value) : '-'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 text-center mt-8">Read-only shared view</p>
      </div>
    </div>
  )
}
