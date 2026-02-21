import { useState, useEffect } from 'react'
import { fetchReports, generateReport } from '../../api'

export default function ReportsSection() {
  const [reports, setReports] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports().then(d => setReports(d.reports)).catch(() => {})
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateReport()
      const d = await fetchReports()
      setReports(d.reports)
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weekly Reports</h4>
      <p className="text-xs text-gray-500 mb-2">PDF reports are generated automatically every Monday at 7 AM.</p>
      <button onClick={handleGenerate} disabled={generating}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded mb-3">
        {generating ? 'Generating...' : 'Generate Now'}
      </button>
      {reports.length > 0 && (
        <div className="space-y-1 mt-2">
          {reports.slice(0, 10).map(name => (
            <a key={name} href={`/api/reports/${name}`} download
              className="block text-sm text-blue-400 hover:text-blue-300">
              {name}
            </a>
          ))}
        </div>
      )}
      {reports.length === 0 && <p className="text-xs text-gray-500 mt-1">No reports yet.</p>}
    </div>
  )
}
