import { useState, useEffect } from 'react'
import type { DashboardWidget } from '../../types'

const STORAGE_KEY = 'training_status_dashboard_config'

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'readiness', visible: true },
  { id: 'workout_suggestion', visible: true },
  { id: 'weekly_summary', visible: true },
  { id: 'smart_alerts', visible: true },
  { id: 'injury_risk', visible: true },
  { id: 'recovery_recommendation', visible: true },
  { id: 'goal_progress', visible: true },
  { id: 'goal_adherence', visible: true },
  { id: 'metric_cards', visible: true },
  { id: 'compare_consistency', visible: true },
  { id: 'correlation_insights', visible: true },
  { id: 'training_load_chart', visible: true },
  { id: 'calendar_heatmap', visible: true },
]

const WIDGET_LABELS: Record<string, string> = {
  readiness: 'Training Readiness',
  workout_suggestion: 'Workout Suggestion',
  weekly_summary: 'Weekly Summary',
  smart_alerts: 'Smart Alerts',
  injury_risk: 'Injury Risk',
  recovery_recommendation: 'Recovery Recommendation',
  goal_progress: 'Goal Progress',
  goal_adherence: 'Goal Adherence',
  metric_cards: 'Key Metrics',
  compare_consistency: 'Compare & Consistency',
  correlation_insights: 'Correlation Insights',
  training_load_chart: 'Training Load Chart',
  calendar_heatmap: 'Calendar Heatmap',
}

export function loadDashboardConfig(): DashboardWidget[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_WIDGETS
    const parsed: DashboardWidget[] = JSON.parse(stored)
    // Merge: add any new widgets not in stored config
    const storedIds = new Set(parsed.map(w => w.id))
    const merged = [...parsed]
    for (const dw of DEFAULT_WIDGETS) {
      if (!storedIds.has(dw.id)) merged.push(dw)
    }
    return merged
  } catch {
    return DEFAULT_WIDGETS
  }
}

function saveDashboardConfig(config: DashboardWidget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export default function DashboardConfig() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(loadDashboardConfig)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => { saveDashboardConfig(widgets) }, [widgets])

  function toggle(id: string) {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setWidgets(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(idx)
  }
  function handleDragEnd() { setDragIdx(null) }

  function reset() { setWidgets(DEFAULT_WIDGETS) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dashboard Layout</h4>
        <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-300">Reset</button>
      </div>
      <p className="text-xs text-gray-500 mb-3">Drag to reorder. Toggle to show/hide widgets on the Overview page.</p>
      <div className="space-y-1">
        {widgets.map((w, idx) => (
          <div
            key={w.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-move text-sm ${dragIdx === idx ? 'bg-blue-500/20' : 'bg-gray-800/50 hover:bg-gray-800'}`}
          >
            <span className="text-gray-600 text-xs">☰</span>
            <button
              onClick={() => toggle(w.id)}
              className={`w-8 h-4 rounded-full transition-colors ${w.visible ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${w.visible ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className={w.visible ? 'text-gray-200' : 'text-gray-500'}>{WIDGET_LABELS[w.id] ?? w.id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
