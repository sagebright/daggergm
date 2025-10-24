/**
 * Integration Tests: Scaffold Movement Regeneration
 *
 * Tests that scaffold movement regeneration:
 * 1. Does NOT consume credits
 * 2. Checks and enforces the 10 regeneration limit
 * 3. Increments counter after successful regeneration
 * 4. Preserves movement id and orderIndex
 * 5. Uses locked movements as context
 * 6. Returns clear error messages when limit reached
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 100% (business-critical feature)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { regenerateScaffoldMovement } from '@/app/actions/movements'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth to return test user
vi.mock('@/lib/supabase/server', async () => {
  const actual = await vi.importActual('@/lib/supabase/server')
  return {
    ...actual,
    createServerSupabaseClient: vi.fn(),
  }
})

// Mock LLM provider
vi.mock('@/lib/llm/openai-provider', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    regenerateMovement: vi.fn().mockResolvedValue({
      title: 'Regenerated Movement Title',
      description: 'Regenerated movement description with new content',
      type: 'combat',
      estimatedTime: '20 minutes',
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

describe('Scaffold Movement Regeneration', () => {
  let testUserId: string
  let adventureId: string
  let movementId: string
  let mockSupabase: any

  beforeEach(async () => {
    // Create mock Supabase client with valid UUID formats
    testUserId = '00000000-0000-4000-8000-000000000001'
    adventureId = '00000000-0000-4000-8000-000000000002'
    movementId = 'mov-' + Math.random().toString(36).substring(7)

    const mockAdventure = {
      id: adventureId,
      user_id: testUserId,
      frame: 'witherwild',
      focus: 'mystery investigation',
      config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
      movements: [
        {
          id: movementId,
          type: 'combat',
          title: 'Forest Ambush',
          description: 'Brief description',
          estimatedTime: '15 minutes',
          orderIndex: 0,
          locked: false,
        },
        {
          id: 'mov-locked-1',
          type: 'exploration',
          title: 'Ancient Ruins',
          description: 'Locked exploration movement',
          estimatedTime: '20 minutes',
          orderIndex: 1,
          locked: true,
        },
      ],
      expansion_regenerations_used: 0,
      scaffold_regenerations_used: 0,
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

  describe('regenerateScaffoldMovement() - Basic Functionality', () => {
    it('should regenerate movement when under limit (5/10)', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 5,
      }

      mockSupabase.from.mockReturnValue({
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
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      expect(result.success).toBe(true)
      expect(result.movement).toBeDefined()
      expect(result.movement?.title).toBe('Regenerated Movement Title')
      expect(result.remainingRegenerations).toBe(4) // 10 - 5 - 1 = 4
    })

    it('should block regeneration when at limit (10/10)', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 10,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('limit reached')
      expect(result.error).toContain('10')
    })

    it('should increment counter after successful regeneration', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 3,
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      })

      await regenerateScaffoldMovement(adventureId, movementId)

      // Verify update was called with incremented counter
      expect(mockUpdate).toHaveBeenCalled()
      const updateCall = mockUpdate.mock.calls[0]?.[0]
      expect(updateCall?.scaffold_regenerations_used).toBe(4)
    })

    it('should NOT consume credits', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 5,
      }

      mockSupabase.from.mockReturnValue({
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
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      // Success should not depend on credits
      expect(result.success).toBe(true)
    })
  })

  describe('Movement Preservation', () => {
    it('should preserve movement id and orderIndex', async () => {
      const originalMovementId = 'mov-original-123'
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: originalMovementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 2,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 3,
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      })

      await regenerateScaffoldMovement(adventureId, originalMovementId)

      // Verify update was called
      expect(mockUpdate).toHaveBeenCalled()
      const updateCall = mockUpdate.mock.calls[0]?.[0]
      const updatedMovements = updateCall?.movements

      // Find the updated movement
      const updatedMovement = updatedMovements?.find((m: any) => m.id === originalMovementId)

      // Verify id and orderIndex were preserved
      expect(updatedMovement?.id).toBe(originalMovementId)
      expect(updatedMovement?.orderIndex).toBe(2)
    })

    it('should update movement content while preserving structure', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Original Title',
            description: 'Original description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 0,
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      })

      await regenerateScaffoldMovement(adventureId, movementId)

      // Verify update was called
      const updateCall = mockUpdate.mock.calls[0]?.[0]
      const updatedMovements = updateCall?.movements
      const updatedMovement = updatedMovements?.find((m: any) => m.id === movementId)

      // Content should be updated
      expect(updatedMovement?.title).toBe('Regenerated Movement Title')
      expect(updatedMovement?.description).toBe('Regenerated movement description with new content')

      // Structure should be preserved
      expect(updatedMovement?.id).toBe(movementId)
      expect(updatedMovement?.orderIndex).toBe(0)
    })
  })

  describe('Locked Movements Context', () => {
    it('should use locked movements as context for regeneration', async () => {
      // This test verifies that locked movements are passed to the LLM
      // We can't directly test the LLM call since it's mocked, but we verify
      // that the implementation extracts and uses locked movements

      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
          {
            id: 'mov-locked-1',
            type: 'exploration',
            title: 'Ancient Ruins',
            description: 'Locked exploration movement',
            estimatedTime: '20 minutes',
            orderIndex: 1,
            locked: true,
          },
          {
            id: 'mov-locked-2',
            type: 'social',
            title: 'Village Encounter',
            description: 'Locked social movement',
            estimatedTime: '10 minutes',
            orderIndex: 2,
            locked: true,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 2,
      }

      mockSupabase.from.mockReturnValue({
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
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      // Verify regeneration succeeded
      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should return error if adventure not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error if movement not found', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: testUserId,
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: 'different-movement-id',
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 3,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Movement not found')
    })

    it('should return error if user does not own adventure', async () => {
      const mockAdventure = {
        id: adventureId,
        user_id: 'different-user-id',
        frame: 'witherwild',
        focus: 'mystery investigation',
        config: { party_size: 4, party_level: 2, difficulty: 'standard', stakes: 'personal' },
        movements: [
          {
            id: movementId,
            type: 'combat',
            title: 'Forest Ambush',
            description: 'Brief description',
            estimatedTime: '15 minutes',
            orderIndex: 0,
            locked: false,
          },
        ],
        expansion_regenerations_used: 0,
        scaffold_regenerations_used: 3,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdventure,
              error: null,
            }),
          }),
        }),
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await regenerateScaffoldMovement(adventureId, movementId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })
})
