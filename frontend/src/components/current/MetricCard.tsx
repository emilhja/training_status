import { useState } from 'react'
import type { Status } from '../../types'
import { glossary } from '../../data/glossary'
import GlossaryModal from '../ui/GlossaryModal'

interface Props {
  label: string
  value: string | number
  unit?: string
  status?: Status
  sub?: string
  glossaryKey?: string
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

export default function MetricCard({ label, value, unit, status = 'neutral', sub, glossaryKey }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const entry = glossaryKey ? glossary[glossaryKey] : undefined

  return (
    <>
      <div className={`bg-gray-900 rounded-xl border-l-4 ${borderColor[status]} p-4 relative`}>
        <div className="flex items-center gap-1 mb-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>

          {entry && (
            <div className="relative flex items-center">
              <button
                className="text-gray-600 hover:text-gray-400 transition-colors focus:outline-none"
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                onClick={() => setModalOpen(true)}
                aria-label={`Learn more about ${label}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
                </svg>
              </button>

              {tooltipVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none w-56">
                  <div className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed">
                    {entry.tooltip}
                    <div className="text-gray-500 mt-1">Click for full explanation</div>
                  </div>
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-2 h-2 bg-gray-800 border-r border-b border-gray-700 rotate-45 -mt-1" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className={`text-2xl font-semibold ${valueColor[status]}`}>
          {value}
          {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>

      {modalOpen && entry && (
        <GlossaryModal entry={entry} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
