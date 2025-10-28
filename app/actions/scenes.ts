'use server'

/**
 * Server Actions: Scene Expansion
 *
 * Handles scene expansion with six-component structure:
 * - Descriptions (required)
 * - Narration (optional)
 * - NPCs (optional)
 * - Adversaries (optional)
 * - Environment (optional)
 * - Loot (optional)
 */

import { revalidatePath } from 'next/cache'

import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import { OpenAIProvider } from '@/lib/llm/openai-provider'
import type { Scene, SceneExpansion } from '@/lib/llm/types'
import { withRateLimit, getRateLimitContext } from '@/lib/rate-limiting/middleware'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database.generated'

/**
 * Expand a scene with Daggerheart content integration
 */
export async function expandScene(adventureId: string, sceneId: string) {
  return withRateLimit('scene_expansion', await getRateLimitContext(), async () => {
    const supabase = await createServerSupabaseClient()

    // Get adventure with scene
    const { data: adventure, error: fetchError } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (fetchError || !adventure) {
      return {
        success: false,
        error: `Adventure not found: ${fetchError?.message}`,
      }
    }

    // Find the scene in movements array
    const scenes = adventure.movements as unknown as Scene[]
    const scene = scenes?.find((s) => s.id === sceneId)

    if (!scene) {
      return {
        success: false,
        error: 'Scene not found in adventure',
      }
    }

    // Get adventure config
    const config = adventure.config as { partySize?: number; partyLevel?: number } | null
    const partySize = config?.partySize || 4
    const partyLevel = config?.partyLevel || 1

    // Expand scene using LLM provider
    const llmProvider = new OpenAIProvider()
    const expansion = await llmProvider.expandScene({
      movement: {
        id: scene.id,
        title: scene.title,
        type: scene.type,
        content: scene.description,
      },
      adventure: {
        frame: adventure.frame,
        focus: adventure.focus,
        partySize,
        partyLevel,
      },
    })

    // Resolve database IDs for all referenced content
    const resolvedExpansion = await resolveDaggerheartReferences(expansion, supabase)

    // Update scene with expansion in movements array
    const updatedScenes = scenes?.map((s) =>
      s.id === sceneId
        ? {
            ...s,
            expansion: resolvedExpansion,
          }
        : s,
    )

    const { error: updateError } = await supabase
      .from('adventures')
      .update({
        movements: updatedScenes as unknown as Json[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (updateError) {
      return {
        success: false,
        error: `Failed to update adventure: ${updateError.message}`,
      }
    }

    // Track analytics
    await analytics.track(ANALYTICS_EVENTS.SCENE_EXPANDED, {
      adventureId,
      sceneId,
      sceneType: scene.type,
      frame: adventure.frame,
      hasNPCs: !!resolvedExpansion.npcs?.length,
      hasAdversaries: !!resolvedExpansion.adversaries?.length,
      hasEnvironment: !!resolvedExpansion.environment,
      hasLoot: !!resolvedExpansion.loot?.items?.length,
    })

    // Revalidate adventure page
    revalidatePath(`/adventures/${adventureId}`)

    return {
      success: true,
      expansion: resolvedExpansion,
    }
  })
}

/**
 * Resolve Daggerheart content references (names → IDs)
 *
 * Takes LLM-generated expansion with content names and resolves them
 * to actual database IDs by querying the Daggerheart content tables.
 */
async function resolveDaggerheartReferences(
  expansion: SceneExpansion,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<SceneExpansion> {
  // Resolve NPC references
  if (expansion.npcs) {
    for (const npc of expansion.npcs) {
      // Resolve class
      const { data: classData } = await supabase
        .from('daggerheart_classes')
        .select('id')
        .eq('name', npc.className)
        .single()

      if (classData) {
        npc.classId = classData.id
      }

      // Resolve ancestry
      const { data: ancestryData } = await supabase
        .from('daggerheart_ancestries')
        .select('id')
        .eq('name', npc.ancestryName)
        .single()

      if (ancestryData) {
        npc.ancestryId = ancestryData.id
      }

      // Resolve community
      const { data: communityData } = await supabase
        .from('daggerheart_communities')
        .select('id')
        .eq('name', npc.communityName)
        .single()

      if (communityData) {
        npc.communityId = communityData.id
      }

      // Resolve weapon if present
      if (npc.weapon) {
        const { data: weaponData } = await supabase
          .from('daggerheart_weapons')
          .select('id, tier')
          .eq('name', npc.weapon.weaponName)
          .single()

        if (weaponData) {
          npc.weapon.weaponId = weaponData.id
          npc.weapon.tier = weaponData.tier
        }
      }

      // Resolve armor if present
      if (npc.armor) {
        const { data: armorData } = await supabase
          .from('daggerheart_armor')
          .select('id, tier')
          .eq('name', npc.armor.armorName)
          .single()

        if (armorData) {
          npc.armor.armorId = armorData.id
          npc.armor.tier = armorData.tier
        }
      }
    }
  }

  // Resolve adversary references
  if (expansion.adversaries) {
    for (const adv of expansion.adversaries) {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('id')
        .eq('name', adv.adversaryName)
        .single()

      if (data) {
        adv.adversaryId = data.id
      }
    }
  }

  // Resolve environment reference
  if (expansion.environment) {
    const { data } = await supabase
      .from('daggerheart_environments')
      .select('id')
      .eq('name', expansion.environment.environmentName)
      .single()

    if (data) {
      expansion.environment.environmentId = data.id
    }
  }

  // Resolve loot references
  if (expansion.loot) {
    for (const item of expansion.loot.items) {
      // Query based on item type
      if (item.itemType === 'weapon') {
        const { data, error } = await supabase
          .from('daggerheart_weapons')
          .select('id, tier')
          .eq('name', item.itemName)
          .single()

        if (!error && data) {
          item.itemId = data.id
          item.tier = data.tier
        }
      } else if (item.itemType === 'armor') {
        const { data, error } = await supabase
          .from('daggerheart_armor')
          .select('id, tier')
          .eq('name', item.itemName)
          .single()

        if (!error && data) {
          item.itemId = data.id
          item.tier = data.tier
        }
      } else if (item.itemType === 'consumable') {
        const { data, error } = await supabase
          .from('daggerheart_consumables')
          .select('id')
          .eq('name', item.itemName)
          .single()

        if (!error && data) {
          item.itemId = data.id
        }
      } else {
        // Default to items table
        const { data, error } = await supabase
          .from('daggerheart_items')
          .select('id')
          .eq('name', item.itemName)
          .single()

        if (!error && data) {
          item.itemId = data.id
        }
      }
    }
  }

  return expansion
}
