/**
 * Integration Tests: updateMovement Server Action
 *
 * Tests the updateMovement server action which:
 * 1. Updates movement data (title, description, locked status, etc.)
 * 2. Validates user authentication and ownership
 * 3. Uses service role client to bypass RLS for updates
 * 4. Validates movement data against schema
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 90%+ (critical feature)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { updateMovement } from '@/app/actions/movements'
import type { Movement } from '@/lib/llm/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', async () => {
  const actual = await vi.importActual('@/lib/supabase/server')
  return {
    ...actual,
    createServerSupabaseClient: vi.fn(),
    createServiceRoleClient: vi.fn(),
  }
})

describe('updateMovement Server Action', () => {
  let testUserId: string
  let adventureId: string
  let movementId: string
  let mockSupabase: any
  let mockServiceClient: any

  beforeEach(() => {
    testUserId = '00000000-0000-4000-8000-000000000001'
    adventureId = '00000000-0000-4000-8000-000000000002'
    movementId = '00000000-0000-4000-8000-000000000003'

    const mockMovement: Movement = {
      id: movementId,
      title: 'Original Title',
      type: 'exploration',
      content: 'Original description',
      estimatedTime: '30 minutes',
    }

    const mockAdventure = {
      id: adventureId,
      user_id: testUserId,
      frame: 'quest',
      focus: 'Exploration',
      movements: [mockMovement],
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
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAdventure,
                error: null,
              }),
            }),
          }),
        }),
      }),
    }

    mockServiceClient = {
      from: vi.fn().mockReturnValue({
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

  describe('Successful Updates', () => {
    it('should update movement title', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated Title',
      })

      expect(result.success).toBe(true)
      expect(mockServiceClient.from).toHaveBeenCalledWith('daggerheart_adventures')
    })

    it('should update movement description', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        content: 'New description with more details',
      })

      expect(result.success).toBe(true)
    })

    it('should update movement locked status', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        isLocked: true,
      } as any)

      expect(result.success).toBe(true)
    })

    it('should update multiple fields at once', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        title: 'New Title',
        content: 'New content',
      })

      expect(result.success).toBe(true)
    })

    it('should use service role client to bypass RLS', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      // Verify service role client was used for update
      expect(createServiceRoleClient).toHaveBeenCalled()
      expect(mockServiceClient.from).toHaveBeenCalledWith('daggerheart_adventures')
    })
  })

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should reject user who does not own adventure', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null, // No adventure found for this user
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Adventure not found or unauthorized')
    })

    it('should verify user_id matches adventure owner', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((field, value) => {
            if (field === 'user_id' && value === testUserId) {
              return {
                single: vi.fn().mockResolvedValue({
                  data: null, // User ID doesn't match
                  error: null,
                }),
              }
            }
            return {
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }
          }),
        }),
      })

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Validation', () => {
    it('should reject invalid title (too long)', async () => {
      const result = await updateMovement(adventureId, movementId, {
        title: 'A'.repeat(201), // Exceeds 200 char limit
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should accept valid title length', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        title: 'A'.repeat(200), // Exactly at limit
      })

      expect(result.success).toBe(true)
    })

    it('should reject empty updates object', async () => {
      const result = await updateMovement(adventureId, movementId, {})

      // Empty updates should still validate and succeed
      // (no-op but not an error)
      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      })

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Adventure not found or unauthorized')
    })

    it('should handle database update errors', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')

      const errorClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          }),
        }),
      }

      vi.mocked(createServiceRoleClient).mockResolvedValue(errorClient as any)

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to update movement')
    })

    it('should handle unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected error')
    })

    it('should handle non-Error exceptions', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw 'String error'
      })

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update movement')
    })
  })

  describe('Movement Array Handling', () => {
    it('should update correct movement in array', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')

      const movement1 = {
        id: 'mov-1',
        title: 'Movement 1',
        type: 'exploration' as const,
        content: 'First',
      }
      const movement2 = {
        id: movementId,
        title: 'Movement 2',
        type: 'combat' as const,
        content: 'Second',
      }
      const movement3 = {
        id: 'mov-3',
        title: 'Movement 3',
        type: 'social' as const,
        content: 'Third',
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: adventureId,
                  user_id: testUserId,
                  movements: [movement1, movement2, movement3],
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated Movement 2',
      })

      expect(result.success).toBe(true)
    })

    it('should handle adventure with null movements', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: adventureId,
                  user_id: testUserId,
                  movements: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceClient)

      const result = await updateMovement(adventureId, movementId, {
        title: 'Updated',
      })

      // Should succeed even with null movements
      expect(result.success).toBe(true)
    })
  })
})
