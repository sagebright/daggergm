import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  generateAdventure,
  getUserAdventures,
  updateAdventureState,
} from '@/app/actions/adventures'
import { CreditManager } from '@/lib/credits/credit-manager'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { getLLMProvider } from '@/lib/llm/provider'
import * as rateLimitMiddleware from '@/lib/rate-limiting/middleware'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/credits/credit-manager')
vi.mock('@/lib/llm/provider')
vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    track: vi.fn().mockResolvedValue(undefined),
  },
  ANALYTICS_EVENTS: {
    ADVENTURE_STARTED: 'adventure_started',
    SCAFFOLD_GENERATED: 'scaffold_generated',
    ADVENTURE_COMPLETED: 'adventure_completed',
  },
}))
vi.mock('@/lib/rate-limiting/middleware', () => ({
  withRateLimit: vi.fn(),
  getRateLimitContext: vi.fn(),
}))

describe('Adventure Actions - Full Coverage', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  const mockServiceRoleClient = {
    from: vi.fn(),
  }

  const mockCreditManager = {
    consumeCredit: vi.fn(),
    refundCredit: vi.fn(),
  }

  const mockLLMProvider = {
    generateAdventureScaffold: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
    )
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      mockServiceRoleClient as unknown as Awaited<ReturnType<typeof createServiceRoleClient>>,
    )
    vi.mocked(CreditManager).mockImplementation(
      () => mockCreditManager as unknown as InstanceType<typeof CreditManager>,
    )
    vi.mocked(getLLMProvider).mockReturnValue(
      mockLLMProvider as unknown as ReturnType<typeof getLLMProvider>,
    )
    vi.mocked(rateLimitMiddleware.withRateLimit).mockImplementation(async (_, __, fn) => {
      return fn()
    })
    vi.mocked(rateLimitMiddleware.getRateLimitContext).mockResolvedValue({
      userId: 'user-123',
    } as unknown as rateLimitMiddleware.RateLimitContext)
  })

  describe('generateAdventure - Rate Limiting', () => {
    it('should handle rate limit errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      // RateLimitError should be thrown and caught in the rate limit section
      // RateLimitError(message, resetTime, retryAfter)
      const resetTime = Date.now() + 60000
      const rateLimitError = new RateLimitError('Rate limit exceeded', resetTime, 60)

      // Mock the rate limit middleware to reject with RateLimitError
      vi.mocked(rateLimitMiddleware.getRateLimitContext).mockResolvedValue({
        userId: 'user-123',
      } as unknown as rateLimitMiddleware.RateLimitContext)
      vi.mocked(rateLimitMiddleware.withRateLimit).mockRejectedValue(rateLimitError)

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      if (!result.success && 'error' in result) {
        expect(result.error).toBe('Rate limit exceeded')
        if ('retryAfter' in result) {
          expect(result.retryAfter).toBe(60)
        }
      }
    })

    it('should re-throw non-rate-limit errors from rate limit middleware', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const otherError = new Error('Network error')
      vi.mocked(rateLimitMiddleware.getRateLimitContext).mockResolvedValue({
        userId: 'user-123',
      } as unknown as rateLimitMiddleware.RateLimitContext)
      vi.mocked(rateLimitMiddleware.withRateLimit).mockRejectedValue(otherError)

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      // The function catches all errors and returns success: false after re-throwing
      const result = await generateAdventure(config)
      expect(result.success).toBe(false)
      if (!result.success && 'error' in result) {
        expect(result.error).toBe('Network error')
      }
    })
  })

  describe('generateAdventure - Guest Users (No Longer Supported)', () => {
    it('should block guest user even with valid email', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        guestEmail: 'guest@example.com', // Guest email is now ignored
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Authentication required')
      }
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should reject when no user and no guest email', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      if (!result.success && 'error' in result) {
        expect(result.error).toContain('Authentication required')
      }
    })
  })

  describe('generateAdventure - Credit Errors', () => {
    it('should handle insufficient credits error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockCreditManager.consumeCredit.mockRejectedValue(
        new InsufficientCreditsError('Not enough credits'),
      )

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      if (!result.success && 'error' in result) {
        expect(result.error).toBe('Insufficient credits to generate adventure')
      }
    })

    it('should handle non-credit errors by returning error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockCreditManager.consumeCredit.mockRejectedValue(new Error('Database error'))

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      // The function catches all errors and returns success: false
      const result = await generateAdventure(config)
      expect(result.success).toBe(false)
      if (!result.success && 'error' in result) {
        expect(result.error).toBe('Database error')
      }
    })
  })

  describe('generateAdventure - Database Errors', () => {
    it('should handle database insert error and refund credit', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockCreditManager.consumeCredit.mockResolvedValue({ success: true })
      mockCreditManager.refundCredit.mockResolvedValue({ success: true })
      mockLLMProvider.generateAdventureScaffold.mockResolvedValue({
        title: 'Test Adventure',
        movements: [],
      })

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      mockServiceRoleClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      if (!result.success && 'error' in result) {
        // The error message comes from the caught error
        expect(result.error).toBeDefined()
      }
      expect(mockCreditManager.refundCredit).toHaveBeenCalled()
    })
  })

  describe('getUserAdventures', () => {
    it('should return adventures for authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const mockAdventures = [
        { id: 'adv-1', title: 'Adventure 1' },
        { id: 'adv-2', title: 'Adventure 2' },
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockAdventures,
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const result = await getUserAdventures()

      expect(result).toEqual(mockAdventures)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daggerheart_adventures')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return empty array when no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getUserAdventures()

      expect(result).toEqual([])
    })

    it('should return empty array on database error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const result = await getUserAdventures()

      expect(result).toEqual([])
    })

    it('should return empty array when data is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const result = await getUserAdventures()

      expect(result).toEqual([])
    })
  })

  describe('updateAdventureState', () => {
    it('should update state for authenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      // Mock for confirmation check (Issue #9)
      const mockSelectEq = {
        single: vi.fn().mockResolvedValue({
          data: {
            movements: [
              { id: 'mov-1', confirmed: true },
              { id: 'mov-2', confirmed: true },
            ],
          },
          error: null,
        }),
        eq: vi.fn(),
      }
      mockSelectEq.eq.mockReturnValue(mockSelectEq)

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockSelectEq),
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      // Mock both select and update calls
      let callCount = 0
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: mockSelect }
        }
        return { update: mockUpdate }
      })

      const result = await updateAdventureState('adv-1', 'finalized')

      expect(result.success).toBe(true)
    })

    it('should reject unauthenticated requests (guest system removed)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await updateAdventureState('adv-1', 'finalized')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Unauthorized - authentication required')
      }
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      // Mock for confirmation check (Issue #9)
      const mockSelectEq = {
        single: vi.fn().mockResolvedValue({
          data: {
            movements: [
              { id: 'mov-1', confirmed: true },
              { id: 'mov-2', confirmed: true },
            ],
          },
          error: null,
        }),
        eq: vi.fn(),
      }
      mockSelectEq.eq.mockReturnValue(mockSelectEq)

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockSelectEq),
      })

      const updateError = new Error('Database error')
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: updateError }),
        }),
      })

      // Mock both select and update calls
      let callCount = 0
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: mockSelect }
        }
        return { update: mockUpdate }
      })

      const result = await updateAdventureState('adv-1', 'finalized')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Database error')
      }
    })

    it('should handle unknown errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue('Unknown error')

      const result = await updateAdventureState('adv-1', 'finalized')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to update adventure state')
      }
    })
  })
})
