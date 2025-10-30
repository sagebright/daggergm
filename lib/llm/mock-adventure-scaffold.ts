import type { ScaffoldParams, ScaffoldResult } from './types'

/**
 * Creates a mock adventure scaffold for E2E testing
 *
 * This mock provides realistic adventure data without making actual OpenAI API calls,
 * allowing E2E tests to run quickly and deterministically.
 *
 * The mock data is based on real LLM outputs and matches the expected structure.
 */
export function createMockAdventureScaffold(params: ScaffoldParams): ScaffoldResult {
  const { frame, focus, partySize, partyLevel, difficulty, stakes } = params

  // Generate deterministic title based on inputs
  const titlePrefix =
    stakes === 'world' ? 'The Fate of' : stakes === 'high' ? 'The Crisis at' : 'The Mystery of'
  const frameSuffix =
    frame === 'witherwild'
      ? 'the Verdant Ruins'
      : frame === 'order'
        ? 'the Golden Citadel'
        : 'the Ancient Keep'

  return {
    title: `${titlePrefix} ${frameSuffix}`,
    description: `A ${difficulty} adventure for ${partySize} tier ${partyLevel} adventurers. ${focus} awaits in the ${frame}.`,
    estimatedDuration: partySize <= 3 ? '2-3 hours' : '3-4 hours',
    movements: [
      {
        id: 'movement-1',
        title: 'The Gathering Storm',
        type: 'social',
        description: `The party arrives at a small settlement on the edge of ${frame === 'witherwild' ? 'the untamed wilderness' : 'civilized lands'}. Local residents are worried about strange occurrences related to ${focus.toLowerCase()}. They seek brave adventurers to investigate.`,
        estimatedTime: '30-45 minutes',
        orderIndex: 0,
      },
      {
        id: 'movement-2',
        title: 'Into the Unknown',
        type: 'exploration',
        description: `Following the clues, the party ventures into ${frame === 'witherwild' ? 'dense forests filled with ancient magic' : 'forgotten ruins holding ancient secrets'}. Environmental hazards and strange creatures test their resolve as they uncover the truth about ${focus.toLowerCase()}.`,
        estimatedTime: partyLevel >= 3 ? '45-60 minutes' : '30-45 minutes',
        orderIndex: 1,
      },
      {
        id: 'movement-3',
        title: 'The Heart of Danger',
        type: 'combat',
        description: `The party discovers the source of the disturbance: ${stakes === 'world' ? 'a powerful force that threatens the entire realm' : stakes === 'high' ? 'a dangerous adversary with dark intentions' : 'a misunderstood creature in need of help'}. They must make difficult choices that will determine the fate of all involved.`,
        estimatedTime: partyLevel >= 3 ? '60-90 minutes' : '45-60 minutes',
        orderIndex: 2,
      },
    ],
    metadata: {
      suggestedLoot:
        partyLevel >= 3
          ? ['Ancient artifact', 'Rare magical components', 'Gold and gemstones']
          : ['Useful equipment', 'Local currency', 'Information'],
      keyNPCs:
        frame === 'witherwild'
          ? ['Elder Sylara (settlement leader)', 'Corrupted forest spirit']
          : ['Captain of the Guard', 'Mysterious scholar'],
      environmentalFeatures:
        frame === 'witherwild'
          ? ['Dense undergrowth', 'Ancient standing stones', 'Magical ley lines']
          : ['Crumbling architecture', 'Hidden passages', 'Arcane wards'],
    },
  }
}
