import { useState, useEffect, useCallback } from 'react'
import { fetchHealthEvents, createHealthEvent, deleteHealthEvent } from '../../api'
import type { HealthEvent } from '../../types'

const typeColors: Record<string, string> = {
  illness: 'bg-red-500/20 text-red-400 border-red-500/30',
  injury: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  rest_period: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const typeLabels: Record<string, string> = {
  illness: 'Illness', injury: 'Injury', rest_period: 'Rest Period',
}

export default function HealthEventLog() {
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [adding, setAdding] = useState(false)
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [eventType, setEventType] = useState('illness')
  const [description, setDescription] = useState('')

  const load = useCallback(() => {
    fetchHealthEvents().then(d => setEvents(d.items)).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    await createHealthEvent({
      event_date: eventDate,
      end_date: endDate || undefined,
      event_type: eventType,
      description: description.trim(),
    })
    setDescription(''); setEndDate(''); setAdding(false)
    load()
  }

  async function handleDelete(id: number) {
    await deleteHealthEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Health Events</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm text-blue-400 hover:text-blue-300">
          {adding ? 'Cancel' : '+ Log Event'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">End Date (optional)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200" />
            </div>
          </div>
          <select value={eventType} onChange={e => setEventType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200">
            <option value="illness">Illness</option>
            <option value="injury">Injury</option>
            <option value="rest_period">Rest Period</option>
          </select>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened?"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 resize-none h-16" />
          <button type="submit" className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">Save</button>
        </form>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No health events logged. Track illness, injury, and rest periods here.</p>
      ) : (
        <div className="space-y-2">
          {events.map(evt => (
            <div key={evt.id} className={`border rounded-lg p-3 group ${typeColors[evt.event_type] ?? 'bg-gray-800 text-gray-300 border-gray-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{typeLabels[evt.event_type] ?? evt.event_type}</span>
                  <span className="text-xs opacity-60">
                    {evt.event_date}{evt.end_date ? ` - ${evt.end_date}` : ''}
                  </span>
                </div>
                <button onClick={() => handleDelete(evt.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-red-400 transition-opacity">
                  Delete
                </button>
              </div>
              <p className="text-sm mt-1 opacity-80">{evt.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
