import { useEffect } from 'react'
import type { GlossaryEntry } from '../../data/glossary'

interface Props {
  entry: GlossaryEntry
  onClose: () => void
}

const statusColor = {
  good: 'text-green-400',
  ok: 'text-yellow-400',
  bad: 'text-red-400',
  neutral: 'text-gray-400',
}

const statusBg = {
  good: 'bg-green-900/40 border-green-700/50',
  ok: 'bg-yellow-900/40 border-yellow-700/50',
  bad: 'bg-red-900/40 border-red-700/50',
  neutral: 'bg-gray-800 border-gray-700',
}

/** Renders the wiki text — bold (**text**) and line breaks */
function WikiText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className="text-sm text-gray-300 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        )
      })}
    </div>
  )
}

export default function GlossaryModal({ entry, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            {entry.abbr && (
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{entry.abbr}</span>
            )}
            <h2 className="text-base font-semibold text-white mt-0.5">{entry.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors ml-4 mt-0.5 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <WikiText text={entry.wiki} />

          {/* Thresholds table */}
          {entry.thresholds && entry.thresholds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Thresholds</p>
              <div className="space-y-1.5">
                {entry.thresholds.map((t) => (
                  <div
                    key={t.label}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${statusBg[t.status]}`}
                  >
                    <span className="text-gray-300">{t.label}</span>
                    <span className={`font-mono font-semibold ${statusColor[t.status]}`}>{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
