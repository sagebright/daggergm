import { describe, it, expect, vi, beforeEach } from 'vitest'

import { CreditManager } from '@/lib/credits/credit-manager'
import { InsufficientCreditsError, CreditConsumptionError } from '@/lib/credits/errors'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

describe('CreditManager', () => {
  let creditManager: CreditManager
  let mockSupabaseClient: Awaited<ReturnType<typeof createServerSupabaseClient>>

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      from: vi.fn(),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient)
    creditManager = new CreditManager()
  })

  describe('getUserCredits', () => {
    it('should return user credit balance', async () => {
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 10 },
          error: null,
        }),
      } as ReturnType<typeof mockSupabaseClient.from>)

      const credits = await creditManager.getUserCredits('user-123')

      expect(credits).toBe(10)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daggerheart_user_profiles')
    })

    it('should return 0 for users with no profile', async () => {
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      })

      const credits = await creditManager.getUserCredits('new-user')

      expect(credits).toBe(0)
    })

    it('should handle database errors', async () => {
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database connection error' },
        }),
      })

      await expect(creditManager.getUserCredits('user-123')).rejects.toThrow(
        'Database connection error',
      )
    })
  })

  describe('consumeCredit', () => {
    it('should consume credit atomically for adventure', async () => {
      // Mock getUserCredits check
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 5 },
          error: null,
        }),
      })

      // Mock credit decrement
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 4 },
          error: null,
        }),
      })

      const result = await creditManager.consumeCredit('user-123', 'adventure', {
        adventureId: 'adv-123',
      })

      expect(result).toEqual({
        success: true,
        remainingCredits: 4,
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daggerheart_user_profiles')
    })

    it('should throw InsufficientCreditsError when user has no credits', async () => {
      // Mock getUserCredits check returning 0 credits
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 0 },
          error: null,
        }),
      })

      await expect(
        creditManager.consumeCredit('user-123', 'adventure', { adventureId: 'adv-123' }),
      ).rejects.toThrow(InsufficientCreditsError)
    })

    it('should handle database errors during update', async () => {
      // Mock getUserCredits check
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 5 },
          error: null,
        }),
      })

      // Mock update failure
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      await expect(
        creditManager.consumeCredit('user-123', 'adventure', { adventureId: 'adv-123' }),
      ).rejects.toThrow(CreditConsumptionError)
    })

    it('should support different credit types', async () => {
      // Mock getUserCredits check
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 10 },
          error: null,
        }),
      })

      // Mock credit decrement
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 9 },
          error: null,
        }),
      })

      await creditManager.consumeCredit('user-123', 'expansion', {
        movementId: 'mov-123',
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daggerheart_user_profiles')
    })
  })

  describe('addCredits', () => {
    it('should add credits to user account', async () => {
      // Mock the RPC call
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      })

      // Mock getUserCredits to return new balance
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 15 },
          error: null,
        }),
      })

      const result = await creditManager.addCredits('user-123', 5, 'purchase')

      expect(result).toEqual({
        success: true,
        newBalance: 15,
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_user_credits', {
        p_user_id: 'user-123',
        p_amount: 5,
        p_source: 'purchase',
      })
    })

    it('should validate credit amount', async () => {
      await expect(creditManager.addCredits('user-123', -5, 'purchase')).rejects.toThrow(
        'Invalid credit amount',
      )

      await expect(creditManager.addCredits('user-123', 0, 'purchase')).rejects.toThrow(
        'Invalid credit amount',
      )
    })

    it('should handle database errors', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: null,
        error: {
          code: 'DB_ERROR',
          message: 'Database error',
          details: '',
          hint: '',
          name: 'PostgrestError',
        },
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(creditManager.addCredits('user-123', 5, 'purchase')).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('refundCredit', () => {
    it('should refund credit for failed operations', async () => {
      // Mock getUserCredits check
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 5 },
          error: null,
        }),
      })

      // Mock credit increment
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 6 },
          error: null,
        }),
      })

      const result = await creditManager.refundCredit('user-123', 'adventure', {
        adventureId: 'adv-123',
        reason: 'Generation failed',
      })

      expect(result).toEqual({
        success: true,
        newBalance: 6,
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daggerheart_user_profiles')
    })
  })

  describe('checkCreditSufficiency', () => {
    it('should return true when user has enough credits', async () => {
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 5 },
          error: null,
        }),
      })

      const hasSufficient = await creditManager.checkCreditSufficiency('user-123', 'adventure')

      expect(hasSufficient).toBe(true)
    })

    it('should return false when user has insufficient credits', async () => {
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 0 },
          error: null,
        }),
      })

      const hasSufficient = await creditManager.checkCreditSufficiency('user-123', 'adventure')

      expect(hasSufficient).toBe(false)
    })

    it('should handle different credit costs per type', async () => {
      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { credits: 1 },
          error: null,
        }),
      })

      // Expansion costs 0.5 credits (rounded up to 1)
      const hasSufficient = await creditManager.checkCreditSufficiency('user-123', 'expansion')

      expect(hasSufficient).toBe(true)
    })
  })
})
