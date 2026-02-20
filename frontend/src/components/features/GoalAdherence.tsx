import { useState, useEffect } from 'react'
import { fetchAdherence } from '../../api'
import type { AdherenceReport } from '../../types'

export default function GoalAdherence() {
  const [reports, setReports] = useState<AdherenceReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdherence()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>

  if (reports.length === 0) {
    return (
      <p className="text-gray-600 text-sm">
        Set a weekly km goal to track adherence over time.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report, idx) => (
        <div key={idx} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-200">
                Weekly goal: {report.target_km} km
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{report.message}</p>
            </div>
            <div className="text-right">
              {report.overall_pct !== null && (
                <p
                  className={`text-2xl font-bold ${
                    report.overall_pct >= 75
                      ? 'text-green-400'
                      : report.overall_pct >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {report.overall_pct}%
                </p>
              )}
              {report.streak > 0 && (
                <p className="text-xs text-gray-500">🔥 {report.streak} week streak</p>
              )}
            </div>
          </div>

          {/* Week grid */}
          <div className="flex gap-1.5 flex-wrap">
            {[...report.weeks].reverse().map((week, i) => (
              <div
                key={i}
                title={`${week.week_start}: ${week.actual_km}/${week.planned_km} km`}
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium cursor-default
                  ${
                    week.achieved
                      ? 'bg-green-600 text-green-100'
                      : 'bg-red-900 text-red-300'
                  }`}
              >
                {week.achieved ? '✓' : '✗'}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Each dot = one week · Hover for details · Most recent on right
          </p>
        </div>
      ))}
    </div>
  )
}
