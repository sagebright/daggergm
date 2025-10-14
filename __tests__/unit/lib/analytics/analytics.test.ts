import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Analytics', () => {
  let mockSupabase: Awaited<ReturnType<typeof createClient>>

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module cache to test different environment variables
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('initialization', () => {
    it('should create analytics instance when analytics enabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      expect(analytics).toBeDefined()
      // createClient is now lazy-loaded, so it won't be called until first use
      expect(createClient).not.toHaveBeenCalled()
    })

    it('should create analytics instance when analytics disabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      expect(analytics).toBeDefined()
      // createClient is now lazy-loaded, so it won't be called until first use
      expect(createClient).not.toHaveBeenCalled()
    })
  })

  describe('event tracking', () => {
    it('should track events when analytics enabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')

      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockFrom = vi.fn(() => ({ insert: mockInsert }))
      mockSupabase = { from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>

      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      const eventData = {
        userId: 'user-123',
        sessionId: 'session-456',
        adventureId: 'adv-789',
      }

      await analytics.track(ANALYTICS_EVENTS.ADVENTURE_STARTED, eventData)

      expect(mockFrom).toHaveBeenCalledWith('analytics_events')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: ANALYTICS_EVENTS.ADVENTURE_STARTED,
          user_id: 'user-123',
          session_id: 'session-456',
          timestamp: expect.any(String),
          properties: expect.objectContaining({
            adventure_id: 'adv-789',
          }),
        }),
      )
    })

    it('should not track events when analytics disabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      await analytics.track(ANALYTICS_EVENTS.ADVENTURE_STARTED, { userId: 'user-123' })

      // When analytics is disabled, no database calls should be made
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      await analytics.track(ANALYTICS_EVENTS.ADVENTURE_STARTED, { userId: 'user-123' })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to store analytics event:', {
        message: 'Database error',
      })

      consoleSpy.mockRestore()
    })
  })

  describe('user identification', () => {
    it('should be a no-op on server side', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      await analytics.identify('user-123', {
        email: 'user@example.com',
        plan: 'premium',
        signupDate: '2024-01-01',
      })

      // Server-side identify is a no-op
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should be a no-op when analytics disabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      await analytics.identify('user-123', { email: 'user@example.com' })

      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('performance tracking', () => {
    it('should track performance metrics', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')

      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockFrom = vi.fn(() => ({ insert: mockInsert }))
      mockSupabase = { from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>

      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      const performanceData = {
        operation: 'adventure_generation',
        duration: 5.2,
        success: true,
        tokenCount: 1250,
        cost: 0.05,
      }

      await analytics.trackPerformance(performanceData)

      expect(mockFrom).toHaveBeenCalledWith('performance_metrics')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'adventure_generation',
          duration: 5.2,
          success: true,
          token_count: 1250,
          cost: 0.05,
          timestamp: expect.any(String),
        }),
      )
    })

    it('should not track performance when analytics disabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')

      mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })),
      } as unknown as Awaited<ReturnType<typeof createClient>>
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const { Analytics } = await import('@/lib/analytics/analytics')
      const analytics = new Analytics()

      await analytics.trackPerformance({
        operation: 'test_op',
        duration: 1.0,
        success: true,
      })

      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })
})
