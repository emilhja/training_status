const TABS = [
  { id: 'current',  label: 'Current'  },
  { id: 'charts',   label: 'Charts'   },
  { id: 'history',  label: 'History'  },
  { id: 'refresh',  label: 'Refresh'  },
] as const

export type TabId = typeof TABS[number]['id']

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function TabNav({ active, onChange }: Props) {
  return (
    <nav className="flex border-b border-gray-800 px-4">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
            ${active === tab.id
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
