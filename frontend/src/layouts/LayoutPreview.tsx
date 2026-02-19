// Layout Preview Component
// Use this to compare all layout options side by side or switch between them

import { useState } from 'react'
import LayoutA_Sidebar from './LayoutA_Sidebar'
import LayoutB_CompactDashboard from './LayoutB_CompactDashboard'
import LayoutC_Accordion from './LayoutC_Accordion'
import LayoutD_SplitView from './LayoutD_SplitView'
import LayoutE_ThreePanel from './LayoutE_ThreePanel'

const layouts = [
  { id: 'current', label: 'Current (Tabs)', description: 'Original tab-based navigation' },
  { id: 'A', label: 'A: Sidebar', description: 'Dashboard-style with left sidebar navigation' },
  { id: 'B', label: 'B: Compact', description: 'All-in-one view, no tabs needed' },
  { id: 'C', label: 'C: Accordion', description: 'Expandable sections, mobile-friendly' },
  { id: 'D', label: 'D: Split View', description: 'Charts left, metrics right' },
  { id: 'E', label: 'E: Three Panel', description: 'Left sidebar, main content, right sidebar with header menu' },
]

export default function LayoutPreview() {
  const [selectedLayout, setSelectedLayout] = useState<string>('current')

  const renderLayout = () => {
    switch (selectedLayout) {
      case 'A': return <LayoutA_Sidebar />
      case 'B': return <LayoutB_CompactDashboard />
      case 'C': return <LayoutC_Accordion />
      case 'D': return <LayoutD_SplitView />
      case 'E': return <LayoutE_ThreePanel />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Layout Selector Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-semibold text-gray-300">Layout Preview</h1>
            <span className="text-xs text-gray-500">Select a layout to preview</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {layouts.map(layout => (
              <button
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${selectedLayout === layout.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                title={layout.description}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout Content */}
      <div className="pt-24">
        {selectedLayout === 'current' ? (
          <div className="p-8 text-center text-gray-500">
            <p>The current layout is the original tab-based design.</p>
            <p className="mt-2 text-sm">Select another layout above to preview the alternatives.</p>
            <div className="mt-6 p-6 bg-gray-900 rounded-xl inline-block text-left">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Layout Summary:</h3>
              <ul className="text-sm space-y-2 text-gray-400">
                <li><strong className="text-blue-400">A: Sidebar</strong> — Left navigation panel, more organized sections</li>
                <li><strong className="text-blue-400">B: Compact</strong> — Everything visible at once, dense information</li>
                <li><strong className="text-blue-400">C: Accordion</strong> — Expandable cards, great for mobile</li>
                <li><strong className="text-blue-400">D: Split View</strong> — Charts on left, metrics on right</li>
                <li><strong className="text-blue-400">E: Three Panel</strong> — Left sidebar, main content, right sidebar with header menu</li>
              </ul>
            </div>
          </div>
        ) : (
          renderLayout()
        )}
      </div>
    </div>
  )
}
