import { useState } from 'react'
import { createShareLink } from '../../api'

export default function ShareButton() {
  const [link, setLink] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setCreating(true)
    try {
      const result = await createShareLink(30)
      const url = `${window.location.origin}${result.url}`
      setLink(url)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Share Dashboard</h4>
      <p className="text-xs text-gray-500 mb-2">Create a read-only link for training partners. Expires in 30 days.</p>
      {link ? (
        <div className="flex items-center gap-2">
          <input readOnly value={link}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 truncate" />
          <button onClick={handleCopy}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-200 rounded">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      ) : (
        <button onClick={handleCreate} disabled={creating}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded">
          {creating ? 'Creating...' : 'Generate Share Link'}
        </button>
      )}
    </div>
  )
}
