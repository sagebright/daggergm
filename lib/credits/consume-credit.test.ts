import { describe, it, expect, beforeEach, vi } from 'vitest'
import { consumeAdventureCredit } from './consume-credit'
import { createMockSupabaseClient } from '@/test/mocks/supabase'
import { CreditError, InsufficientCreditsError } from './errors'

describe('consumeAdventureCredit', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  describe('successful credit consumption', () => {
    it('should consume exactly one credit for authenticated user', async () => {
      // Arrange
      const userId = 'user-123'
      const expectedCredits = 4

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: expectedCredits,
        },
        error: null,
      })

      // Act
      const result = await consumeAdventureCredit(userId, mockSupabase)

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_adventure_credit', {
        user_id: userId,
      })
      expect(result).toEqual({
        success: true,
        remainingCredits: expectedCredits,
      })
    })

    it('should work for guest users with token', async () => {
      // Arrange
      const guestToken = 'guest-token-123'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: 0,
        },
        error: null,
      })

      // Act
      const result = await consumeAdventureCredit(null, mockSupabase, guestToken)

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_guest_credit', {
        guest_token: guestToken,
      })
      expect(result).toEqual({
        success: true,
        remainingCredits: 0,
      })
    })
  })

  describe('error handling', () => {
    it('should throw InsufficientCreditsError when user has no credits', async () => {
      // Arrange
      const userId = 'user-123'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'insufficient_credits',
          message: 'User has no credits remaining',
        },
      })

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow(
        InsufficientCreditsError,
      )

      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow(
        'User has no credits remaining',
      )
    })

    it('should throw CreditError for database errors', async () => {
      // Arrange
      const userId = 'user-123'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'database_error',
          message: 'Connection failed',
        },
      })

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow(CreditError)
    })

    it('should throw error when neither userId nor guestToken provided', async () => {
      // Act & Assert
      await expect(consumeAdventureCredit(null, mockSupabase)).rejects.toThrow(
        'Either userId or guestToken must be provided',
      )
    })

    it('should throw error for unexpected response format', async () => {
      // Arrange
      const userId = 'user-123'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { unexpected: 'format' },
        error: null,
      })

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow(
        'Invalid response format from credit consumption',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle race conditions with idempotency key', async () => {
      // Arrange
      const userId = 'user-123'
      const idempotencyKey = 'idem-key-123'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: 4,
          idempotency_key_used: true,
        },
        error: null,
      })

      // Act
      const result = await consumeAdventureCredit(userId, mockSupabase, undefined, idempotencyKey)

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_adventure_credit', {
        user_id: userId,
        idempotency_key: idempotencyKey,
      })
      expect(result.success).toBe(true)
    })

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const userId = 'user-123'

      mockSupabase.rpc.mockRejectedValueOnce(new Error('Network timeout'))

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow('Network timeout')
    })

    it('should validate userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid'

      // Act & Assert
      await expect(consumeAdventureCredit(invalidUserId, mockSupabase)).rejects.toThrow(
        'Invalid user ID format',
      )
    })
  })

  describe('transaction safety', () => {
    it('should use database transaction for credit consumption', async () => {
      // Arrange
      const userId = 'user-123'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: 4,
          transaction_id: 'txn-123',
        },
        error: null,
      })

      // Act
      const result = await consumeAdventureCredit(userId, mockSupabase)

      // Assert
      expect(result).toMatchObject({
        success: true,
        remainingCredits: 4,
      })
    })
  })
})
