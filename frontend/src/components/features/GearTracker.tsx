import { useState, useEffect, useCallback } from 'react'
import { fetchGear, createGear, updateGear, deleteGear } from '../../api'
import type { GearItem } from '../../types'
import EmptyState from '../EmptyState'

export default function GearTracker() {
  const [items, setItems] = useState<GearItem[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [retireKm, setRetireKm] = useState(800)
  const [editingKm, setEditingKm] = useState<{ id: number; km: string } | null>(null)

  const load = useCallback(() => {
    fetchGear().then(d => setItems(d.items)).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createGear({ name: name.trim(), gear_type: 'shoe', brand: brand.trim() || undefined, retirement_km: retireKm })
    setName(''); setBrand(''); setAdding(false)
    load()
  }

  async function handleRetire(id: number) {
    await deleteGear(id)
    load()
  }

  async function handleUpdateKm(id: number) {
    if (!editingKm) return
    await updateGear(id, { accumulated_km: parseFloat(editingKm.km) || 0 })
    setEditingKm(null)
    load()
  }

  if (items.length === 0 && !adding) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No gear tracked"
          description="Add your running shoes to track mileage and know when to replace them."
          action={{ label: 'Add Gear', onClick: () => setAdding(true) }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Gear</h3>
        <button onClick={() => setAdding(true)} className="text-sm text-blue-400 hover:text-blue-300">+ Add</button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-xl p-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Nike Vomero 18)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200" />
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Retire at</label>
            <input type="number" value={retireKm} onChange={e => setRetireKm(Number(e.target.value))}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200" />
            <span className="text-xs text-gray-500">km</span>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.map(g => {
          const pct = g.retirement_km > 0 ? (g.accumulated_km / g.retirement_km) * 100 : 0
          const barColor = pct >= 85 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'

          return (
            <div key={g.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-200">{g.name}</p>
                  {g.brand && <p className="text-xs text-gray-500">{g.brand}</p>}
                </div>
                <button onClick={() => handleRetire(g.id)} className="text-xs text-red-400 hover:text-red-300">Retire</button>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">{Math.round(pct)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                {editingKm?.id === g.id ? (
                  <div className="flex items-center gap-1">
                    <input type="number" value={editingKm.km} onChange={e => setEditingKm({ id: g.id, km: e.target.value })}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-gray-200" />
                    <button onClick={() => handleUpdateKm(g.id)} className="text-blue-400">Save</button>
                    <button onClick={() => setEditingKm(null)} className="text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingKm({ id: g.id, km: String(g.accumulated_km) })} className="hover:text-gray-300">
                    {g.accumulated_km.toFixed(0)} / {g.retirement_km} km
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
