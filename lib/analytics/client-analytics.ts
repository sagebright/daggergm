'use client'

import posthog from 'posthog-js'

import { analytics } from './analytics'
import type { EventData, UserProperties } from './analytics'

export class ClientAnalytics {
  private isEnabled: boolean
  private isInitialized: boolean = false

  constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  }

  private shouldInitializePostHog(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST &&
      typeof window !== 'undefined'
    )
  }

  private initializePostHog(): void {
    if (this.isInitialized || !this.shouldInitializePostHog()) {
      return
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      ...(process.env.NEXT_PUBLIC_POSTHOG_HOST && {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      }),
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug()
        }
      },
      // Privacy-conscious defaults
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
    })

    this.isInitialized = true
  }

  async track(event: string, data: EventData = {}): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    // Initialize PostHog if not already done
    this.initializePostHog()

    const timestamp = new Date().toISOString()
    const eventProperties = this.transformEventData(data, timestamp)

    // Track in PostHog (client-side)
    if (this.isInitialized) {
      posthog.capture(event, eventProperties)
    }

    // Also send to server-side analytics
    try {
      await analytics.track(event, data)
    } catch (error) {
      console.error('Failed to track event server-side:', error)
    }
  }

  async identify(userId: string, properties: UserProperties = {}): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    // Initialize PostHog if not already done
    this.initializePostHog()

    if (this.isInitialized) {
      const transformedProperties = this.transformUserProperties(properties)
      posthog.identify(userId, transformedProperties)
    }
  }

  private transformEventData(data: EventData, timestamp: string): Record<string, unknown> {
    const transformed: Record<string, unknown> = {
      timestamp,
    }

    // Transform camelCase to snake_case for consistency
    const keyMapping: Record<string, string> = {
      userId: 'user_id',
      sessionId: 'session_id',
      adventureId: 'adventure_id',
      movementId: 'movement_id',
      partySize: 'party_size',
      tokenCount: 'token_count',
      paymentMethod: 'payment_method',
      movementType: 'movement_type',
    }

    Object.entries(data).forEach(([key, value]) => {
      const transformedKey = keyMapping[key] || key
      transformed[transformedKey] = value
    })

    return transformed
  }

  private transformUserProperties(properties: UserProperties): Record<string, unknown> {
    const transformed: Record<string, unknown> = {}

    // Transform camelCase to snake_case
    const keyMapping: Record<string, string> = {
      signupDate: 'signup_date',
    }

    Object.entries(properties).forEach(([key, value]) => {
      const transformedKey = keyMapping[key] || key
      transformed[transformedKey] = value
    })

    return transformed
  }
}

// Export singleton instance for client-side use
export const clientAnalytics = new ClientAnalytics()
