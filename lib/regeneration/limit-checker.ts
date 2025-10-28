/**
 * Regeneration Limit Checker
 *
 * Manages regeneration limits for scaffold and expansion operations.
 * Business model:
 * - Scaffold regenerations: 10 max per adventure (free)
 * - Expansion regenerations: 20 max per adventure (free)
 *
 * @module lib/regeneration/limit-checker
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export const SCAFFOLD_REGENERATION_LIMIT = 10
export const EXPANSION_REGENERATION_LIMIT = 20

/**
 * Error thrown when a regeneration limit is exceeded
 */
export class RegenerationLimitError extends Error {
  constructor(
    public limitType: 'scaffold' | 'expansion',
    public used: number,
    public limit: number,
  ) {
    super(`${limitType} regeneration limit exceeded: ${used}/${limit} used`)
    this.name = 'RegenerationLimitError'
  }
}

/**
 * Manages checking and incrementing regeneration limits
 */
export class RegenerationLimitChecker {
  /**
   * Check if scaffold regeneration limit has been reached
   * @throws RegenerationLimitError if limit exceeded
   */
  async checkScaffoldLimit(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('adventures')
      .select('scaffold_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error || !data) {
      throw new Error('Failed to check scaffold regeneration limit')
    }

    const used = data.scaffold_regenerations_used ?? 0

    if (used >= SCAFFOLD_REGENERATION_LIMIT) {
      throw new RegenerationLimitError('scaffold', used, SCAFFOLD_REGENERATION_LIMIT)
    }
  }

  /**
   * Check if expansion regeneration limit has been reached
   * @throws RegenerationLimitError if limit exceeded
   */
  async checkExpansionLimit(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('adventures')
      .select('expansion_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error || !data) {
      throw new Error('Failed to check expansion regeneration limit')
    }

    const used = data.expansion_regenerations_used ?? 0

    if (used >= EXPANSION_REGENERATION_LIMIT) {
      throw new RegenerationLimitError('expansion', used, EXPANSION_REGENERATION_LIMIT)
    }
  }

  /**
   * Increment scaffold regeneration counter (atomic)
   */
  async incrementScaffoldCount(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { error } = await supabase.rpc('increment_scaffold_regenerations', {
      adventure_id: adventureId,
    })

    if (error) {
      throw new Error('Failed to increment scaffold regeneration count')
    }
  }

  /**
   * Increment expansion regeneration counter (atomic)
   */
  async incrementExpansionCount(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { error } = await supabase.rpc('increment_expansion_regenerations', {
      adventure_id: adventureId,
    })

    if (error) {
      throw new Error('Failed to increment expansion regeneration count')
    }
  }

  /**
   * Get current regeneration counts for an adventure
   */
  async getRegenerationCounts(adventureId: string): Promise<{
    scaffold: number
    expansion: number
    scaffoldRemaining: number
    expansionRemaining: number
  }> {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('adventures')
      .select('scaffold_regenerations_used, expansion_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error || !data) {
      throw new Error('Failed to get regeneration counts')
    }

    const scaffoldUsed = data.scaffold_regenerations_used ?? 0
    const expansionUsed = data.expansion_regenerations_used ?? 0

    return {
      scaffold: scaffoldUsed,
      expansion: expansionUsed,
      scaffoldRemaining: SCAFFOLD_REGENERATION_LIMIT - scaffoldUsed,
      expansionRemaining: EXPANSION_REGENERATION_LIMIT - expansionUsed,
    }
  }
}
