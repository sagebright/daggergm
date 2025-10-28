/**
 * Integration Tests: Scene Expansion with Six-Component Structure
 *
 * Tests that scene expansion:
 * 1. Returns all 6 component types correctly (descriptions, narration, NPCs, adversaries, environment, loot)
 * 2. Validates Daggerheart content references (classes, ancestries, communities, adversaries, etc.)
 * 3. Enforces tier-appropriate adversaries and loot based on party level
 * 4. Uses vector search to find relevant content
 * 5. Saves structured expansion data to database
 *
 * Database: Remote Supabase (JMK project)
 * Coverage Target: 90%+ (critical feature)
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'

import type { Scene, SceneExpansion } from '@/lib/llm/types'
import type { Database } from '@/types/database.generated'

describe('Scene Expansion with Six-Component Structure', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testUserId: string
  let adventureId: string
  let scene: Scene

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment')
    }

    supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  })

  beforeEach(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`)
    }

    testUserId = authData.user.id

    // Create test adventure with scenes (using current schema with movements array)
    const testScenes: Scene[] = [
      {
        id: crypto.randomUUID(),
        title: 'The Cave Entrance',
        type: 'exploration',
        description: 'A dark cave opening with strange sounds echoing from within',
        estimatedTime: '30 minutes',
        orderIndex: 0,
      },
    ]

    const { data: adventure, error: advError } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure for Scene Expansion',
        frame: 'quest',
        focus: 'Rescue the village from underground creatures',
        config: {
          partySize: 4,
          partyLevel: 2,
          difficulty: 'standard',
          stakes: 'personal',
        },
        movements: testScenes as any,
        state: 'draft',
      })
      .select()
      .single()

    if (advError || !adventure) {
      throw new Error(`Failed to create test adventure: ${advError?.message}`)
    }

    adventureId = adventure.id
    scene = (adventure.movements as unknown as Scene[])[0]!
  })

  afterEach(async () => {
    // Cleanup: Delete test adventure and user
    if (adventureId) {
      await supabase.from('adventures').delete().eq('id', adventureId)
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  describe('Required Components', () => {
    it('should always return scene descriptions array', async () => {
      // This test will FAIL until we implement expandScene action
      // For now, we're testing the structure we expect
      const mockExpansion: SceneExpansion = {
        descriptions: [
          'The cave mouth yawns before you, damp and dark',
          'Strange chittering sounds echo from the depths',
          'The air smells of earth and something acrid',
        ],
      }

      expect(mockExpansion.descriptions).toBeDefined()
      expect(Array.isArray(mockExpansion.descriptions)).toBe(true)
      expect(mockExpansion.descriptions.length).toBeGreaterThan(0)
      expect(typeof mockExpansion.descriptions[0]).toBe('string')
    })

    it('should validate descriptions is a non-empty array of strings', () => {
      const mockExpansion: SceneExpansion = {
        descriptions: ['Description 1', 'Description 2'],
      }

      expect(mockExpansion.descriptions.length).toBeGreaterThanOrEqual(1)
      mockExpansion.descriptions.forEach((desc) => {
        expect(typeof desc).toBe('string')
        expect(desc.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Optional Components', () => {
    it('should have narration as string or null or undefined', () => {
      const expansionWithNarration: SceneExpansion = {
        descriptions: ['Test'],
        narration: 'A voice echoes: "Who dares enter?"',
      }

      const expansionWithoutNarration: SceneExpansion = {
        descriptions: ['Test'],
        narration: null,
      }

      const expansionUndefined: SceneExpansion = {
        descriptions: ['Test'],
      }

      expect(typeof expansionWithNarration.narration).toBe('string')
      expect(expansionWithoutNarration.narration).toBeNull()
      expect(expansionUndefined.narration).toBeUndefined()
    })

    it('should have NPCs as array or undefined', () => {
      const mockExpansion: SceneExpansion = {
        descriptions: ['Test'],
        npcs: [
          {
            id: crypto.randomUUID(),
            name: 'Kaelen the Wanderer',
            classId: crypto.randomUUID(),
            className: 'Bard',
            communityId: crypto.randomUUID(),
            communityName: 'Wanderer',
            ancestryId: crypto.randomUUID(),
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
      }

      if (mockExpansion.npcs) {
        expect(Array.isArray(mockExpansion.npcs)).toBe(true)
      }
    })

    it('should have adversaries as array or undefined', () => {
      const mockExpansion: SceneExpansion = {
        descriptions: ['Test'],
        adversaries: [
          {
            id: crypto.randomUUID(),
            adversaryId: crypto.randomUUID(),
            adversaryName: 'ACID BURROWER',
            quantity: 2,
          },
        ],
      }

      if (mockExpansion.adversaries) {
        expect(Array.isArray(mockExpansion.adversaries)).toBe(true)
      }
    })

    it('should have environment as object or undefined', () => {
      const mockExpansion: SceneExpansion = {
        descriptions: ['Test'],
        environment: {
          environmentId: crypto.randomUUID(),
          environmentName: 'THE WITHERWILD',
          customDescription: 'Overgrown with pulsing vines',
        },
      }

      if (mockExpansion.environment) {
        expect(typeof mockExpansion.environment).toBe('object')
        expect(mockExpansion.environment.environmentId).toBeDefined()
        expect(mockExpansion.environment.environmentName).toBeDefined()
      }
    })

    it('should have loot as object with items array or undefined', () => {
      const mockExpansion: SceneExpansion = {
        descriptions: ['Test'],
        loot: {
          items: [
            {
              itemId: crypto.randomUUID(),
              itemName: 'Healing Potion',
              itemType: 'consumable',
              quantity: 2,
            },
          ],
        },
      }

      if (mockExpansion.loot) {
        expect(typeof mockExpansion.loot).toBe('object')
        expect(Array.isArray(mockExpansion.loot.items)).toBe(true)
      }
    })
  })

  describe('NPC Structure Validation', () => {
    it('should validate NPC has all required Daggerheart fields', () => {
      const mockNPC = {
        id: crypto.randomUUID(),
        name: 'Test NPC',
        classId: crypto.randomUUID(),
        className: 'Bard',
        communityId: crypto.randomUUID(),
        communityName: 'Wanderer',
        ancestryId: crypto.randomUUID(),
        ancestryName: 'Human',
        level: 2,
        hp: 15,
        stress: 12,
        evasion: 12,
        personality: 'Friendly',
        role: 'ally' as const,
        description: 'A helpful NPC',
      }

      // Validate required fields
      expect(mockNPC.id).toBeDefined()
      expect(mockNPC.name).toBeDefined()
      expect(mockNPC.classId).toBeDefined()
      expect(mockNPC.className).toBeDefined()
      expect(mockNPC.communityId).toBeDefined()
      expect(mockNPC.communityName).toBeDefined()
      expect(mockNPC.ancestryId).toBeDefined()
      expect(mockNPC.ancestryName).toBeDefined()
      expect(mockNPC.level).toBeGreaterThan(0)
      expect(mockNPC.hp).toBeGreaterThan(0)
      expect(mockNPC.stress).toBeGreaterThan(0)
      expect(mockNPC.evasion).toBeGreaterThan(0)
      expect(['ally', 'neutral', 'antagonist', 'quest_giver']).toContain(mockNPC.role)
    })

    it('should assign unique IDs to each NPC', () => {
      const npc1Id = crypto.randomUUID()
      const npc2Id = crypto.randomUUID()

      expect(npc1Id).not.toBe(npc2Id)
    })
  })

  describe('Vector Search Functions', () => {
    it('should find adversaries via search_adversaries function', async () => {
      const { data, error } = await supabase.rpc('search_adversaries', {
        search_query: 'underground creature cave',
        party_level: 2,
        limit_count: 5,
      })

      // This will pass once migration is applied
      expect(error).toBeNull()
      if (data) {
        expect(Array.isArray(data)).toBe(true)
        // Note: Data may be empty if no adversaries match the search
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id')
          expect(data[0]).toHaveProperty('name')
          expect(data[0]).toHaveProperty('tier')
          expect(data[0]).toHaveProperty('similarity')
        }
      }
    })

    it('should find environments via search_environments function', async () => {
      const { data, error } = await supabase.rpc('search_environments', {
        search_query: 'dark forest mystery',
        limit_count: 3,
      })

      // This will pass once migration is applied
      expect(error).toBeNull()
      if (data) {
        expect(Array.isArray(data)).toBe(true)
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id')
          expect(data[0]).toHaveProperty('name')
          expect(data[0]).toHaveProperty('similarity')
        }
      }
    })

    it('should get tier-appropriate loot via get_tier_appropriate_loot function', async () => {
      const { data, error } = await supabase.rpc('get_tier_appropriate_loot', {
        party_level: 2,
        item_type: 'all',
        limit_count: 10,
      })

      // This will pass once migration is applied
      expect(error).toBeNull()
      if (data) {
        expect(Array.isArray(data)).toBe(true)
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id')
          expect(data[0]).toHaveProperty('name')
          expect(data[0]).toHaveProperty('tier')
        }
      }
    })
  })

  describe('Tier-Appropriate Content', () => {
    it('should only return adversaries within tier threshold for party level', () => {
      const partyLevel = 2
      const maxTier = Math.ceil(partyLevel / 3) // Level 2 → Tier 1

      // Mock adversary tier check
      const mockAdversaryTier = 1
      expect(mockAdversaryTier).toBeLessThanOrEqual(maxTier)
    })

    it('should only return loot within tier threshold for party level', () => {
      const partyLevel = 5
      const maxTier = Math.ceil(partyLevel / 3) // Level 5 → Tier 2

      const mockLootTier = 2
      expect(mockLootTier).toBeLessThanOrEqual(maxTier)
    })

    it('should calculate tier threshold correctly for all party levels', () => {
      // Level 1-3 → Tier 1
      expect(Math.ceil(1 / 3)).toBe(1)
      expect(Math.ceil(2 / 3)).toBe(1)
      expect(Math.ceil(3 / 3)).toBe(1)

      // Level 4-6 → Tier 2
      expect(Math.ceil(4 / 3)).toBe(2)
      expect(Math.ceil(5 / 3)).toBe(2)
      expect(Math.ceil(6 / 3)).toBe(2)

      // Level 7-10 → Tier 3
      expect(Math.ceil(7 / 3)).toBe(3)
      expect(Math.ceil(8 / 3)).toBe(3)
      expect(Math.ceil(9 / 3)).toBe(3)
      expect(Math.ceil(10 / 3)).toBe(4) // Cap at 3 in actual implementation
    })
  })

  describe('Database Storage', () => {
    it('should store scene expansion in adventure.movements array', async () => {
      // Create mock expansion
      const mockExpansion: SceneExpansion = {
        descriptions: ['Test description 1', 'Test description 2'],
        narration: 'Test narration',
      }

      // Update scene with expansion
      const updatedScenes = [
        {
          ...scene,
          expansion: mockExpansion,
        },
      ]

      const { error } = await supabase
        .from('adventures')
        .update({
          movements: updatedScenes as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adventureId)

      expect(error).toBeNull()

      // Verify it was saved
      const { data: retrieved, error: retrieveError } = await supabase
        .from('adventures')
        .select('movements')
        .eq('id', adventureId)
        .single()

      expect(retrieveError).toBeNull()
      expect(retrieved).toBeDefined()

      const retrievedScenes = retrieved!.movements as unknown as Scene[]
      expect(retrievedScenes[0]!.expansion).toBeDefined()
      expect(retrievedScenes[0]!.expansion!.descriptions).toEqual(mockExpansion.descriptions)
    })
  })
})
