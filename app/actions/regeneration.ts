/**
 * Server Actions: Regeneration Limits
 *
 * Provides server actions for querying regeneration counts
 * for display in the UI (Focus Mode counter).
 *
 * @module app/actions/regeneration
 */

'use server'

import { RegenerationLimitChecker } from '@/lib/regeneration/limit-checker'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Get regeneration counts for an adventure
 *
 * Returns current usage and remaining regenerations for both
 * scaffold and expansion stages.
 *
 * @param adventureId - The adventure ID
 * @returns Regeneration counts or error
 */
export async function getRegenerationCounts(adventureId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify user is authenticated and owns the adventure
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Verify ownership
    const { data: adventure, error: adventureError } = await supabase
      .from('adventures')
      .select('user_id')
      .eq('id', adventureId)
      .single()

    if (adventureError || !adventure) {
      throw new Error('Adventure not found')
    }

    if (adventure.user_id !== user.id) {
      throw new Error('Unauthorized')
    }

    // Get regeneration counts
    const checker = new RegenerationLimitChecker()
    return await checker.getRegenerationCounts(adventureId)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get regeneration counts')
  }
}
