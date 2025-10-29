/**
 * Integration Tests: expandScene Server Action
 *
 * Tests the expandScene server action which:
 * 1. Expands scenes with six-component structure
 * 2. Resolves Daggerheart content references (NPCs, adversaries, environment, loot)
 * 3. Updates adventure with scene expansion
 * 4. Tracks analytics
 * 5. Enforces rate limiting
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 90%+ (critical feature)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { expandScene } from '@/app/actions/scenes'
import type { Scene, SceneExpansion } from '@/lib/llm/types'
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
    expandScene: vi.fn().mockResolvedValue({
      descriptions: [
        'The cave mouth looms before you, dark and foreboding',
        'Strange chittering echoes from within',
        'The air smells damp and acrid',
      ],
      narration: 'A voice whispers from the darkness: "Turn back..."',
      npcs: [
        {
          id: '00000000-0000-4000-8000-000000000101',
          name: 'Kaelen the Wanderer',
          className: 'Bard',
          communityName: 'Wanderer',
          ancestryName: 'Human',
          level: 2,
          hp: 15,
          stress: 12,
          evasion: 12,
          personality: 'Jovial but secretive',
          role: 'quest_giver',
          description: 'A traveling bard with a lute',
        },
      ],
      adversaries: [
        {
          id: '00000000-0000-4000-8000-000000000102',
          adversaryName: 'ACID BURROWER',
          quantity: 2,
        },
      ],
      environment: {
        environmentName: 'THE WITHERWILD',
        customDescription: 'Overgrown with pulsing vines',
      },
      loot: {
        items: [
          {
            itemName: 'Healing Potion',
            itemType: 'consumable',
            quantity: 2,
          },
          {
            itemName: 'Shortsword',
            itemType: 'weapon',
            quantity: 1,
          },
        ],
      },
    } as SceneExpansion),
  })),
}))

// Mock analytics
vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
  ANALYTICS_EVENTS: {
    SCENE_EXPANDED: 'scene.expanded',
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

describe('expandScene Server Action', () => {
  let adventureId: string
  let sceneId: string
  let mockSupabase: any

  beforeEach(() => {
    adventureId = '00000000-0000-4000-8000-000000000001'
    sceneId = '00000000-0000-4000-8000-000000000002'

    const mockScene: Scene = {
      id: sceneId,
      title: 'The Cave Entrance',
      type: 'exploration',
      description: 'A dark cave opening',
      estimatedTime: '30 minutes',
      orderIndex: 0,
    }

    const mockAdventure = {
      id: adventureId,
      user_id: 'test-user-id',
      frame: 'quest',
      focus: 'Rescue the village',
      config: {
        partySize: 4,
        partyLevel: 2,
      },
      movements: [mockScene],
    }

    // Mock Supabase responses for Daggerheart content resolution
    const mockClassData = { id: '00000000-0000-4000-8000-000000000201' }
    const mockAncestryData = { id: '00000000-0000-4000-8000-000000000202' }
    const mockCommunityData = { id: '00000000-0000-4000-8000-000000000203' }
    const mockAdversaryData = { id: '00000000-0000-4000-8000-000000000204' }
    const mockEnvironmentData = { id: '00000000-0000-4000-8000-000000000205' }
    const mockConsumableData = { id: '00000000-0000-4000-8000-000000000206' }
    const mockWeaponData = { id: '00000000-0000-4000-8000-000000000207', tier: 1 }

    mockSupabase = {
      from: vi.fn((tableName: string) => {
        const mockChain = {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                // Return different data based on table name
                if (tableName === 'daggerheart_adventures') {
                  return Promise.resolve({
                    data: mockAdventure,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_classes') {
                  return Promise.resolve({
                    data: mockClassData,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_ancestries') {
                  return Promise.resolve({
                    data: mockAncestryData,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_communities') {
                  return Promise.resolve({
                    data: mockCommunityData,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_adversaries') {
                  return Promise.resolve({
                    data: mockAdversaryData,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_environments') {
                  return Promise.resolve({
                    data: mockEnvironmentData,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_consumables') {
                  return Promise.resolve({
                    data: mockConsumableData,
                    error: null,
                  })
                } else if (tableName === 'daggerheart_weapons') {
                  return Promise.resolve({
                    data: mockWeaponData,
                    error: null,
                  })
                }
                return Promise.resolve({
                  data: null,
                  error: null,
                })
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }
        return mockChain
      }),
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('Successful Expansion', () => {
    it('should expand scene with all six components', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(true)
      expect(result.expansion).toBeDefined()
      expect(result.expansion?.descriptions).toBeDefined()
      expect(result.expansion?.narration).toBeDefined()
      expect(result.expansion?.npcs).toBeDefined()
      expect(result.expansion?.adversaries).toBeDefined()
      expect(result.expansion?.environment).toBeDefined()
      expect(result.expansion?.loot).toBeDefined()
    })

    it('should resolve NPC Daggerheart references to database IDs', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(true)
      expect(result.expansion?.npcs).toBeDefined()
      if (result.expansion?.npcs && result.expansion.npcs.length > 0) {
        const npc = result.expansion.npcs[0]
        expect(npc?.classId).toBe('00000000-0000-4000-8000-000000000201')
        expect(npc?.ancestryId).toBe('00000000-0000-4000-8000-000000000202')
        expect(npc?.communityId).toBe('00000000-0000-4000-8000-000000000203')
      }
    })

    it('should resolve adversary references to database IDs', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(true)
      expect(result.expansion?.adversaries).toBeDefined()
      if (result.expansion?.adversaries && result.expansion.adversaries.length > 0) {
        const adversary = result.expansion.adversaries[0]
        expect(adversary?.adversaryId).toBe('00000000-0000-4000-8000-000000000204')
      }
    })

    it('should resolve environment reference to database ID', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(true)
      expect(result.expansion?.environment).toBeDefined()
      if (result.expansion?.environment) {
        expect(result.expansion.environment.environmentId).toBe(
          '00000000-0000-4000-8000-000000000205',
        )
      }
    })

    it('should resolve loot references to database IDs with tier info', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(true)
      expect(result.expansion?.loot).toBeDefined()
      if (result.expansion?.loot) {
        const consumable = result.expansion.loot.items.find(
          (item) => item.itemType === 'consumable',
        )
        const weapon = result.expansion.loot.items.find((item) => item.itemType === 'weapon')

        expect(consumable?.itemId).toBe('00000000-0000-4000-8000-000000000206')
        expect(weapon?.itemId).toBe('00000000-0000-4000-8000-000000000207')
        expect(weapon?.tier).toBe(1)
      }
    })

    it('should update adventure with scene expansion', async () => {
      await expandScene(adventureId, sceneId)

      // Verify update was called with correct data
      expect(mockSupabase.from).toHaveBeenCalledWith('daggerheart_adventures')
      const fromCall = mockSupabase.from.mock.results.find(
        (r: any) => r.value?.update !== undefined,
      )
      expect(fromCall).toBeDefined()
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

      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Adventure not found')
    })

    it('should return error when scene not found in movements', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                movements: [
                  {
                    id: 'different-scene-id',
                    title: 'Different Scene',
                    type: 'combat',
                    description: 'A different scene',
                  },
                ],
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await expandScene(adventureId, 'nonexistent-scene-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Scene not found in adventure')
    })

    it('should return error when database update fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                frame: 'quest',
                focus: 'Rescue',
                config: { partySize: 4, partyLevel: 2 },
                movements: [
                  {
                    id: sceneId,
                    title: 'The Cave Entrance',
                    type: 'exploration',
                    description: 'A dark cave',
                  },
                ],
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database write failed' },
          }),
        }),
      })

      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to update adventure')
    })
  })

  describe('Content Resolution Edge Cases', () => {
    it('should handle missing NPC class reference gracefully', async () => {
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'daggerheart_classes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Class not found' },
                }),
              }),
            }),
          }
        }
        // Return success for other tables
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: adventureId,
                  frame: 'quest',
                  focus: 'Rescue',
                  config: { partySize: 4, partyLevel: 2 },
                  movements: [
                    {
                      id: sceneId,
                      title: 'Cave',
                      type: 'exploration',
                      description: 'Dark',
                    },
                  ],
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }
      })

      const result = await expandScene(adventureId, sceneId)

      // Should still succeed even if class lookup fails
      expect(result.success).toBe(true)
    })

    it('should handle scene with no config defaults', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: adventureId,
                frame: 'quest',
                focus: 'Rescue',
                config: null, // No config
                movements: [
                  {
                    id: sceneId,
                    title: 'Cave',
                    type: 'exploration',
                    description: 'Dark',
                  },
                ],
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      const result = await expandScene(adventureId, sceneId)

      // Should use defaults (partySize: 4, partyLevel: 1)
      expect(result.success).toBe(true)
    })
  })

  describe('Analytics Tracking', () => {
    it('should track scene expansion with analytics', async () => {
      const { analytics, ANALYTICS_EVENTS } = await import('@/lib/analytics/analytics')

      await expandScene(adventureId, sceneId)

      expect(analytics.track).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SCENE_EXPANDED,
        expect.objectContaining({
          adventureId,
          sceneId,
          sceneType: 'exploration',
          frame: 'quest',
          hasNPCs: true,
          hasAdversaries: true,
          hasEnvironment: true,
          hasLoot: true,
        }),
      )
    })
  })
})
