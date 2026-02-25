import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLatest } from '../api'
import type { Snapshot } from '../types'

export function useLatestSnapshot() {
  const [data, setData]       = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const mountedRef = useRef(true)

  const refetch = useCallback((): Promise<void> => {
    setLoading(true)
    setError(null)
    return fetchLatest()
      .then(d => { if (mountedRef.current) setData(d) })
      .catch((e: Error) => { if (mountedRef.current) setError(e.message) })
      .finally(() => { if (mountedRef.current) setLoading(false) })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    refetch()
    return () => { mountedRef.current = false }
  }, [refetch])

  return { data, loading, error, refetch }
}
