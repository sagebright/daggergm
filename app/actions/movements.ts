/* eslint-disable max-lines */
'use server'

import { revalidatePath } from 'next/cache'

import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import { REGENERATION_LIMITS, REGENERATION_LIMIT_ERRORS } from '@/lib/constants/regeneration'
import { OpenAIProvider } from '@/lib/llm/openai-provider'
import type { Movement } from '@/lib/llm/types'
import { withRateLimit, getRateLimitContext } from '@/lib/rate-limiting/middleware'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { movementUpdateSchema } from '@/lib/validation/movement'
import {
  movementExpansionRequestSchema,
  movementRefinementRequestSchema,
} from '@/lib/validation/schemas'
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
      error: validationResult.error.issues[0]?.message || 'Validation failed',
    }
  }

  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    const userId = user.id

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

    // Get adventure with movements
    const { data: adventure } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (!adventure) {
      return { success: false, error: 'Adventure not found' }
    }

    // Check expansion regeneration limit (20 max)
    // Expansion/refinement is FREE but LIMITED
    const expansionRegensUsed = adventure.expansion_regenerations_used ?? 0
    if (expansionRegensUsed >= REGENERATION_LIMITS.EXPANSION) {
      return {
        success: false,
        error: REGENERATION_LIMIT_ERRORS.EXPANSION,
      }
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

    // Update movement with expanded content
    const { error } = await supabase
      .from('adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) {
      throw error
    }

    // Increment expansion regeneration counter after successful expansion
    await supabase
      .from('adventures')
      .update({
        expansion_regenerations_used: expansionRegensUsed + 1,
      })
      .eq('id', adventureId)

    revalidatePath(`/adventures/${adventureId}`)

    return {
      success: true,
      content: expansion.content,
      mechanics: expansion.mechanics,
      gmNotes: expansion.gmNotes,
    }
  } catch (error) {
    // No refund needed since expansion is free
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
      error: validationResult.error.issues[0]?.message || 'Validation failed',
    }
  }

  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    const userId = user.id

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

    // Get adventure
    const { data: adventure } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (!adventure || adventure.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check expansion regeneration limit (20 max)
    // Refinement counts toward expansion limit
    const expansionRegensUsed = adventure.expansion_regenerations_used ?? 0
    if (expansionRegensUsed >= REGENERATION_LIMITS.EXPANSION) {
      return {
        success: false,
        error: REGENERATION_LIMIT_ERRORS.REFINEMENT,
      }
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

    // Increment expansion regeneration counter after successful refinement
    await supabase
      .from('adventures')
      .update({
        expansion_regenerations_used: expansionRegensUsed + 1,
      })
      .eq('id', adventureId)

    return {
      success: true,
      content: refinement.refinedContent,
      changes: refinement.changes,
    }
  } catch (error) {
    // No refund needed since refinement is free
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refine content',
    }
  }
}

export async function regenerateScaffoldMovement(adventureId: string, movementId: string) {
  // Validate input parameters
  const validationResult = movementExpansionRequestSchema.safeParse({
    adventureId,
    movementId,
  })

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || 'Validation failed',
    }
  }

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
      await withRateLimit('movement_regeneration', rateLimitContext, async () => {
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

    // Get adventure
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

    // Check scaffold regeneration limit (10 max)
    const SCAFFOLD_LIMIT = REGENERATION_LIMITS.SCAFFOLD
    const scaffoldRegensUsed = adventure.scaffold_regenerations_used ?? 0
    if (scaffoldRegensUsed >= SCAFFOLD_LIMIT) {
      return {
        success: false,
        error: REGENERATION_LIMIT_ERRORS.SCAFFOLD,
      }
    }

    // Find the movement to regenerate
    const movements = adventure.movements as Movement[] | null
    const targetMovement = movements?.find((m) => m.id === movementId)
    if (!targetMovement) {
      return { success: false, error: 'Movement not found' }
    }

    // Get locked movements for context
    const lockedMovements =
      movements
        ?.filter((m) => 'locked' in m && m.locked && m.id !== movementId)
        .map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type,
          description: ('description' in m ? (m.description as string) : '') || '',
        })) || []

    // Regenerate using LLM
    const startTime = Date.now()
    const config = adventure.config as {
      party_size?: number
      party_level?: number
      difficulty?: string
      stakes?: string
    } | null

    const llmProvider = getLLMProvider()
    const regenerated = await llmProvider.regenerateMovement({
      movement: targetMovement,
      adventure: {
        frame: adventure.frame,
        focus: adventure.focus,
        partySize: config?.party_size || 4,
        partyLevel: config?.party_level || 2,
        difficulty: config?.difficulty || 'standard',
        stakes: config?.stakes || 'personal',
      },
      lockedMovements,
    })
    const duration = (Date.now() - startTime) / 1000

    // Track regeneration event
    await analytics.track(ANALYTICS_EVENTS.SCAFFOLD_MOVEMENT_REGENERATED, {
      userId,
      adventureId,
      movementId,
      movementType: targetMovement.type,
      duration,
      regenerationCount: scaffoldRegensUsed + 1,
      lockedCount: lockedMovements.length,
    })

    // Update movement with regenerated content
    const updatedMovements = movements?.map((m) =>
      m.id === movementId
        ? {
            ...m,
            title: regenerated.title,
            description: regenerated.description,
            type: regenerated.type,
            estimatedTime: regenerated.estimatedTime,
            // Preserve id and orderIndex
          }
        : m,
    )

    // Increment regeneration counter and save
    const { error } = await supabase
      .from('adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        scaffold_regenerations_used: scaffoldRegensUsed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) {
      throw error
    }

    revalidatePath(`/adventures/${adventureId}`)

    return {
      success: true,
      movement: regenerated,
      remainingRegenerations: SCAFFOLD_LIMIT - (scaffoldRegensUsed + 1),
    }
  } catch (error) {
    console.error('Error regenerating movement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate movement',
    }
  }
}

export async function updateMovement(
  adventureId: string,
  movementId: string,
  updates: Partial<Movement>,
  guestToken?: string,
) {
  // Update movement called

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

    // Starting database update

    const { error } = await serviceClient
      .from('adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    // Database update completed

    if (error) {
      throw error
    }

    // Comment out revalidatePath to test if it's causing the delay
    // revalidatePath(`/adventures/${adventureId}`)
    // Update movement completed

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update movement',
    }
  }
}
