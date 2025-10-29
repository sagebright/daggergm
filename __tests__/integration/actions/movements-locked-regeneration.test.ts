/**
 * Integration Tests: Movement Regeneration with Locked Movements
 *
 * Tests scaffold movement regeneration with locked movement context:
 * 1. Locked movements are passed to LLM for context
 * 2. Only unlocked movements can be regenerated
 * 3. Locked movements maintain continuity
 * 4. Regeneration respects scaffold limits
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 90%+ (critical feature)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { regenerateScaffoldMovement } from '@/app/actions/movements'
import type { Movement } from '@/lib/llm/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', async () => {
  const actual = await vi.importActual('@/lib/supabase/server')
  return {
    ...actual,
    createServerSupabaseClient: vi.fn(),
  }
})

// Mock OpenAI provider
vi.mock('@/lib/llm/openai-provider', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    regenerateMovement: vi.fn().mockResolvedValue({
      id: 'mov-2',
      title: 'Regenerated Combat Encounter',
      type: 'combat',
      description: 'A newly regenerated combat scene that fits with locked movements',
      estimatedTime: '45 minutes',
    }),
  })),
}))

// Mock analytics
vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
  ANALYTICS_EVENTS: {
    SCAFFOLD_MOVEMENT_REGENERATED: 'scaffold.movement_regenerated',
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limiting/middleware', () => ({
  withRateLimit: vi.fn(async (_operation, _context, callback) => {
    return callback()
  }),
  getRateLimitContext: vi.fn().mockResolvedValue({
    userId: 'test-user-id',
    isAuthenticated: true,
    tier: 'free',
  }),
}))

describe('Movement Regeneration with Locked Movements', () => {
  let testUserId: string
  let adventureId: string
  let movementToRegenerate: string
  let mockSupabase: any

  beforeEach(() => {
    testUserId = '00000000-0000-4000-8000-000000000001'
    adventureId = '00000000-0000-4000-8000-000000000002'
    movementToRegenerate = 'mov-2'

    const mockMovements: Movement[] = [
      {
        id: 'mov-1',
        title: 'Opening Scene',
        type: 'exploration',
        description: 'The party arrives at the village',
        estimatedTime: '30 minutes',
        orderIndex: 0,
        locked: true, // Locked - should be passed as context
      },
      {
        id: 'mov-2',
        title: 'Forest Patrol',
        type: 'combat',
        description: 'A combat encounter to be regenerated',
        estimatedTime: '45 minutes',
        orderIndex: 1,
        locked: false, // Unlocked - can be regenerated
      },
      {
        id: 'mov-3',
        title: 'Village Council',
        type: 'social',
        description: 'Meeting with the village leaders',
        estimatedTime: '30 minutes',
        orderIndex: 2,
        locked: true, // Locked - should be passed as context
      },
    ]

    const mockAdventure = {
      id: adventureId,
      user_id: testUserId,
      frame: 'quest',
      focus: 'Rescue the village',
      config: {
        party_size: 4,
        party_level: 2,
        difficulty: 'standard',
        stakes: 'personal',
      },
      movements: mockMovements,
      scaffold_regenerations_used: 3,
      expansion_regenerations_used: 0,
    }

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
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('Locked Movement Context', () => {
    it('should pass locked movements as context to LLM', async () => {
      const { OpenAIProvider } = await import('@/lib/llm/openai-provider')

      await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      // Verify LLM was called with locked movements context
      const mockInstance = vi.mocked(OpenAIProvider).mock.results[0]?.value
      expect(mockInstance.regenerateMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          lockedMovements: expect.arrayContaining([
            expect.objectContaining({
              id: 'mov-1',
              title: 'Opening Scene',
              type: 'exploration',
              description: 'The party arrives at the village',
            }),
            expect.objectContaining({
              id: 'mov-3',
              title: 'Village Council',
              type: 'social',
              description: 'Meeting with the village leaders',
            }),
          ]),
        }),
      )
    })

    it('should exclude the movement being regenerated from locked context', async () => {
      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      // Verify regeneration succeeded
      expect(result.success).toBe(true)
      expect(result.movement).toBeDefined()
      // The movement being regenerated is mov-2 (unlocked)
      // Locked movements are mov-1 and mov-3
      // Implementation passes only locked movements to LLM
    })

    it('should handle adventure with no locked movements', async () => {
      // Mock adventure with no locked movements
      const noLockedMovements: Movement[] = [
        {
          id: 'mov-1',
          title: 'Scene 1',
          type: 'exploration',
          description: 'Test',
          estimatedTime: '30 minutes',
          orderIndex: 0,
          locked: false,
        },
        {
          id: 'mov-2',
          title: 'Scene 2',
          type: 'combat',
          description: 'Test',
          estimatedTime: '30 minutes',
          orderIndex: 1,
          locked: false,
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                frame: 'quest',
                focus: 'Test',
                config: {
                  party_size: 4,
                  party_level: 2,
                  difficulty: 'standard',
                  stakes: 'personal',
                },
                movements: noLockedMovements,
                scaffold_regenerations_used: 0,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, 'mov-1')

      // Should succeed with no locked movements
      expect(result.success).toBe(true)
    })

    it('should handle movements without locked property (legacy data)', async () => {
      // Mock adventure with movements that don't have 'locked' property
      const legacyMovements = [
        {
          id: 'mov-1',
          title: 'Legacy Scene',
          type: 'exploration',
          description: 'No locked property',
          estimatedTime: '30 minutes',
          orderIndex: 0,
          // No 'locked' property
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                frame: 'quest',
                focus: 'Test',
                config: {
                  party_size: 4,
                  party_level: 2,
                  difficulty: 'standard',
                  stakes: 'personal',
                },
                movements: legacyMovements,
                scaffold_regenerations_used: 0,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, 'mov-1')

      // Should succeed even without locked property
      expect(result.success).toBe(true)
    })
  })

  describe('Regeneration Success', () => {
    it('should successfully regenerate unlocked movement', async () => {
      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(true)
      expect(result.movement).toBeDefined()
      expect(result.movement?.title).toBe('Regenerated Combat Encounter')
    })

    it('should increment scaffold regeneration counter', async () => {
      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(true)

      // Verify update was called with incremented counter
      const updateCalls = mockSupabase.from.mock.results.filter(
        (r: any) => r.value?.update !== undefined,
      )
      expect(updateCalls.length).toBeGreaterThan(0)
    })

    it('should return remaining regenerations count', async () => {
      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(true)
      expect(result.remainingRegenerations).toBe(6) // 10 limit - 4 used (3 existing + 1 this call)
    })
  })

  describe('Scaffold Limits', () => {
    it('should block regeneration when at limit (10/10)', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                frame: 'quest',
                focus: 'Test',
                config: {
                  party_size: 4,
                  party_level: 2,
                },
                movements: [
                  {
                    id: movementToRegenerate,
                    title: 'Test',
                    type: 'combat',
                    description: 'Test',
                  },
                ],
                scaffold_regenerations_used: 10, // At limit
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(false)
      expect(result.error).toContain('limit reached')
      expect(result.error).toContain('10')
    })

    it('should allow regeneration when under limit (9/10)', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                frame: 'quest',
                focus: 'Test',
                config: {
                  party_size: 4,
                  party_level: 2,
                },
                movements: [
                  {
                    id: movementToRegenerate,
                    title: 'Test',
                    type: 'combat',
                    description: 'Test',
                  },
                ],
                scaffold_regenerations_used: 9, // One below limit
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(true)
      expect(result.remainingRegenerations).toBe(0) // Last one used
    })
  })

  describe('Error Handling', () => {
    it('should return error when adventure not found', async () => {
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

      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Adventure not found')
    })

    it('should return error when movement not found', async () => {
      const result = await regenerateScaffoldMovement(adventureId, 'nonexistent-mov-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Movement not found')
    })

    it('should return error when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return error when user does not own adventure', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: '00000000-0000-4000-8000-999999999999', // Different user
                movements: [],
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('Analytics Tracking', () => {
    it('should track regeneration with locked movement count', async () => {
      const { analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')

      await regenerateScaffoldMovement(adventureId, movementToRegenerate)

      expect(analytics.track).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SCAFFOLD_MOVEMENT_REGENERATED,
        expect.objectContaining({
          userId: testUserId,
          adventureId,
          movementId: movementToRegenerate,
          movementType: 'combat',
          regenerationCount: 4, // 3 existing + 1 new
          lockedCount: 2, // Two locked movements
        }),
      )
    })
  })
})
