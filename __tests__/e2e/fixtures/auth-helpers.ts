import { createClient } from '@supabase/supabase-js'

/**
 * Create a confirmed test user using Supabase Admin API
 * This bypasses email confirmation for E2E testing
 */
export async function createConfirmedTestUser(email: string, password: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  // Delete user if exists (cleanup from previous test runs)
  try {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === email)
    if (existingUser) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
    }
  } catch (error) {
    // Ignore errors from user not existing
    console.warn('User cleanup skipped:', error)
  }

  // Create new user with email already confirmed
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  return data.user
}

/**
 * Delete a test user after test completion
 */
export async function deleteTestUser(email: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users?.find((u) => u.email === email)
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    }
  } catch (error) {
    console.warn('User deletion failed:', error)
  }
}
