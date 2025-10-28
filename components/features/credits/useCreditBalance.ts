'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import { getUserCredits } from '@/app/actions/credits'

export interface UseCreditBalanceOptions {
  pollingInterval?: number
}

export interface UseCreditBalanceReturn {
  balance: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch and manage user's credit balance
 * Supports optional polling for real-time updates
 */
export function useCreditBalance(options: UseCreditBalanceOptions = {}): UseCreditBalanceReturn {
  const { pollingInterval } = options
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCredits = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getUserCredits()

      if (!result.success) {
        setError(result.error || 'Failed to load credits')
        setBalance(0)
        return
      }

      setBalance(result.adventureCredits || 0)
    } catch {
      setError('Failed to load credits')
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    void fetchCredits()
  }, [fetchCredits])

  // Setup polling if interval is provided
  useEffect(() => {
    if (!pollingInterval) {
      return
    }

    intervalRef.current = setInterval(() => {
      void fetchCredits()
    }, pollingInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pollingInterval, fetchCredits])

  const refetch = useCallback(() => {
    void fetchCredits()
  }, [fetchCredits])

  return {
    balance,
    isLoading,
    error,
    refetch,
  }
}
