import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../api', () => ({
  fetchLatest: vi.fn(),
  fetchSnapshots: vi.fn(),
}))

import { useLatestSnapshot } from '../hooks/useLatestSnapshot'
import { useSnapshots } from '../hooks/useSnapshots'
import { fetchLatest, fetchSnapshots } from '../api'

const mockSnapshot = {
  id: 1,
  recorded_at: '2026-02-24T10:00:00',
  ctl: 55,
  atl: 60,
  tsb: -5,
} as Awaited<ReturnType<typeof fetchLatest>>

const mockSnapshotsResponse = { total: 1, items: [mockSnapshot] }

describe('useLatestSnapshot', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches and returns data on mount', async () => {
    vi.mocked(fetchLatest).mockResolvedValue(mockSnapshot)
    const { result } = renderHook(() => useLatestSnapshot())

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(mockSnapshot)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked(fetchLatest).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useLatestSnapshot())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.data).toBeNull()
  })

  it('refetch returns a Promise', async () => {
    vi.mocked(fetchLatest).mockResolvedValue(mockSnapshot)
    const { result } = renderHook(() => useLatestSnapshot())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let refetchResult: unknown
    act(() => {
      refetchResult = result.current.refetch()
    })
    expect(refetchResult).toBeInstanceOf(Promise)
  })

  it('refetch updates data with new value', async () => {
    const updatedSnapshot = { ...mockSnapshot, ctl: 60 }
    vi.mocked(fetchLatest)
      .mockResolvedValueOnce(mockSnapshot)
      .mockResolvedValueOnce(updatedSnapshot)

    const { result } = renderHook(() => useLatestSnapshot())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data?.ctl).toBe(55)

    await act(async () => { await result.current.refetch() })
    expect(result.current.data?.ctl).toBe(60)
  })

  it('clears error on successful refetch', async () => {
    vi.mocked(fetchLatest)
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce(mockSnapshot)

    const { result } = renderHook(() => useLatestSnapshot())
    await waitFor(() => expect(result.current.error).toBe('Fail'))

    await act(async () => { await result.current.refetch() })
    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual(mockSnapshot)
  })
})

describe('useSnapshots', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches with default limit 90', async () => {
    vi.mocked(fetchSnapshots).mockResolvedValue(mockSnapshotsResponse)
    const { result } = renderHook(() => useSnapshots())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSnapshots).toHaveBeenCalledWith(90)
    expect(result.current.data).toEqual(mockSnapshotsResponse)
    expect(result.current.error).toBeNull()
  })

  it('accepts a custom limit', async () => {
    vi.mocked(fetchSnapshots).mockResolvedValue(mockSnapshotsResponse)
    const { result } = renderHook(() => useSnapshots(30))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSnapshots).toHaveBeenCalledWith(30)
  })

  it('refetch returns a Promise', async () => {
    vi.mocked(fetchSnapshots).mockResolvedValue(mockSnapshotsResponse)
    const { result } = renderHook(() => useSnapshots())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let refetchResult: unknown
    act(() => {
      refetchResult = result.current.refetch()
    })
    expect(refetchResult).toBeInstanceOf(Promise)
  })

  it('sets error on failure', async () => {
    vi.mocked(fetchSnapshots).mockRejectedValue(new Error('Failed'))
    const { result } = renderHook(() => useSnapshots())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed')
    expect(result.current.data).toBeNull()
  })
})
