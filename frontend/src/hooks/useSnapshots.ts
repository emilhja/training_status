import { useState, useEffect, useCallback } from 'react'
import { fetchSnapshots } from '../api'
import type { SnapshotsResponse } from '../types'

export function useSnapshots(limit = 90) {
  const [data, setData]       = useState<SnapshotsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchSnapshots(limit)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [limit])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch }
}
