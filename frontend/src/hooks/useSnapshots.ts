import { useState, useEffect } from 'react'
import { fetchSnapshots } from '../api'
import type { SnapshotsResponse } from '../types'

export function useSnapshots(limit = 90) {
  const [data, setData]       = useState<SnapshotsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetchSnapshots(limit)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [limit])

  return { data, loading, error }
}
