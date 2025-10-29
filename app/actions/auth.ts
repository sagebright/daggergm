'use server'

import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Session is now established server-side
  // Use Next.js redirect() to ensure cookies are properly set before redirect
  redirect('/dashboard')
}

export async function signUpWithPassword(email: string, password: string, siteUrl: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      // In test/dev environment, auto-confirm users
      // In production, Supabase will require email confirmation
      data: {
        email_confirmed: true,
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // If email confirmation is enabled in Supabase, show confirmation message
  // If auto-confirm is enabled, user can log in immediately
  const message = data.user?.email_confirmed_at
    ? 'Account created! You can now log in.'
    : 'Check your email to confirm your account!'

  return { success: true, message }
}

export async function signInWithOtp(email: string, siteUrl: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Check your email for the login link!' }
}
