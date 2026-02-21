import { useEffect, useState } from 'react'
import { fetchGoals, createGoal, deleteGoal } from '../../api'
import type { Goal } from '../../types'
import ShareButton from '../features/ShareButton'
import ReportsSection from '../features/ReportsSection'
import DashboardConfig from '../features/DashboardConfig'

type GoalType = Goal['goal_type']

const GOAL_TYPES: { type: GoalType; label: string; description: string }[] = [
  { type: 'weekly_km',  label: 'Weekly target',  description: 'Kilometers to run per week' },
  { type: 'monthly_km', label: 'Monthly target', description: 'Kilometers to run per month' },
  { type: 'yearly_km',  label: 'Yearly target',  description: 'Kilometers to run per year' },
]

interface EditState {
  type: GoalType
  value: string
}

export default function SettingsTab() {
  const [goals, setGoals]     = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<GoalType | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [edit, setEdit]       = useState<EditState | null>(null)
  const [error, setError]     = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetchGoals()
      .then(d => setGoals(d.items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function activeGoal(type: GoalType) {
    return goals.find(g => g.goal_type === type && g.is_active)
  }

  async function handleSave(type: GoalType, value: string) {
    const km = parseFloat(value)
    if (!km || km <= 0) return
    setSaving(type)
    setError(null)
    try {
      const existing = activeGoal(type)
      if (existing) await deleteGoal(existing.id)
      await createGoal(type, km)
      setEdit(null)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(goal: Goal) {
    setDeleting(goal.id)
    setError(null)
    try {
      await deleteGoal(goal.id)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Running Targets</h2>

      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {GOAL_TYPES.map(({ type, label, description }) => {
            const goal = activeGoal(type)
            const isEditing = edit?.type === type

            return (
              <div key={type} className="bg-gray-900 rounded-xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  {goal && !isEditing && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-100">{goal.target_value} <span className="text-sm text-gray-500">km</span></span>
                      <button
                        onClick={() => setEdit({ type, value: String(goal.target_value) })}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(goal)}
                        disabled={deleting === goal.id}
                        className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                      >
                        {deleting === goal.id ? '…' : 'Remove'}
                      </button>
                    </div>
                  )}
                  {!goal && !isEditing && (
                    <button
                      onClick={() => setEdit({ type, value: '' })}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + Set target
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={edit.value}
                      onChange={e => setEdit({ type, value: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleSave(type, edit.value)}
                      placeholder="e.g. 50"
                      className="w-28 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100
                                 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <span className="text-sm text-gray-500">km</span>
                    <button
                      onClick={() => handleSave(type, edit.value)}
                      disabled={saving === type || !edit.value}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
                    >
                      {saving === type ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEdit(null)}
                      className="px-3 py-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dashboard Layout */}
      <div className="mt-10 border-t border-gray-800 pt-6">
        <DashboardConfig />
      </div>

      {/* Reports */}
      <div className="mt-10 border-t border-gray-800 pt-6">
        <ReportsSection />
      </div>

      {/* Share */}
      <div className="mt-10 border-t border-gray-800 pt-6">
        <ShareButton />
      </div>
    </div>
  )
}
