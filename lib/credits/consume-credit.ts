import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.generated'
import { CreditError, InsufficientCreditsError } from './errors'
import { z } from 'zod'

// UUID validation schema
const uuidSchema = z.string().uuid()

// Response schema for type safety
const creditResponseSchema = z.object({
  success: z.boolean(),
  remaining_credits: z.number(),
  transaction_id: z.string().optional(),
  idempotency_key_used: z.boolean().optional(),
})

export type CreditConsumptionResult = {
  success: boolean
  remainingCredits: number
}

/**
 * Consumes one adventure credit for the user or guest
 *
 * @param userId - The authenticated user's ID (UUID)
 * @param supabase - Supabase client instance
 * @param guestToken - Optional guest token for unauthenticated users
 * @param idempotencyKey - Optional key to prevent double consumption
 * @returns The result with remaining credits
 * @throws {InsufficientCreditsError} When user has no credits
 * @throws {CreditError} For other credit-related errors
 * @throws {Error} For validation or unexpected errors
 */
export async function consumeAdventureCredit(
  userId: string | null,
  supabase: SupabaseClient<Database>,
  guestToken?: string,
): Promise<CreditConsumptionResult> {
  // Validate inputs
  if (!userId && !guestToken) {
    throw new Error('Either userId or guestToken must be provided')
  }

  // Validate userId format if provided
  if (userId) {
    const parseResult = uuidSchema.safeParse(userId)
    if (!parseResult.success) {
      throw new Error('Invalid user ID format')
    }
  }

  try {
    // For now, only handle authenticated users
    if (!userId) {
      throw new CreditError('Guest credit consumption not implemented yet')
    }

    // Call the appropriate RPC function
    // Note: The RPC function expects p_user_id and p_adventure_id
    // For now, we'll pass a dummy adventure_id since we don't have one yet
    const { data, error } = await supabase.rpc('consume_adventure_credit', {
      p_user_id: userId,
      p_adventure_id: crypto.randomUUID(), // Temporary - should be passed in
    })

    // Handle errors
    if (error) {
      if (error.code === 'insufficient_credits') {
        throw new InsufficientCreditsError(error.message)
      }
      throw new CreditError(error.message, error.code)
    }

    // Validate response format
    if (!data) {
      throw new Error('Invalid response format from credit consumption')
    }

    // Parse and validate the response
    const parseResult = creditResponseSchema.safeParse(data)
    if (!parseResult.success) {
      throw new Error('Invalid response format from credit consumption')
    }

    const validatedData = parseResult.data

    return {
      success: validatedData.success,
      remainingCredits: validatedData.remaining_credits,
    }
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof InsufficientCreditsError || error instanceof CreditError) {
      throw error
    }

    // Re-throw other errors as-is
    if (error instanceof Error) {
      throw error
    }

    // Handle unknown errors
    throw new Error('An unexpected error occurred during credit consumption')
  }
}
