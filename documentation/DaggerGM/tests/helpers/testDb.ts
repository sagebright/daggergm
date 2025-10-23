import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { randomUUID } from 'crypto'

/**
 * Test Database Helper for DaggerGM
 *
 * Provides utilities for creating/cleaning test data.
 * Uses real Supabase database (local Docker instance).
 *
 * IMPORTANT: Never mock the database in integration tests!
 * Mocking hides RLS bugs and schema issues.
 */

// Supabase client with service role key (bypasses RLS for setup)
const supabaseAdmin = createClient<Database>(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Regular client (respects RLS - use for testing auth)
const supabaseClient = createClient<Database>(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

/**
 * Create a test user with optional credits
 */
export async function createTestUser(options?: {
  email?: string
  credits?: number
  isGuest?: boolean
}) {
  const email = options?.email || `test-${randomUUID()}@example.com`
  const password = 'test-password-123'

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`)
  }

  // Create user record in public.users table
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      credits: options?.credits ?? 1,
      is_guest: options?.isGuest ?? false,
    })
    .select()
    .single()

  if (userError || !userData) {
    throw new Error(`Failed to create user record: ${userError?.message}`)
  }

  return {
    id: userData.id,
    email: userData.email,
    credits: userData.credits,
    authUser: authData.user,
  }
}

/**
 * Create a test adventure with movements
 */
export async function createTestAdventure(options?: {
  userId?: string
  movementCount?: number
  frame?: string
  title?: string
}) {
  let userId = options?.userId

  // Create user if not provided
  if (!userId) {
    const user = await createTestUser({ credits: 10 })
    userId = user.id
  }

  // Create adventure
  const { data: adventure, error: adventureError } = await supabaseAdmin
    .from('adventures')
    .insert({
      user_id: userId,
      tenant_id: userId, // Tenant = user in DaggerGM
      frame: options?.frame || 'Witherwild',
      title: options?.title || 'Test Adventure',
      difficulty: 'medium',
      stakes: 'Test stakes',
      scaffold: {
        overview: 'Test overview',
        hooks: ['Hook 1', 'Hook 2'],
        complications: ['Complication 1'],
      },
    })
    .select()
    .single()

  if (adventureError || !adventure) {
    throw new Error(`Failed to create adventure: ${adventureError?.message}`)
  }

  // Create movements
  const movementCount = options?.movementCount ?? 3
  const movements = []

  for (let i = 0; i < movementCount; i++) {
    const { data: movement, error: movementError } = await supabaseAdmin
      .from('movements')
      .insert({
        adventure_id: adventure.id,
        tenant_id: userId,
        order: i,
        description: `Movement ${i + 1} description`,
        npcs: [
          {
            name: `NPC ${i + 1}`,
            role: 'ally',
            description: 'Test NPC',
          },
        ],
        rewards: ['Test reward'],
        connections: i < movementCount - 1 ? [`Movement ${i + 2}`] : [],
      })
      .select()
      .single()

    if (movementError || !movement) {
      throw new Error(`Failed to create movement: ${movementError?.message}`)
    }

    movements.push(movement)
  }

  return {
    adventure,
    movements,
    userId,
  }
}

/**
 * Create a guest token for testing guest flows
 */
export async function createGuestToken() {
  const token = randomUUID()

  const { data, error } = await supabaseAdmin
    .from('guest_tokens')
    .insert({
      token,
      credits_remaining: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create guest token: ${error?.message}`)
  }

  return {
    token: data.token,
    creditsRemaining: data.credits_remaining,
  }
}

/**
 * Clean up test data for a specific user
 * Deletes in correct order to respect foreign keys
 */
export async function cleanupTestData(userId: string) {
  // Delete movements (references adventures)
  await supabaseAdmin.from('movements').delete().eq('tenant_id', userId)

  // Delete adventures
  await supabaseAdmin.from('adventures').delete().eq('tenant_id', userId)

  // Delete user record
  await supabaseAdmin.from('users').delete().eq('id', userId)

  // Delete auth user
  await supabaseAdmin.auth.admin.deleteUser(userId)
}

/**
 * Clean up guest tokens
 */
export async function cleanupGuestToken(token: string) {
  await supabaseAdmin.from('guest_tokens').delete().eq('token', token)
}

/**
 * Sign in as a test user (returns auth session)
 */
export async function signInTestUser(email: string, password: string = 'test-password-123') {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw new Error(`Failed to sign in test user: ${error?.message}`)
  }

  return {
    session: data.session,
    user: data.user,
  }
}

/**
 * Get Supabase client for testing (respects RLS)
 */
export function getTestSupabaseClient(accessToken?: string) {
  if (!accessToken) {
    return supabaseClient
  }

  return createClient<Database>(
    process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  )
}

/**
 * Wait for database trigger to complete (e.g., after insert)
 * Useful for testing async operations
 */
export async function waitForDbTrigger(ms: number = 100) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Assert RLS policy blocks unauthorized access
 */
export async function assertRlsBlocks(
  operation: () => Promise<any>,
  expectedError: string = 'Row-level security policy',
) {
  try {
    await operation()
    throw new Error('Expected RLS to block operation, but it succeeded')
  } catch (error) {
    if (error instanceof Error) {
      expect(error.message).toContain(expectedError)
    } else {
      throw error
    }
  }
}

/**
 * Example Usage:
 *
 * // In a test file
 * import { createTestUser, createTestAdventure, cleanupTestData } from '@/tests/helpers/testDb';
 *
 * describe('Adventure CRUD', () => {
 *   let userId: string;
 *
 *   beforeEach(async () => {
 *     const user = await createTestUser({ credits: 5 });
 *     userId = user.id;
 *   });
 *
 *   afterEach(async () => {
 *     await cleanupTestData(userId);
 *   });
 *
 *   it('should create adventure', async () => {
 *     const { adventure } = await createTestAdventure({ userId });
 *     expect(adventure.title).toBe('Test Adventure');
 *   });
 * });
 */
