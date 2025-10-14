'use client'

import { useCallback } from 'react'
import { clientAnalytics } from '@/lib/analytics/client-analytics'
import type { EventData, UserProperties } from '@/lib/analytics/analytics'

export function useAnalytics() {
  const track = useCallback(async (event: string, data?: EventData) => {
    await clientAnalytics.track(event, data)
  }, [])

  const identify = useCallback(async (userId: string, properties?: UserProperties) => {
    await clientAnalytics.identify(userId, properties)
  }, [])

  return {
    track,
    identify,
  }
}
