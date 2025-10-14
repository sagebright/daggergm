'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { OpenAIProvider } from '@/lib/llm/openai-provider'
import { movementUpdateSchema } from '@/lib/validation/movement'
import {
  movementExpansionRequestSchema,
  movementRefinementRequestSchema,
} from '@/lib/validation/schemas'
import { withRateLimit, getRateLimitContext } from '@/lib/rate-limiting/middleware'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import { CreditManager } from '@/lib/credits/credit-manager'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import type { Movement } from '@/lib/llm/types'
import type { Json } from '@/types/database.generated'

let llmProvider: OpenAIProvider | null = null

function getLLMProvider() {
  if (!llmProvider) {
    llmProvider = new OpenAIProvider()
  }
  return llmProvider
}

export async function expandMovement(adventureId: string, movementId: string) {
  // Validate input parameters
  const validationResult = movementExpansionRequestSchema.safeParse({
    adventureId,
    movementId,
  })

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0].message,
    }
  }
  const creditManager = new CreditManager()
  let userId: string | null = null

  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    userId = user.id

    // Apply rate limiting
    try {
      const rateLimitContext = await getRateLimitContext(userId)
      await withRateLimit('movement_expansion', rateLimitContext, async () => {
        // Rate limiting wrapper - the actual work will be done below
      })
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          success: false,
          error: error.message,
          retryAfter: error.retryAfter,
        }
      }
      throw error
    }

    // Consume credit for expansion
    try {
      await creditManager.consumeCredit(userId, 'expansion', {
        adventureId,
        movementId,
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { success: false, error: 'Insufficient credits to expand movement' }
      }
      throw error
    }

    // Get adventure with movements
    const { data: adventure } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (!adventure) {
      return { success: false, error: 'Adventure not found' }
    }

    // Check ownership
    if (adventure.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Find the movement
    const movements = adventure.movements as Movement[] | null
    const movement = movements?.find((m) => m.id === movementId)
    if (!movement) {
      return { success: false, error: 'Movement not found' }
    }

    // Expand using LLM
    const startTime = Date.now()
    const config = adventure.config as { party_size?: number; party_level?: number } | null
    const expansion = await getLLMProvider().expandMovement({
      movement,
      adventure: {
        frame: adventure.frame,
        focus: adventure.focus,
        partySize: config?.party_size || 4,
        partyLevel: config?.party_level || 2,
      },
      // Could add previous/next movements for context
    })
    const duration = (Date.now() - startTime) / 1000

    // Track movement expansion completion
    await analytics.track(ANALYTICS_EVENTS.MOVEMENT_EXPANDED, {
      userId,
      adventureId,
      movementId,
      movementType: movement.type,
      duration,
      frame: adventure.frame,
    })

    // Update movement with expanded content
    const updatedMovements = movements?.map((m) =>
      m.id === movementId
        ? {
            ...m,
            content: expansion.content,
            mechanics: expansion.mechanics,
            gmNotes: expansion.gmNotes,
          }
        : m,
    )

    const { error } = await supabase
      .from('adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) throw error

    revalidatePath(`/adventures/${adventureId}`)

    return {
      success: true,
      content: expansion.content,
      mechanics: expansion.mechanics,
      gmNotes: expansion.gmNotes,
    }
  } catch (error) {
    // Refund credit if expansion failed after consumption
    if (userId) {
      try {
        await creditManager.refundCredit(userId, 'expansion', {
          adventureId,
          movementId,
          reason: 'Expansion failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } catch (refundError) {
        console.error('Failed to refund credit:', refundError)
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to expand movement',
    }
  }
}

export async function refineMovementContent(
  adventureId: string,
  movementId: string,
  instruction: string,
) {
  // Validate input parameters
  const validationResult = movementRefinementRequestSchema.safeParse({
    adventureId,
    movementId,
    instruction,
  })

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0].message,
    }
  }
  const creditManager = new CreditManager()
  let userId: string | null = null

  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    userId = user.id

    // Apply rate limiting
    try {
      const rateLimitContext = await getRateLimitContext(userId)
      await withRateLimit('content_refinement', rateLimitContext, async () => {
        // Rate limiting wrapper - the actual work will be done below
      })
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          success: false,
          error: error.message,
          retryAfter: error.retryAfter,
        }
      }
      throw error
    }

    // Consume credit for refinement
    try {
      await creditManager.consumeCredit(userId, 'expansion', {
        adventureId,
        movementId,
        refinementType: 'refine',
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { success: false, error: 'Insufficient credits to refine content' }
      }
      throw error
    }

    // Get adventure
    const { data: adventure } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (!adventure || adventure.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Find movement
    const movements = adventure.movements as Movement[] | null
    const movement = movements?.find((m) => m.id === movementId)
    if (!movement) {
      return { success: false, error: 'Movement not found' }
    }

    // Refine using LLM
    const startTime = Date.now()
    const refinement = await getLLMProvider().refineContent({
      content: movement.content,
      instruction,
      context: {
        movement: {
          type: movement.type,
          title: movement.title,
        },
        adventure: {
          frame: adventure.frame,
        },
      },
    })
    const duration = (Date.now() - startTime) / 1000

    // Track AI refinement usage
    await analytics.track(ANALYTICS_EVENTS.AI_REFINEMENT_USED, {
      userId,
      adventureId,
      movementId,
      movementType: movement.type,
      duration,
      instructionLength: instruction.length,
      frame: adventure.frame,
    })

    return {
      success: true,
      content: refinement.refinedContent,
      changes: refinement.changes,
    }
  } catch (error) {
    // Refund credit if refinement failed after consumption
    if (userId) {
      try {
        await creditManager.refundCredit(userId, 'expansion', {
          adventureId,
          movementId,
          refinementType: 'refine',
          reason: 'Refinement failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } catch (refundError) {
        console.error('Failed to refund credit:', refundError)
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refine content',
    }
  }
}

export async function updateMovement(
  adventureId: string,
  movementId: string,
  updates: Partial<Movement>,
  guestToken?: string,
) {
  const startTime = Date.now()
  console.log('updateMovement called:', {
    adventureId,
    movementId,
    hasUpdates: !!updates,
    hasGuestToken: !!guestToken,
  })

  try {
    // Validate updates
    const validated = movementUpdateSchema.safeParse(updates)
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message
      return {
        success: false,
        error: firstError ? `Validation error: ${firstError}` : 'Validation error: Invalid input',
      }
    }

    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get adventure - use service role for guest access
    let adventure
    if (!user && guestToken) {
      // Guest user with token
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const serviceClient = await createServiceRoleClient()
      const { data } = await serviceClient
        .from('adventures')
        .select('*')
        .eq('id', adventureId)
        .eq('guest_token', guestToken)
        .single()

      adventure = data
    } else if (user) {
      // Authenticated user
      const { data } = await supabase
        .from('adventures')
        .select('*')
        .eq('id', adventureId)
        .eq('user_id', user.id)
        .single()

      adventure = data
    } else {
      return { success: false, error: 'Unauthorized' }
    }

    if (!adventure) {
      return { success: false, error: 'Adventure not found or unauthorized' }
    }

    // Update movement
    const movements = adventure.movements as Movement[] | null
    const updatedMovements = movements?.map((m) =>
      m.id === movementId ? { ...m, ...validated.data } : m,
    )

    // Use service role client for updates to bypass RLS
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = await createServiceRoleClient()

    console.log('Starting database update...')
    const updateStart = Date.now()

    const { error } = await serviceClient
      .from('adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    console.log(`Database update took ${Date.now() - updateStart}ms`)

    if (error) throw error

    // Comment out revalidatePath to test if it's causing the delay
    // revalidatePath(`/adventures/${adventureId}`)
    console.log(`Total updateMovement took ${Date.now() - startTime}ms`)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update movement',
    }
  }
}
