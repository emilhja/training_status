import { useState, useEffect } from 'react'
import { createShareLink, fetchShareLinks, revokeShareLink } from '../../api'

interface ShareLink {
  token: string
  created_at: string
  expires_at: string | null
  is_active: boolean
}

export default function ShareButton() {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [newLink, setNewLink] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchShareLinks().then(r => setLinks(r.items)).catch(() => {})
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const result = await createShareLink(30)
      const url = `${window.location.origin}${result.url}`
      setNewLink(url)
      const updated = await fetchShareLinks()
      setLinks(updated.items)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke(token: string) {
    await revokeShareLink(token)
    setLinks(prev => prev.filter(l => l.token !== token))
    if (newLink?.includes(token)) setNewLink(null)
  }

  const activeLinks = links.filter(l => l.is_active)

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Share Dashboard</h4>
      <p className="text-xs text-gray-500">Create a read-only link for training partners. Expires in 30 days.</p>

      <button onClick={handleCreate} disabled={creating}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded">
        {creating ? 'Creating...' : 'Generate Share Link'}
      </button>

      {newLink && (
        <div className="flex items-center gap-2">
          <input readOnly value={newLink}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 truncate" />
          <button onClick={() => handleCopy(newLink)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-200 rounded">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {activeLinks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Active links:</p>
          {activeLinks.map(l => (
            <div key={l.token} className="flex items-center gap-2">
              <span className="flex-1 text-xs text-gray-400 truncate font-mono">
                {`${window.location.origin}/shared/${l.token}`}
              </span>
              {l.expires_at && (
                <span className="text-xs text-gray-600">
                  exp. {l.expires_at.slice(0, 10)}
                </span>
              )}
              <button onClick={() => handleRevoke(l.token)}
                className="px-2 py-0.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 text-xs rounded">
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
