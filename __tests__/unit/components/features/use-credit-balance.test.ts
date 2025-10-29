import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as creditsActions from '@/app/actions/credits'
import { useCreditBalance } from '@/components/features/credits/useCreditBalance'

// Mock the server actions
vi.mock('@/app/actions/credits', () => ({
  getUserCredits: vi.fn(),
}))

describe('useCreditBalance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial loading state', () => {
    vi.mocked(creditsActions.getUserCredits).mockImplementation(
      () => new Promise(() => {}), // Never resolves to keep loading
    )

    const { result } = renderHook(() => useCreditBalance())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.balance).toBe(0)
    expect(result.current.error).toBe(null)
  })

  it('should fetch and return credit balance', async () => {
    vi.mocked(creditsActions.getUserCredits).mockResolvedValue({
      success: true,
      adventureCredits: 15,
      expansionCredits: 0,
    })

    const { result } = renderHook(() => useCreditBalance())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.balance).toBe(15)
    expect(result.current.error).toBe(null)
  })

  it('should handle zero credits', async () => {
    vi.mocked(creditsActions.getUserCredits).mockResolvedValue({
      success: true,
      adventureCredits: 0,
      expansionCredits: 0,
    })

    const { result } = renderHook(() => useCreditBalance())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.balance).toBe(0)
  })

  it('should handle error from server action', async () => {
    vi.mocked(creditsActions.getUserCredits).mockResolvedValue({
      success: false,
      error: 'Database connection failed',
    })

    const { result } = renderHook(() => useCreditBalance())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Database connection failed')
    expect(result.current.balance).toBe(0)
  })

  it('should handle thrown exceptions', async () => {
    vi.mocked(creditsActions.getUserCredits).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCreditBalance())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load credits')
    expect(result.current.balance).toBe(0)
  })

  it('should provide refetch function', async () => {
    vi.mocked(creditsActions.getUserCredits)
      .mockResolvedValueOnce({
        success: true,
        adventureCredits: 10,
        expansionCredits: 0,
      })
      .mockResolvedValueOnce({
        success: true,
        adventureCredits: 9,
        expansionCredits: 0,
      })

    const { result } = renderHook(() => useCreditBalance())

    await waitFor(() => {
      expect(result.current.balance).toBe(10)
    })

    // Manually trigger refetch
    result.current.refetch()

    await waitFor(() => {
      expect(result.current.balance).toBe(9)
    })

    expect(creditsActions.getUserCredits).toHaveBeenCalledTimes(2)
  })
})
