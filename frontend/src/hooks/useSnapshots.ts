import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSnapshots } from '../api'
import type { SnapshotsResponse } from '../types'

export function useSnapshots(limit = 90) {
  const [data, setData]       = useState<SnapshotsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const mountedRef = useRef(true)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchSnapshots(limit)
      .then(d => { if (mountedRef.current) setData(d) })
      .catch((e: Error) => { if (mountedRef.current) setError(e.message) })
      .finally(() => { if (mountedRef.current) setLoading(false) })
  }, [limit])

  useEffect(() => {
    mountedRef.current = true
    refetch()
    return () => { mountedRef.current = false }
  }, [refetch])

  return { data, loading, error, refetch }
}
