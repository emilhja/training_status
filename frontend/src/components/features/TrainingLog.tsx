import { useState, useEffect, useCallback } from 'react'
import { fetchNotes, createNote, deleteNote } from '../../api'
import type { Note } from '../../types'

export default function TrainingLog() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotes = useCallback(() => {
    fetchNotes()
      .then((r) => setNotes(r.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createNote(noteDate, content.trim())
      setContent('')
      loadNotes()
    } catch (err) {
      setError('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch {
      setError('Failed to delete note')
    }
  }

  return (
    <div className="space-y-4">
      {/* Entry form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Add Log Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How did you feel? What did you notice? Any notes about your training..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      </div>

      {/* Notes list */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Training Log</h3>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-600 text-sm">No entries yet. Start logging your training.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex gap-3 group border-b border-gray-800/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 text-xs text-gray-500 pt-0.5 w-24">{note.note_date}</div>
                <p className="flex-1 text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="flex-shrink-0 text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
