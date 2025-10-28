'use server'

import crypto from 'crypto'

import { revalidatePath } from 'next/cache'

import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import { CreditManager } from '@/lib/credits/credit-manager'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { getLLMProvider } from '@/lib/llm/provider'
import { withRateLimit, getRateLimitContext } from '@/lib/rate-limiting/middleware'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { adventureConfigSchema } from '@/lib/validation/schemas'

export interface AdventureConfig {
  length?: string
  primary_motif?: string
  focus?: string
  frame?: string
  partySize?: number
  party_size?: number
  partyLevel?: number
  party_level?: number
  difficulty?: string
  stakes?: string
}

export async function generateAdventure(config: AdventureConfig) {
  // Validate and transform input
  const validationResult = adventureConfigSchema.safeParse({
    length: config.length,
    primary_motif: config.primary_motif || config.focus,
    focus: config.focus,
    frame: config.frame,
    party_size: config.party_size || config.partySize,
    party_level: config.party_level || config.partyLevel,
    difficulty: config.difficulty,
    stakes: config.stakes,
  })

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || 'Validation failed',
    }
  }

  const validatedConfig = validationResult.data
  const creditManager = new CreditManager()
  let userId: string | null = null
  let adventureId: string | null = null

  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id || null

    // Apply rate limiting
    try {
      const rateLimitContext = await getRateLimitContext(userId || undefined)
      await withRateLimit('adventure_generation', rateLimitContext, async () => {
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

    // Require authentication
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required. Please log in to generate adventures.',
      }
    }

    // Generate a temporary adventure ID for credit metadata
    adventureId = crypto.randomUUID()

    // Consume credit
    try {
      await creditManager.consumeCredit(userId, 'adventure', { adventureId })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return { success: false, error: 'Insufficient credits to generate adventure' }
      }
      throw error
    }

    // Track adventure start event
    await analytics.track(ANALYTICS_EVENTS.ADVENTURE_STARTED, {
      userId,
      sessionId: crypto.randomUUID(), // Generate session ID for tracking
      frame: validatedConfig.frame || 'witherwild',
      partySize: validatedConfig.party_size,
      partyLevel: validatedConfig.party_level,
      difficulty: validatedConfig.difficulty,
      stakes: validatedConfig.stakes,
    })

    // Generate adventure using LLM provider
    const llmProvider = getLLMProvider()
    const startTime = Date.now()
    const scaffoldData = await llmProvider.generateAdventureScaffold({
      frame: validatedConfig.frame || 'witherwild',
      focus: validatedConfig.focus || validatedConfig.primary_motif,
      partySize: validatedConfig.party_size,
      partyLevel: validatedConfig.party_level,
      difficulty: validatedConfig.difficulty,
      stakes: validatedConfig.stakes,
    })
    const duration = (Date.now() - startTime) / 1000

    // Track scaffold generation completion
    await analytics.track(ANALYTICS_EVENTS.SCAFFOLD_GENERATED, {
      userId,
      adventureId,
      duration,
      frame: validatedConfig.frame || 'witherwild',
      movementCount: scaffoldData.movements?.length || 0,
    })

    // Save to database with the pre-generated ID
    const adventureData = {
      id: adventureId,
      title: scaffoldData.title,
      frame: validatedConfig.frame || 'witherwild',
      focus: validatedConfig.focus || validatedConfig.primary_motif,
      state: 'draft',
      config: {
        length: validatedConfig.length,
        primary_motif: validatedConfig.primary_motif,
        party_size: validatedConfig.party_size,
        party_level: validatedConfig.party_level,
        difficulty: validatedConfig.difficulty,
        stakes: validatedConfig.stakes,
      },
      movements: scaffoldData.movements,
      user_id: userId,
    }

    // Use service role client for insert to bypass RLS
    const serviceClient = await createServiceRoleClient()
    const { data: adventure, error } = await serviceClient
      .from('adventures')
      .insert(adventureData)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Adventure saved to database
    revalidatePath('/dashboard')

    return { success: true, adventureId: adventure.id }
  } catch (error) {
    console.error('Error in generateAdventure:', error)
    // Refund credit if generation failed after consumption
    if (userId && adventureId) {
      try {
        await creditManager.refundCredit(userId, 'adventure', {
          adventureId,
          reason: 'Generation failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } catch (refundError) {
        console.error('Failed to refund credit:', refundError)
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getAdventure(id: string, guestToken?: string) {
  // Validate adventure ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('Invalid adventure ID format:', id)
    return null
  }

  const supabase = await createServerSupabaseClient()

  // First try to get as authenticated user
  const { data: authData, error: authError } = await supabase
    .from('adventures')
    .select('*')
    .eq('id', id)
    .single()

  if (!authError && authData) {
    return authData
  }

  // If not found or error, try with guest token using service role
  if (guestToken) {
    const serviceClient = await createServiceRoleClient()
    const { data: guestData, error: guestError } = await serviceClient
      .from('adventures')
      .select('*')
      .eq('id', id)
      .eq('guest_token', guestToken)
      .single()

    if (!guestError && guestData) {
      return guestData
    }
  }

  console.error('Error fetching adventure:', authError || 'Not found')
  return null
}

export async function getUserAdventures() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('adventures')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching adventures:', error)
    return []
  }

  return data || []
}

export async function updateAdventureState(
  adventureId: string,
  newState: 'draft' | 'ready' | 'archived',
  guestToken?: string,
) {
  // Update adventure state

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get adventure - use service role for guest access
    let adventure
    if (!user && guestToken) {
      // Guest user with token
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

    // Update state using service role
    const serviceClient = await createServiceRoleClient()
    const { error } = await serviceClient
      .from('adventures')
      .update({
        state: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) {
      throw error
    }

    revalidatePath(`/adventures/${adventureId}`)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update adventure state',
    }
  }
}
