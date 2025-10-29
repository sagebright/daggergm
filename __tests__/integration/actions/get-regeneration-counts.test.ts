/**
 * Integration Tests: Get Regeneration Counts
 *
 * Tests the getRegenerationCounts server action which provides:
 * 1. Current usage and remaining counts for scaffold regenerations
 * 2. Current usage and remaining counts for expansion regenerations
 * 3. Authentication and ownership validation
 * 4. Error handling for missing adventures
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 90%+ (business logic)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { getRegenerationCounts } from '@/app/actions/regeneration'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', async () => {
  const actual = await vi.importActual('@/lib/supabase/server')
  return {
    ...actual,
    createServerSupabaseClient: vi.fn(),
  }
})

// Mock RegenerationLimitChecker
vi.mock('@/lib/regeneration/limit-checker', () => ({
  RegenerationLimitChecker: vi.fn().mockImplementation(() => ({
    getRegenerationCounts: vi.fn().mockResolvedValue({
      scaffold: 3,
      scaffoldRemaining: 7,
      expansion: 5,
      expansionRemaining: 15,
    }),
  })),
}))

describe('getRegenerationCounts Server Action', () => {
  let testUserId: string
  let adventureId: string
  let mockSupabase: any

  beforeEach(() => {
    testUserId = '00000000-0000-4000-8000-000000000001'
    adventureId = '00000000-0000-4000-8000-000000000002'

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: testUserId } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                scaffold_regenerations_used: 3,
                expansion_regenerations_used: 5,
              },
              error: null,
            }),
          }),
        }),
      }),
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('Successful Retrieval', () => {
    it('should return regeneration counts for owned adventure', async () => {
      const result = await getRegenerationCounts(adventureId)

      expect(result.scaffold).toBe(3)
      expect(result.scaffoldRemaining).toBe(7)
      expect(result.expansion).toBe(5)
      expect(result.expansionRemaining).toBe(15)
    })

    it('should handle zero usage (new adventure)', async () => {
      const { RegenerationLimitChecker } = await import('@/lib/regeneration/limit-checker')
      vi.mocked(RegenerationLimitChecker).mockImplementation(
        () =>
          ({
            getRegenerationCounts: vi.fn().mockResolvedValue({
              scaffold: 0,
              scaffoldRemaining: 10,
              expansion: 0,
              expansionRemaining: 20,
            }),
          }) as any,
      )

      const result = await getRegenerationCounts(adventureId)

      expect(result.scaffold).toBe(0)
      expect(result.scaffoldRemaining).toBe(10)
      expect(result.expansion).toBe(0)
      expect(result.expansionRemaining).toBe(20)
    })

    it('should handle at-limit usage', async () => {
      const { RegenerationLimitChecker } = await import('@/lib/regeneration/limit-checker')
      vi.mocked(RegenerationLimitChecker).mockImplementation(
        () =>
          ({
            getRegenerationCounts: vi.fn().mockResolvedValue({
              scaffold: 10,
              scaffoldRemaining: 0,
              expansion: 20,
              expansionRemaining: 0,
            }),
          }) as any,
      )

      const result = await getRegenerationCounts(adventureId)

      expect(result.scaffoldRemaining).toBe(0)
      expect(result.expansionRemaining).toBe(0)
    })
  })

  describe('Authentication Validation', () => {
    it('should throw error when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow('Unauthorized')
    })

    it('should throw error when auth service fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth service unavailable' },
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow('Unauthorized')
    })
  })

  describe('Ownership Validation', () => {
    it('should throw error when adventure not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Adventure not found' },
            }),
          }),
        }),
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow('Adventure not found')
    })

    it('should throw error when user does not own adventure', async () => {
      const differentUserId = '00000000-0000-4000-8000-000000000999'

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: differentUserId, // Different user
              },
              error: null,
            }),
          }),
        }),
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow('Unauthorized')
    })

    it('should throw error when database query fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow('Adventure not found')
    })
  })

  describe('Error Handling', () => {
    it('should handle generic errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow('Unexpected database error')
    })

    it('should handle non-Error exceptions', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw 'String error'
      })

      await expect(getRegenerationCounts(adventureId)).rejects.toThrow(
        'Failed to get regeneration counts',
      )
    })
  })
})
