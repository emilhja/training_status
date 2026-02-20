import { useState } from 'react'
import { triggerFetch } from '../../api'
import type { FetchResult } from '../../types'

export default function RefreshTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<FetchResult | null>(null)

  async function handleFetch() {
    setLoading(true)
    setResult(null)
    try {
      const r = await triggerFetch()
      setResult(r)
    } catch (e) {
      setResult({ success: false, output: '', error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-6 px-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Fetch New Data</h2>

      <p className="text-sm text-gray-500 mb-6">
        Pulls fresh data from Intervals.icu and Smashrun, then saves a new snapshot to the database.
      </p>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {loading ? 'Fetching…' : 'Fetch Now'}
      </button>

      {result && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            {result.success
              ? <span className="text-green-400 text-sm font-medium">✓ Success</span>
              : <span className="text-red-400 text-sm font-medium">✗ Failed</span>
            }
          </div>

          {result.output && (
            <pre className="text-xs text-gray-300 bg-gray-900 border border-gray-800 rounded-lg p-4
                            overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
              {result.output}
            </pre>
          )}

          {result.error && (
            <pre className="text-xs text-red-400 bg-gray-900 border border-red-900 rounded-lg p-4
                            overflow-auto max-h-48 whitespace-pre-wrap mt-3">
              {result.error}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
