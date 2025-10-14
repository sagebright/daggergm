import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateAdventure,
  getUserAdventures,
  updateAdventureState,
} from '@/app/actions/adventures'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { CreditManager } from '@/lib/credits/credit-manager'
import { getLLMProvider } from '@/lib/llm/provider'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import * as rateLimitMiddleware from '@/lib/rate-limiting/middleware'

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

  describe('generateAdventure - Guest Users', () => {
    it('should allow guest user with valid email', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      mockLLMProvider.generateAdventureScaffold.mockResolvedValue({
        title: 'Test Adventure',
        movements: [],
      })

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'test-uuid', title: 'Test Adventure', guest_token: 'token-123' },
        error: null,
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      })

      mockServiceRoleClient.from = mockFrom

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        guestEmail: 'guest@example.com',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(true)
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
        expect(result.error).toBe('Authentication required')
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
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('adventures')
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

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'adv-1', title: 'Test', user_id: 'user-123' },
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockServiceRoleClient.from.mockReturnValue({
        update: mockUpdate,
      })

      const result = await updateAdventureState('adv-1', 'ready')

      expect(result.success).toBe(true)
    })

    it('should update state for guest user with valid token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'adv-1', title: 'Test', guest_token: 'token-123' },
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      })

      mockServiceRoleClient.from.mockImplementation((table) => {
        if (table === 'adventures') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: mockEq,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {} as unknown
      })

      const result = await updateAdventureState('adv-1', 'ready', 'token-123')

      expect(result.success).toBe(true)
    })

    it('should reject when no user and no guest token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await updateAdventureState('adv-1', 'ready')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Unauthorized')
      }
    })

    it('should reject when adventure not found', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const result = await updateAdventureState('adv-1', 'ready')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Adventure not found or unauthorized')
      }
    })

    it('should handle database update errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'adv-1', title: 'Test', user_id: 'user-123' },
        error: null,
      })

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      })

      const updateError = new Error('Update failed')
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: updateError }),
      })

      mockServiceRoleClient.from.mockReturnValue({
        update: mockUpdate,
      })

      const result = await updateAdventureState('adv-1', 'ready')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Update failed')
      }
    })

    it('should handle unknown errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue('Unknown error')

      const result = await updateAdventureState('adv-1', 'ready')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to update adventure state')
      }
    })
  })
})
