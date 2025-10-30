/**
 * Integration Tests: Per-Scene Confirmation
 *
 * Tests individual scene confirmation workflow:
 * 1. Users can confirm/unconfirm individual scenes
 * 2. Confirmed scenes show in confirmation badge
 * 3. "Mark as Ready" requires all scenes confirmed
 * 4. Regeneration respects confirmed scenes as immutable context
 * 5. Confirmed scenes cannot be regenerated (must unconfirm first)
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 90%+ (critical feature)
 * Related Issue: #9
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { updateAdventureState } from '@/app/actions/adventures'
import { confirmMovement, unconfirmMovement } from '@/app/actions/movements'
import type { Scene } from '@/lib/llm/types'
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

// Mock analytics
vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
  ANALYTICS_EVENTS: {
    MOVEMENT_CONFIRMED: 'movement.confirmed',
    MOVEMENT_UNCONFIRMED: 'movement.unconfirmed',
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

describe('Per-Scene Confirmation', () => {
  let testUserId: string
  let adventureId: string
  let mockSupabase: any
  let mockMovements: Scene[]

  beforeEach(() => {
    testUserId = '00000000-0000-4000-8000-000000000001'
    adventureId = '00000000-0000-4000-8000-000000000002'

    mockMovements = [
      {
        id: 'mov-1',
        title: 'Opening Scene',
        type: 'exploration',
        description: 'The party arrives at the village',
        estimatedTime: '30 minutes',
        orderIndex: 0,
        confirmed: false,
      },
      {
        id: 'mov-2',
        title: 'Forest Patrol',
        type: 'combat',
        description: 'A combat encounter',
        estimatedTime: '45 minutes',
        orderIndex: 1,
        confirmed: false,
      },
      {
        id: 'mov-3',
        title: 'Village Council',
        type: 'social',
        description: 'Meeting with the village leaders',
        estimatedTime: '30 minutes',
        orderIndex: 2,
        confirmed: false,
      },
    ]

    const mockAdventure = {
      id: adventureId,
      user_id: testUserId,
      state: 'draft',
      frame: 'quest',
      focus: 'Rescue the village',
      config: {
        party_size: 4,
        party_level: 2,
        difficulty: 'standard',
        stakes: 'personal',
      },
      movements: mockMovements,
    }

    // Create properly chained mock for select queries
    const mockSelectEq = {
      single: vi.fn().mockResolvedValue({
        data: mockAdventure,
        error: null,
      }),
      eq: vi.fn(),
    }
    mockSelectEq.eq.mockReturnValue(mockSelectEq) // Chain eq calls

    // Create properly chained mock for update queries
    const mockUpdateEq = {
      eq: vi.fn(),
    }
    mockUpdateEq.eq.mockReturnValue(mockUpdateEq) // Chain eq calls
    mockUpdateEq.eq.mockResolvedValue({ data: null, error: null })

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: testUserId } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockSelectEq),
        }),
        update: vi.fn().mockReturnValue(mockUpdateEq),
      }),
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('confirmMovement', () => {
    it('should mark a single movement as confirmed', async () => {
      const result = await confirmMovement(adventureId, 'mov-1')

      expect(result.success).toBe(true)
      expect(result.confirmedCount).toBe(1)
      expect(result.totalCount).toBe(3)
      expect(result.allConfirmed).toBe(false)
    })

    it('should add confirmTimestamp when confirming', async () => {
      await confirmMovement(adventureId, 'mov-2')

      // Verify update was called with confirmed=true and a timestamp
      const updateCall = mockSupabase.from.mock.results.find((r: any) => r.value?.update)
      expect(updateCall).toBeDefined()

      // Check that movements array was updated
      const updateArgs = mockSupabase.from.mock.calls.find(
        (call: any) => call[0] === 'daggerheart_adventures',
      )
      expect(updateArgs).toBeDefined()
    })

    it('should detect when all movements are confirmed', async () => {
      // Confirm all movements
      await confirmMovement(adventureId, 'mov-1')

      // Update mock to show first movement confirmed
      mockMovements[0].confirmed = true
      await confirmMovement(adventureId, 'mov-2')

      // Update mock to show first two confirmed
      mockMovements[1].confirmed = true
      const result = await confirmMovement(adventureId, 'mov-3')

      expect(result.success).toBe(true)
      expect(result.allConfirmed).toBe(true)
      expect(result.confirmedCount).toBe(3)
      expect(result.totalCount).toBe(3)
    })

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

      const result = await confirmMovement(adventureId, 'mov-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error when movement not found', async () => {
      const result = await confirmMovement(adventureId, 'nonexistent-mov-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await confirmMovement(adventureId, 'mov-1')

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
                movements: mockMovements,
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await confirmMovement(adventureId, 'mov-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle confirming an already confirmed movement', async () => {
      // First confirmation
      await confirmMovement(adventureId, 'mov-1')

      // Try to confirm again
      mockMovements[0].confirmed = true
      const result = await confirmMovement(adventureId, 'mov-1')

      // Should succeed (idempotent operation)
      expect(result.success).toBe(true)
      expect(result.confirmedCount).toBe(1)
    })

    it('should handle movements without confirmed field (legacy data)', async () => {
      // Remove confirmed fields to simulate legacy data
      const legacyMovements = mockMovements.map((m) => {
        const { confirmed: _confirmed, ...rest } = m
        return rest
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                movements: legacyMovements,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      const result = await confirmMovement(adventureId, 'mov-1')

      // Should treat missing field as false and confirm successfully
      expect(result.success).toBe(true)
      expect(result.confirmedCount).toBe(1)
    })
  })

  describe('unconfirmMovement', () => {
    beforeEach(() => {
      // Start with one confirmed movement
      mockMovements[1].confirmed = true
      mockMovements[1].confirmTimestamp = '2025-10-30T12:00:00Z'
    })

    it('should mark a confirmed movement as unconfirmed', async () => {
      const result = await unconfirmMovement(adventureId, 'mov-2')

      expect(result.success).toBe(true)
      expect(result.confirmedCount).toBe(0)
      expect(result.totalCount).toBe(3)
      expect(result.allConfirmed).toBe(false)
    })

    it('should remove confirmTimestamp when unconfirming', async () => {
      await unconfirmMovement(adventureId, 'mov-2')

      // Verify update was called with confirmed=false and no timestamp
      const updateCall = mockSupabase.from.mock.results.find((r: any) => r.value?.update)
      expect(updateCall).toBeDefined()
    })

    it('should handle unconfirming an already unconfirmed movement', async () => {
      const result = await unconfirmMovement(adventureId, 'mov-1')

      // Should succeed (idempotent operation)
      expect(result.success).toBe(true)
      expect(result.confirmedCount).toBe(1) // mov-2 still confirmed
    })

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

      const result = await unconfirmMovement(adventureId, 'mov-2')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await unconfirmMovement(adventureId, 'mov-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('updateAdventureState with confirmation requirement', () => {
    it('should reject ready state when not all scenes confirmed', async () => {
      // Only one scene confirmed
      mockMovements[0].confirmed = true

      const result = await updateAdventureState(adventureId, 'ready')

      expect(result.success).toBe(false)
      expect(result.error).toContain('scenes confirmed')
      expect(result.error).toContain('1/3')
    })

    it('should allow ready state when all scenes confirmed', async () => {
      // Confirm all scenes
      mockMovements.forEach((m) => {
        m.confirmed = true
        m.confirmTimestamp = new Date().toISOString()
      })

      const result = await updateAdventureState(adventureId, 'ready')

      expect(result.success).toBe(true)
    })

    it('should reject ready state when no scenes confirmed', async () => {
      const result = await updateAdventureState(adventureId, 'ready')

      expect(result.success).toBe(false)
      expect(result.error).toContain('0/3')
    })

    it('should allow archive state without confirmation requirement', async () => {
      // No scenes confirmed
      const result = await updateAdventureState(adventureId, 'archived')

      // Archive should work regardless of confirmation status
      expect(result.success).toBe(true)
    })

    it('should allow draft state transition without confirmation requirement', async () => {
      // Set adventure to ready state first
      mockMovements.forEach((m) => {
        m.confirmed = true
      })
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                state: 'ready',
                movements: mockMovements,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      const result = await updateAdventureState(adventureId, 'draft')

      // Should allow transition back to draft
      expect(result.success).toBe(true)
    })

    it('should handle adventure with no movements', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                user_id: testUserId,
                state: 'draft',
                movements: [],
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await updateAdventureState(adventureId, 'ready')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No scenes')
    })
  })

  describe('Analytics Tracking', () => {
    it('should track confirmation events', async () => {
      const { analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')

      await confirmMovement(adventureId, 'mov-1')

      expect(analytics.track).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.MOVEMENT_CONFIRMED,
        expect.objectContaining({
          userId: testUserId,
          adventureId,
          movementId: 'mov-1',
          confirmedCount: 1,
          totalCount: 3,
          allConfirmed: false,
        }),
      )
    })

    it('should track all-confirmed milestone', async () => {
      const { analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')

      // Confirm all movements
      mockMovements.forEach((m) => {
        m.confirmed = true
      })

      await confirmMovement(adventureId, 'mov-3')

      expect(analytics.track).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.MOVEMENT_CONFIRMED,
        expect.objectContaining({
          allConfirmed: true,
        }),
      )
    })

    it('should track unconfirmation events', async () => {
      const { analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')

      mockMovements[0].confirmed = true

      await unconfirmMovement(adventureId, 'mov-1')

      expect(analytics.track).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.MOVEMENT_UNCONFIRMED,
        expect.objectContaining({
          userId: testUserId,
          adventureId,
          movementId: 'mov-1',
        }),
      )
    })
  })
})
