import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import type { Database } from '@/types/database.generated'

/**
 * Integration test for regeneration tracking schema
 * Tests the database schema directly (not mocked)
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set
 * - Migration 00006_add_regeneration_tracking.sql must be applied
 */
describe('Regeneration Tracking Schema', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testUserId: string
  let createdAdventureIds: string[] = []

  beforeEach(async () => {
    // Create a test Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment')
    }

    supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create a test user (or use an existing one)
    // For now, we'll use a hardcoded test user ID
    // In production tests, we'd create a real auth user
    testUserId = '00000000-0000-0000-0000-000000000001'

    // Reset createdAdventureIds for cleanup
    createdAdventureIds = []
  })

  afterEach(async () => {
    // Clean up created adventures
    if (createdAdventureIds.length > 0) {
      await supabase.from('adventures').delete().in('id', createdAdventureIds)
    }
  })

  it('should have scaffold_regenerations_used column with default 0', async () => {
    const { data, error } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
    }

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.scaffold_regenerations_used).toBe(0)

    if (data?.id) {
      createdAdventureIds.push(data.id)
    }
  })

  it('should have expansion_regenerations_used column with default 0', async () => {
    const { data, error } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure 2',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
    }

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.expansion_regenerations_used).toBe(0)

    if (data?.id) {
      createdAdventureIds.push(data.id)
    }
  })

  it('should enforce non-negative constraint on scaffold_regenerations_used', async () => {
    const { data: adventure } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure 3',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    if (adventure?.id) {
      createdAdventureIds.push(adventure.id)
    }

    const { error } = await supabase
      .from('adventures')
      .update({ scaffold_regenerations_used: -1 })
      .eq('id', adventure!.id)

    expect(error).not.toBeNull()
    expect(error?.message).toContain('constraint')
  })

  it('should enforce non-negative constraint on expansion_regenerations_used', async () => {
    const { data: adventure } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure 4',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    if (adventure?.id) {
      createdAdventureIds.push(adventure.id)
    }

    const { error } = await supabase
      .from('adventures')
      .update({ expansion_regenerations_used: -1 })
      .eq('id', adventure!.id)

    expect(error).not.toBeNull()
    expect(error?.message).toContain('constraint')
  })

  it('should allow incrementing regeneration counters', async () => {
    const { data: adventure } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure 5',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    if (adventure?.id) {
      createdAdventureIds.push(adventure.id)
    }

    const { error } = await supabase
      .from('adventures')
      .update({
        scaffold_regenerations_used: 5,
        expansion_regenerations_used: 12,
      })
      .eq('id', adventure!.id)

    expect(error).toBeNull()

    const { data: updated } = await supabase
      .from('adventures')
      .select()
      .eq('id', adventure!.id)
      .single()

    expect(updated!.scaffold_regenerations_used).toBe(5)
    expect(updated!.expansion_regenerations_used).toBe(12)
  })

  it('should allow values up to the limit (10 for scaffold, 20 for expansion)', async () => {
    const { data: adventure } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure 6',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    if (adventure?.id) {
      createdAdventureIds.push(adventure.id)
    }

    // Test max scaffold value
    const { error: scaffoldError } = await supabase
      .from('adventures')
      .update({ scaffold_regenerations_used: 10 })
      .eq('id', adventure!.id)

    expect(scaffoldError).toBeNull()

    // Test max expansion value
    const { error: expansionError } = await supabase
      .from('adventures')
      .update({ expansion_regenerations_used: 20 })
      .eq('id', adventure!.id)

    expect(expansionError).toBeNull()

    // Verify final state
    const { data: updated } = await supabase
      .from('adventures')
      .select()
      .eq('id', adventure!.id)
      .single()

    expect(updated!.scaffold_regenerations_used).toBe(10)
    expect(updated!.expansion_regenerations_used).toBe(20)
  })
})
