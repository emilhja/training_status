import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLatest } from '../api'
import type { Snapshot } from '../types'

export function useLatestSnapshot() {
  const [data, setData]       = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const refetch = useCallback((): Promise<void> => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    return fetchLatest(controller.signal)
      .then(d => { setData(d) })
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  }, [])

  useEffect(() => {
    refetch()
    return () => { abortRef.current?.abort() }
  }, [refetch])

  return { data, loading, error, refetch }
}
