import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreditManager } from '@/lib/credits/credit-manager'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { InsufficientCreditsError, CreditConsumptionError } from '@/lib/credits/errors'

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
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
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
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: { success: true, remaining_credits: 4 },
        error: null,
      })

      const result = await creditManager.consumeCredit('user-123', 'adventure', {
        adventureId: 'adv-123',
      })

      expect(result).toEqual({
        success: true,
        remainingCredits: 4,
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('consume_credit', {
        p_user_id: 'user-123',
        p_credit_type: 'adventure',
        p_metadata: { adventureId: 'adv-123' },
      })
    })

    it('should throw InsufficientCreditsError when user has no credits', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: null,
        error: { code: 'P0001', message: 'Insufficient credits' },
      })

      await expect(
        creditManager.consumeCredit('user-123', 'adventure', { adventureId: 'adv-123' }),
      ).rejects.toThrow(InsufficientCreditsError)
    })

    it('should handle race conditions gracefully', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'Duplicate key violation' },
      })

      await expect(
        creditManager.consumeCredit('user-123', 'adventure', { adventureId: 'adv-123' }),
      ).rejects.toThrow(CreditConsumptionError)
    })

    it('should support different credit types', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: { success: true, remaining_credits: 9 },
        error: null,
      })

      await creditManager.consumeCredit('user-123', 'expansion', {
        movementId: 'mov-123',
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('consume_credit', {
        p_user_id: 'user-123',
        p_credit_type: 'expansion',
        p_metadata: { movementId: 'mov-123' },
      })
    })
  })

  describe('addCredits', () => {
    it('should add credits to user account', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: { new_balance: 15 },
        error: null,
      })

      const result = await creditManager.addCredits('user-123', 5, {
        source: 'purchase',
        stripePaymentId: 'pi_123',
      })

      expect(result).toEqual({
        success: true,
        newBalance: 15,
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_user_credits', {
        p_user_id: 'user-123',
        p_amount: 5,
        p_source: 'purchase',
        p_metadata: { source: 'purchase', stripePaymentId: 'pi_123' },
      })
    })

    it('should validate credit amount', async () => {
      await expect(
        creditManager.addCredits('user-123', -5, { source: 'purchase' }),
      ).rejects.toThrow('Invalid credit amount')

      await expect(creditManager.addCredits('user-123', 0, { source: 'purchase' })).rejects.toThrow(
        'Invalid credit amount',
      )
    })

    it('should handle database errors', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(creditManager.addCredits('user-123', 5, { source: 'purchase' })).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('refundCredit', () => {
    it('should refund credit for failed operations', async () => {
      vi.mocked(mockSupabaseClient.rpc).mockResolvedValueOnce({
        data: { success: true, new_balance: 6 },
        error: null,
      })

      const result = await creditManager.refundCredit('user-123', 'adventure', {
        adventureId: 'adv-123',
        reason: 'Generation failed',
      })

      expect(result).toEqual({
        success: true,
        newBalance: 6,
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('refund_credit', {
        p_user_id: 'user-123',
        p_credit_type: 'adventure',
        p_metadata: {
          adventureId: 'adv-123',
          reason: 'Generation failed',
        },
      })
    })
  })

  describe('getCreditHistory', () => {
    it('should return user credit transaction history', async () => {
      const mockHistory = [
        {
          id: 'txn-1',
          type: 'consumption',
          credit_type: 'adventure',
          amount: -1,
          balance_after: 9,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'txn-2',
          type: 'purchase',
          credit_type: null,
          amount: 10,
          balance_after: 10,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.mocked(mockSupabaseClient.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({
          data: mockHistory,
          error: null,
        }),
      })

      const history = await creditManager.getCreditHistory('user-123', 10)

      expect(history).toEqual(mockHistory)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('credit_transactions')
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
