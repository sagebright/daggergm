import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Daggerheart Content - Phase 2 (Abilities, Items, Consumables)', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    supabase = createClient(supabaseUrl, supabaseKey)
  })

  describe('Abilities', () => {
    it('should have ~191 abilities seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_abilities')
        .select('*', { count: 'exact', head: true })

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(count).toBeGreaterThanOrEqual(180)
    })

    it('should have valid ability types', async () => {
      const validTypes = ['Foundation', 'Specialization', 'Pinnacle']
      const { data } = await supabase.from('daggerheart_abilities').select('ability_type')

      expect(data).toBeDefined()
      const types = data!.map((row) => row.ability_type)
      expect(types.every((t) => validTypes.includes(t))).toBe(true)
    })

    it('should correctly identify domain-based abilities', async () => {
      const { data } = await supabase
        .from('daggerheart_abilities')
        .select('*')
        .eq('name', 'WRANGLE')
        .single()

      expect(data).toBeDefined()
      expect(data!.domain).toBe('Bone')
      expect(data!.level_requirement).toBe(8)
    })
  })

  describe('Items', () => {
    it('should have ~62 items seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_items')
        .select('*', { count: 'exact', head: true })

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(count).toBeGreaterThanOrEqual(58)
    })

    it('should parse Airblade Charm correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_items')
        .select('*')
        .eq('name', 'AIRBLADE CHARM')
        .single()

      expect(data).toBeDefined()
      expect(data!.item_type).toBe('Item')
      expect(data!.description).toContain('charm to a weapon')
    })

    it('should have searchable_text populated', async () => {
      const { data } = await supabase.from('daggerheart_items').select('searchable_text').limit(10)

      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
      expect(data!.every((row) => row.searchable_text && row.searchable_text.length > 0)).toBe(true)
    })
  })

  describe('Consumables', () => {
    it('should have ~62 consumables seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_consumables')
        .select('*', { count: 'exact', head: true })

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(count).toBeGreaterThanOrEqual(58)
    })

    it('should parse Acidpaste correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_consumables')
        .select('*')
        .eq('name', 'ACIDPASTE')
        .single()

      expect(data).toBeDefined()
      expect(data!.uses).toBe(1)
      expect(data!.description).toContain('paste eats away')
    })

    it('should default uses to 1 when not specified', async () => {
      const { data } = await supabase.from('daggerheart_consumables').select('uses')

      expect(data).toBeDefined()
      expect(data!.every((row) => row.uses >= 1)).toBe(true)
    })
  })

  describe('Phase 2 Totals', () => {
    it('should have ~315 total entries from Phase 2', async () => {
      const tables = [
        'daggerheart_abilities', // ~191
        'daggerheart_items', // ~62
        'daggerheart_consumables', // ~62
      ]

      let totalCount = 0
      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

        totalCount += count || 0
      }

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(totalCount).toBeGreaterThanOrEqual(290)
      expect(totalCount).toBeLessThanOrEqual(340)
    })
  })
})
