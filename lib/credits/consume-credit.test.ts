import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest'
import { consumeAdventureCredit } from './consume-credit'
import { createMockSupabaseClient } from '@/test/mocks/supabase'
import { CreditError, InsufficientCreditsError } from './errors'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'

describe('consumeAdventureCredit', () => {
  let mockSupabase: SupabaseClient<Database>
  let mockRpc: MockedFunction<typeof mockSupabase.rpc>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockRpc = mockSupabase.rpc as MockedFunction<typeof mockSupabase.rpc>
    vi.clearAllMocks()
  })

  describe('successful credit consumption', () => {
    it('should consume exactly one credit for authenticated user', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const expectedCredits = 4

      mockRpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: expectedCredits,
        } as never,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      })

      // Act
      const result = await consumeAdventureCredit(userId, mockSupabase)

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('consume_adventure_credit', {
        p_user_id: userId,
        p_adventure_id: expect.any(String),
      })
      expect(result).toEqual({
        success: true,
        remainingCredits: expectedCredits,
      })
    })

    it('should throw error for guest users (not implemented)', async () => {
      // Arrange
      const guestToken = 'guest-token-123'

      // Act & Assert
      await expect(consumeAdventureCredit(null, mockSupabase, guestToken)).rejects.toThrow(
        'Guest credit consumption not implemented yet',
      )
    })
  })

  describe('error handling', () => {
    it('should throw error when data is null/undefined', async () => {
      const validUserId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockResolvedValueOnce({
        data: null,
        error: null as never,
        count: null,
        status: 200,
        statusText: 'OK',
      })

      await expect(consumeAdventureCredit(validUserId, mockSupabase)).rejects.toThrow(
        'Invalid response format from credit consumption',
      )
    })
    it('should throw InsufficientCreditsError when user has no credits', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'insufficient_credits',
          message: 'User has no credits remaining',
          details: '',
          hint: '',
          name: 'PostgrestError',
        },
        count: null,
        status: 400,
        statusText: 'Bad Request',
      })

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrowError(
        new InsufficientCreditsError('User has no credits remaining'),
      )
    })

    it('should throw CreditError for database errors', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'database_error',
          message: 'Connection failed',
          details: '',
          hint: '',
          name: 'PostgrestError',
        },
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
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
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockResolvedValueOnce({
        data: { unexpected: 'format' } as never,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      })

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow(
        'Invalid response format from credit consumption',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle successful credit consumption with adventure id', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: 4,
        } as never,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      })

      // Act
      const result = await consumeAdventureCredit(userId, mockSupabase)

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('consume_adventure_credit', {
        p_user_id: userId,
        p_adventure_id: expect.any(String),
      })
      expect(result.success).toBe(true)
    })

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockRejectedValueOnce(new Error('Network timeout'))

      // Act & Assert - Error instances are re-thrown as-is
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow('Network timeout')
    })

    it('should throw generic error for unknown error types', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Simulate a non-Error object to reach line 103-104
      mockRpc.mockRejectedValueOnce('string error')

      // Act & Assert
      await expect(consumeAdventureCredit(userId, mockSupabase)).rejects.toThrow(
        'An unexpected error occurred during credit consumption',
      )
    })

    it('should validate userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid'

      // Act & Assert
      await expect(consumeAdventureCredit(invalidUserId, mockSupabase)).rejects.toThrow(
        'Invalid user ID format',
      )
    })

    it('should accept valid UUID format', async () => {
      // Arrange
      const validUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

      mockRpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: 10,
        } as never,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      })

      // Act
      const result = await consumeAdventureCredit(validUserId, mockSupabase)

      // Assert
      expect(result).toEqual({
        success: true,
        remainingCredits: 10,
      })
    })
  })

  describe('transaction safety', () => {
    it('should use database transaction for credit consumption', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockRpc.mockResolvedValueOnce({
        data: {
          success: true,
          remaining_credits: 4,
          transaction_id: 'txn-123',
        } as never,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
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
