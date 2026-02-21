import { useState } from 'react'
import { fetchTaper } from '../../api'
import type { TaperData } from '../../types'

export default function TaperCalculator() {
  const [raceDate, setRaceDate] = useState('')
  const [model, setModel] = useState('exponential')
  const [data, setData] = useState<TaperData | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!raceDate) return
    setLoading(true)
    try {
      const result = await fetchTaper(raceDate, model)
      setData(result)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Taper Calculator</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Race Date</label>
          <input
            type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <select
            value={model} onChange={e => setModel(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
          >
            <option value="exponential">Exponential</option>
            <option value="linear">Linear</option>
            <option value="step">Step</option>
          </select>
        </div>
        <button
          type="submit" disabled={loading || !raceDate}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>

      {data?.error && <p className="text-sm text-red-400">{data.error}</p>}

      {data && !data.error && data.weeks.length > 0 && (
        <div>
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
            <span>{data.days_to_race} days to race</span>
            <span>{data.taper_weeks}-week taper</span>
            <span>Current CTL: {data.current_ctl}</span>
          </div>
          <div className="space-y-2">
            {data.weeks.map(w => (
              <div key={w.week} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-10">{w.label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-4 relative">
                  <div
                    className="h-4 rounded-full bg-blue-500/60"
                    style={{ width: `${w.target_volume_pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-200">
                    {w.target_volume_pct}% volume
                  </span>
                </div>
                <span className="text-xs text-gray-500 w-20">CTL ~{w.projected_ctl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && (
        <p className="text-sm text-gray-500">Enter a race date to generate a taper plan.</p>
      )}
    </div>
  )
}
