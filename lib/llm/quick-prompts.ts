export interface QuickPromptConfig {
  scaffold: {
    general: string[]
    combat: string[]
    social: string[]
    exploration: string[]
    puzzle: string[]
  }
  expansion: {
    general: string[]
    combat: string[]
    social: string[]
    exploration: string[]
    puzzle: string[]
  }
}

export const QUICK_PROMPTS: QuickPromptConfig = {
  scaffold: {
    general: [
      'Make stakes feel higher',
      'Change tone to be more serious',
      'Add mystery/intrigue',
      'Make it more combat-focused',
      'Add moral dilemma',
    ],
    combat: [
      'Make enemy intelligent and strategic',
      'Add environmental combat challenges',
      'Make this boss-level encounter',
      'Include non-combat resolution',
      'Make enemies sympathetic',
    ],
    social: [
      'Add political intrigue',
      'Make NPC morally gray',
      'Add time pressure',
      'Include competing factions',
      'Make stakes personal',
    ],
    exploration: [
      'Change to dungeon crawl',
      'Add discovery/mystery',
      'Include environmental storytelling',
      'Make location more dangerous',
      'Add sense of wonder',
    ],
    puzzle: [
      'Add logical deduction element',
      'Include multiple solution paths',
      'Make time-sensitive',
      'Add physical challenge component',
      'Reward creativity',
    ],
  },
  expansion: {
    general: [
      'Add more sensory details',
      'Include specific mechanics',
      'Add NPC personality quirks',
      'Describe consequences',
      'Add optional objectives',
    ],
    combat: [
      'Include specific DC checks',
      'Add tactical terrain features',
      'Describe enemy tactics',
      'Add treasure/loot',
      'Include morale/surrender rules',
    ],
    social: [
      'Add dialogue examples',
      'Include NPC motivations',
      'Add persuasion mechanics',
      'Describe NPC reactions',
      'Add relationship consequences',
    ],
    exploration: [
      'Describe environmental hazards',
      'Add hidden discoveries',
      'Include skill check requirements',
      'Add atmospheric details',
      'Describe navigation challenges',
    ],
    puzzle: [
      'Add specific clues',
      'Include failure consequences',
      'Describe puzzle mechanics',
      'Add hints for stuck players',
      'Include alternative solutions',
    ],
  },
}

export function getQuickPrompts(
  phase: 'scaffold' | 'expansion',
  movementType: 'combat' | 'social' | 'exploration' | 'puzzle',
): string[] {
  const typeSpecific = QUICK_PROMPTS[phase][movementType]
  const general = QUICK_PROMPTS[phase].general

  // Return 3 type-specific + 2 general = 5 total prompts
  return [...typeSpecific.slice(0, 3), ...general.slice(0, 2)]
}
