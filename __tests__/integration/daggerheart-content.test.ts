/**
 * Integration Tests: Daggerheart Content Database
 *
 * Tests the 13 canonical content tables seeded from official SRD markdown files.
 * These tests verify:
 * - Tables are populated with expected entry counts
 * - Data integrity (valid tiers, types, required fields)
 * - Searchable text is populated
 * - Vector embeddings are generated
 * - Specific known entries are parsed correctly
 *
 * TDD Phase: RED - These tests MUST fail initially (no data seeded yet)
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

import type { Database } from '@/types/database.generated'

describe('Daggerheart Content Database', () => {
  let supabase: ReturnType<typeof createClient<Database>>

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment')
    }

    supabase = createClient<Database>(supabaseUrl, supabaseKey)
  })

  describe('1. Adversaries Table (~129 entries)', () => {
    it('should have adversaries seeded', async () => {
      const { error, count } = await supabase
        .from('daggerheart_adversaries')
        .select('*', { count: 'exact', head: true })

      expect(error).toBeNull()
      expect(count).toBe(129) // All adversaries from SRD (tiers 1-4)
    })

    it('should have valid tier values (1-4)', async () => {
      const { data } = await supabase.from('daggerheart_adversaries').select('tier')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.length).toBeGreaterThan(0)

      const tiers = data.map((row) => row.tier)
      expect(tiers.every((t) => t >= 1 && t <= 4)).toBe(true)
    })

    it('should have searchable_text populated', async () => {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('name, searchable_text')
        .limit(10)

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.length).toBeGreaterThan(0)

      for (const row of data) {
        expect(row.searchable_text).toBeTruthy()
        expect(row.searchable_text.length).toBeGreaterThan(0)
      }
    })

    it('should parse Acid Burrower correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('*')
        .eq('name', 'ACID BURROWER')
        .single()

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.tier).toBe(1)
      expect(data.type).toBe('Solo')
      expect(data.description).toContain('horse-sized insect')
      expect(data.difficulty).toBe(14)
      expect(data.hp).toBe(8)
      expect(data.stress).toBe(3)
      expect(data.motives_tactics).toContain('Burrow')
      expect(data.features).toBeDefined()
      expect(Array.isArray(data.features)).toBe(true)
      expect(data.features.length).toBeGreaterThan(0)

      // Check first feature structure
      const feature = data.features[0]
      expect(feature).toHaveProperty('name')
      expect(feature).toHaveProperty('type')
      expect(feature).toHaveProperty('desc')
      expect(['Passive', 'Action', 'Reaction']).toContain(feature.type)
    })

    it('should have embeddings generated', async () => {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('name, embedding')
        .not('embedding', 'is', null)
        .limit(5)

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.length).toBeGreaterThan(0)

      // Check embedding is vector of 1536 dimensions
      // Note: Supabase returns vector columns as JSON strings
      const embedding = JSON.parse(data[0].embedding as string)
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBe(1536)
    })
  })

  describe('2. Weapons Table (~194 entries)', () => {
    it('should have weapons seeded', async () => {
      const { count, error } = await supabase
        .from('daggerheart_weapons')
        .select('*', { count: 'exact', head: true })

      expect(error).toBeNull()
      expect(count).toBeGreaterThanOrEqual(150) // ~194 expected
    })

    it('should have both Primary and Secondary categories', async () => {
      const { data } = await supabase.from('daggerheart_weapons').select('weapon_category')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      const categories = new Set(data.map((w) => w.weapon_category))
      expect(categories.has('Primary')).toBe(true)
      expect(categories.has('Secondary')).toBe(true)
    })

    it('should have valid traits', async () => {
      const validTraits = ['Strength', 'Agility', 'Finesse', 'Instinct', 'Knowledge', 'Presence']

      const { data } = await supabase.from('daggerheart_weapons').select('trait')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      const traits = data.map((w) => w.trait)
      expect(traits.every((t) => validTraits.includes(t))).toBe(true)
    })

    it('should parse Advanced Battleaxe correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_weapons')
        .select('*')
        .eq('name', 'ADVANCED BATTLEAXE')
        .single()

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.weapon_category).toBe('Primary')
      expect(data.tier).toBe(3)
      expect(data.trait).toBe('Strength')
      expect(data.range).toBe('Melee')
      expect(data.damage).toBe('d10+9 phy')
      expect(data.burden).toBe('Two-Handed')
    })
  })

  describe('3. Classes Table (~9 entries)', () => {
    it('should have classes seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_classes')
        .select('*', { count: 'exact', head: true })

      expect(count).toBe(9) // 9 classes in SRD
    })

    it('should parse Bard class correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_classes')
        .select('*')
        .eq('name', 'BARD')
        .single()

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.domains).toEqual(['Grace', 'Codex'])
      expect(data.starting_evasion).toBe(10)
      expect(data.starting_hp).toBe(5)
      expect(data.hope_feature).toBeDefined()
      expect(data.hope_feature.name).toBe('Make a Scene')
      expect(data.class_feature).toBeDefined()
      expect(data.class_feature.name).toBe('Rally')
      expect(data.background_questions).toBeDefined()
      expect(Array.isArray(data.background_questions)).toBe(true)
      expect(data.background_questions.length).toBeGreaterThan(0)
    })
  })

  describe('4. Armor Table (~36 entries)', () => {
    it('should have armor seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_armor')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(30) // ~36 expected
    })

    it('should have valid tier values', async () => {
      const { data } = await supabase.from('daggerheart_armor').select('tier')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      const tiers = data.map((row) => row.tier)
      expect(tiers.every((t) => t >= 1 && t <= 4)).toBe(true) // Tier 4 items exist in SRD
    })
  })

  describe('5. Items Table (~62 entries)', () => {
    it('should have items seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_items')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(50) // ~62 expected
    })
  })

  describe('6. Consumables Table (~62 entries)', () => {
    it('should have consumables seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_consumables')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(50) // ~62 expected
    })
  })

  describe('7. Ancestries Table (~20 entries)', () => {
    it('should have ancestries seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_ancestries')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(15) // ~20 expected
    })
  })

  describe('8. Subclasses Table (~20 entries)', () => {
    it('should have subclasses seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_subclasses')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(15) // ~20 expected
    })

    it('should have valid parent_class references', async () => {
      const { data } = await supabase.from('daggerheart_subclasses').select('parent_class')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.every((row) => row.parent_class)).toBe(true)
    })
  })

  describe('9. Domains Table (~9 entries)', () => {
    it('should have domains seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_domains')
        .select('*', { count: 'exact', head: true })

      expect(count).toBe(9) // 9 domains in SRD (same as classes)
    })
  })

  describe('10. Abilities Table (~191 entries)', () => {
    it('should have abilities seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_abilities')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(150) // ~191 expected
    })

    it('should have valid ability types', async () => {
      const validTypes = ['Foundation', 'Specialization', 'Pinnacle']
      const { data } = await supabase.from('daggerheart_abilities').select('ability_type')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      const types = data.map((row) => row.ability_type)
      expect(types.every((t) => validTypes.includes(t))).toBe(true)
    })
  })

  describe('11. Communities Table (~9 entries)', () => {
    it('should have communities seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_communities')
        .select('*', { count: 'exact', head: true })

      expect(count).toBe(9) // 9 communities in SRD
    })
  })

  describe('12. Environments Table (~20 entries)', () => {
    it('should have environments seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_environments')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(15) // ~20 expected
    })

    it('should have valid tier values', async () => {
      const { data } = await supabase.from('daggerheart_environments').select('tier')

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      const tiers = data.map((row) => row.tier)
      expect(tiers.every((t) => t >= 1 && t <= 4)).toBe(true) // Tier 4 items exist in SRD
    })
  })

  describe('13. Frames Table (~1 entry)', () => {
    it('should have frames seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_frames')
        .select('*', { count: 'exact', head: true })

      expect(count).toBe(1) // Only 1 frame in SRD
    })

    it('should have embeddings generated for frames', async () => {
      const { data } = await supabase
        .from('daggerheart_frames')
        .select('name, embedding')
        .not('embedding', 'is', null)

      expect(data).toBeDefined()
      if (!data) {
        return
      }

      expect(data.length).toBe(1) // Only 1 frame
    })
  })

  describe('Overall Database Integrity', () => {
    it('should have ~738+ total entries across all tables', async () => {
      const tables: (keyof Database['public']['Tables'])[] = [
        'daggerheart_adversaries', // ~129 (all tiers)
        'daggerheart_weapons', // ~192
        'daggerheart_abilities', // ~189
        'daggerheart_consumables', // ~60
        'daggerheart_items', // ~60
        'daggerheart_armor', // ~34
        'daggerheart_ancestries', // ~18
        'daggerheart_subclasses', // ~18
        'daggerheart_environments', // ~19
        'daggerheart_classes', // ~9
        'daggerheart_domains', // ~9
        'daggerheart_communities', // ~9
        'daggerheart_frames', // ~1
      ]

      let totalCount = 0
      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

        totalCount += count || 0
      }

      expect(totalCount).toBeGreaterThanOrEqual(738) // ~747 actual (720 + 18 tier-4 + 9 domains)
    })
  })
})
