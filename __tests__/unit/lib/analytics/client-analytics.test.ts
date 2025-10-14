import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analytics } from '@/lib/analytics/analytics'

vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}))

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('ClientAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window object for browser environment
    Object.defineProperty(window, 'window', {
      writable: true,
      value: window,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('initialization', () => {
    it('should initialize PostHog when analytics enabled in browser', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com')

      const { ClientAnalytics } = await import('@/lib/analytics/client-analytics')
      const clientAnalytics = new ClientAnalytics()

      // Trigger initialization through track
      await clientAnalytics.track('test_event')

      const posthog = (await import('posthog-js')).default

      expect(posthog.init).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          api_host: 'https://app.posthog.com',
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
        }),
      )
    })

    it('should not initialize PostHog when analytics disabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')

      const { ClientAnalytics } = await import('@/lib/analytics/client-analytics')
      const clientAnalytics = new ClientAnalytics()

      await clientAnalytics.track('test_event')

      const posthog = (await import('posthog-js')).default
      expect(posthog.init).not.toHaveBeenCalled()
    })
  })

  describe('event tracking', () => {
    it('should track events in both PostHog and server analytics', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com')

      const { ClientAnalytics } = await import('@/lib/analytics/client-analytics')
      const clientAnalytics = new ClientAnalytics()

      const eventData = {
        userId: 'user-123',
        sessionId: 'session-456',
        adventureId: 'adv-789',
      }

      await clientAnalytics.track('adventure_started', eventData)

      const posthog = (await import('posthog-js')).default
      expect(posthog.capture).toHaveBeenCalledWith(
        'adventure_started',
        expect.objectContaining({
          user_id: 'user-123',
          session_id: 'session-456',
          adventure_id: 'adv-789',
          timestamp: expect.any(String),
        }),
      )

      expect(analytics.track).toHaveBeenCalledWith('adventure_started', eventData)
    })

    it('should handle server-side analytics errors gracefully', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(analytics.track).mockRejectedValue(new Error('Server error'))

      const { ClientAnalytics } = await import('@/lib/analytics/client-analytics')
      const clientAnalytics = new ClientAnalytics()

      await clientAnalytics.track('test_event', { userId: 'user-123' })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to track event server-side:',
        expect.any(Error),
      )

      const posthog = (await import('posthog-js')).default
      expect(posthog.capture).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('user identification', () => {
    it('should identify user in PostHog', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com')

      const { ClientAnalytics } = await import('@/lib/analytics/client-analytics')
      const clientAnalytics = new ClientAnalytics()

      await clientAnalytics.identify('user-123', {
        email: 'user@example.com',
        plan: 'premium',
        signupDate: '2024-01-01',
      })

      const posthog = (await import('posthog-js')).default
      expect(posthog.identify).toHaveBeenCalledWith('user-123', {
        email: 'user@example.com',
        plan: 'premium',
        signup_date: '2024-01-01',
      })
    })

    it('should not identify when analytics disabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')

      const { ClientAnalytics } = await import('@/lib/analytics/client-analytics')
      const clientAnalytics = new ClientAnalytics()

      await clientAnalytics.identify('user-123', { email: 'user@example.com' })

      const posthog = (await import('posthog-js')).default
      expect(posthog.identify).not.toHaveBeenCalled()
    })
  })
})
