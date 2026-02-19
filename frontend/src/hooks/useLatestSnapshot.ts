import { useState, useEffect } from 'react'
import { fetchLatest } from '../api'
import type { Snapshot } from '../types'

export function useLatestSnapshot() {
  const [data, setData]       = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetchLatest()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
