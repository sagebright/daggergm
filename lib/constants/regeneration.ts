/**
 * Regeneration Limits Constants
 *
 * Defines the maximum number of free regenerations allowed per adventure
 * at different stages of the content generation process.
 *
 * These limits ensure:
 * 1. Users can iteratively improve content without consuming credits
 * 2. System resources are protected from abuse
 * 3. Clear expectations are set for users
 *
 * Reference: docs/SYSTEM_OVERVIEW.md:141-146
 */

export const REGENERATION_LIMITS = {
  /**
   * Maximum regenerations during Scaffold stage
   * Applies to: Initial adventure structure generation
   */
  SCAFFOLD: 10,

  /**
   * Maximum regenerations during Expansion stage
   * Applies to: Movement expansion and content refinement
   */
  EXPANSION: 20,
} as const

/**
 * Error messages for regeneration limit violations
 */
export const REGENERATION_LIMIT_ERRORS = {
  SCAFFOLD: `Scaffold regeneration limit reached (${REGENERATION_LIMITS.SCAFFOLD} maximum). Consider starting a new adventure or manually editing the structure.`,
  EXPANSION: `Expansion regeneration limit reached (${REGENERATION_LIMITS.EXPANSION} maximum). Consider locking components you're satisfied with.`,
  REFINEMENT: `Refinement limit reached (${REGENERATION_LIMITS.EXPANSION} maximum). Consider manual editing instead.`,
} as const
