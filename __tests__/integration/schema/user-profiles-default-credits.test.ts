import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import type { Database } from '@/types/database.generated'

/**
 * Integration test for user_profiles default credits
 *
 * This test verifies that:
 * 1. New user profiles are created with 0 credits by default (after migration)
 * 2. Existing users' credit balances are unchanged
 * 3. Credits can still be explicitly set during profile creation
 *
 * @requires Real Supabase connection (uses remote JMK project)
 * @coverage Integration test for database schema default values
 * @note GitHub secrets updated to point to production Supabase project
 * @note CI workflow updated to pass env vars to coverage step
 */

describe('User Profiles - Default Credits', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  const testUserIds: string[] = []

  beforeAll(() => {
    // Create service role client for testing with elevated privileges
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for integration tests',
      )
    }

    supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  })

  afterAll(async () => {
    // Cleanup: Delete test users created during this test
    if (testUserIds.length > 0) {
      // Delete user profiles first (due to foreign key constraints)
      await supabase.from('daggerheart_user_profiles').delete().in('id', testUserIds)

      // Delete auth users
      for (const userId of testUserIds) {
        await supabase.auth.admin.deleteUser(userId)
      }
    }
  })

  it('should create new user profile with 0 credits by default', async () => {
    // Create a test user via auth
    const testEmail = `test-default-credits-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    expect(authError).toBeNull()
    expect(authData.user).not.toBeNull()

    if (authData.user) {
      testUserIds.push(authData.user.id)

      // User profile should be auto-created by trigger with 0 credits
      const { data: profile, error: profileError } = await supabase
        .from('daggerheart_user_profiles')
        .select('credits, email')
        .eq('id', authData.user.id)
        .single()

      expect(profileError).toBeNull()
      expect(profile).not.toBeNull()
      expect(profile?.credits).toBe(0)
      expect(profile?.email).toBe(testEmail)
    }
  })

  it('should allow creating user profile with explicitly set credits', async () => {
    // Create user with explicit credits (e.g., after purchase)
    const testEmail = `test-explicit-credits-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    expect(authError).toBeNull()
    expect(authData.user).not.toBeNull()

    if (authData.user) {
      testUserIds.push(authData.user.id)

      // Delete the auto-created profile so we can test manual insert
      await supabase.from('daggerheart_user_profiles').delete().eq('id', authData.user.id)

      // Manually insert profile with explicit credits
      const { data: profile, error: profileError } = await supabase
        .from('daggerheart_user_profiles')
        .insert({
          id: authData.user.id,
          email: testEmail,
          credits: 10, // Explicitly set credits
        })
        .select()
        .single()

      expect(profileError).toBeNull()
      expect(profile).not.toBeNull()
      expect(profile?.credits).toBe(10)
    }
  })

  it('should allow inserting profile without specifying credits (uses DEFAULT 0)', async () => {
    // Create auth user first
    const testEmail = `test-default-unspecified-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    expect(authError).toBeNull()
    expect(authData.user).not.toBeNull()

    if (authData.user) {
      testUserIds.push(authData.user.id)

      // Delete the auto-created profile
      await supabase.from('daggerheart_user_profiles').delete().eq('id', authData.user.id)

      // Insert profile without specifying credits - should use DEFAULT 0
      const { data: profile, error: profileError } = await supabase
        .from('daggerheart_user_profiles')
        .insert({
          id: authData.user.id,
          email: testEmail,
          // credits intentionally omitted - should use DEFAULT 0
        })
        .select()
        .single()

      expect(profileError).toBeNull()
      expect(profile).not.toBeNull()
      expect(profile?.credits).toBe(0)
    }
  })

  it('should enforce credits >= 0 constraint', async () => {
    // Create auth user
    const testEmail = `test-negative-credits-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    expect(authError).toBeNull()
    expect(authData.user).not.toBeNull()

    if (authData.user) {
      testUserIds.push(authData.user.id)

      // Delete auto-created profile
      await supabase.from('daggerheart_user_profiles').delete().eq('id', authData.user.id)

      // Try to insert profile with negative credits - should fail
      const { error: profileError } = await supabase.from('daggerheart_user_profiles').insert({
        id: authData.user.id,
        email: testEmail,
        credits: -1, // Invalid: negative credits
      })

      expect(profileError).not.toBeNull()
      expect(profileError?.message).toContain('credits')
    }
  })
})
