import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSnapshots } from '../api'
import type { SnapshotsResponse } from '../types'

export function useSnapshots(limit = 90) {
  const [data, setData]       = useState<SnapshotsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const refetch = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    return fetchSnapshots(limit, controller.signal)
      .then(d => { setData(d) })
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  }, [limit])

  useEffect(() => {
    refetch()
    return () => { abortRef.current?.abort() }
  }, [refetch])

  return { data, loading, error, refetch }
}
