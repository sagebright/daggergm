export interface ScaffoldParams {
  frame: string
  customFrameDescription?: string
  focus: string
  partySize: number
  partyLevel: number
  difficulty: 'easier' | 'standard' | 'harder'
  stakes: 'low' | 'personal' | 'high' | 'world'
}

export interface ScaffoldResult {
  title: string
  description: string
  estimatedDuration: string
  movements: Array<{
    id: string
    title: string
    type: 'combat' | 'exploration' | 'social' | 'puzzle'
    description: string
    estimatedTime: string
    orderIndex: number
  }>
  metadata?: {
    suggestedLoot?: string[]
    keyNPCs?: string[]
    environmentalFeatures?: string[]
  }
}

export interface Movement {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  content: string
  estimatedTime?: string
}

export interface ExpansionParams {
  movement: Movement
  adventure: {
    frame: string
    focus: string
    partySize: number
    partyLevel: number
  }
  previousMovements?: Movement[]
  nextMovements?: Movement[]
}

// =============================================
// NEW: Scene Expansion Types (Six-Component Structure)
// =============================================

// NPC with Daggerheart character data
export interface NPC {
  id: string
  name: string

  // Character references
  classId: string
  className: string
  communityId: string
  communityName: string
  ancestryId: string
  ancestryName: string

  // Stats
  level: number
  hp: number
  stress: number
  evasion: number

  // Optional equipment
  abilities?: Array<{
    abilityId: string
    abilityName: string
  }>
  armor?: {
    armorId: string
    armorName: string
    tier: number
  }
  weapon?: {
    weaponId: string
    weaponName: string
    tier: number
  }

  // Personality
  personality: string
  role: 'ally' | 'neutral' | 'antagonist' | 'quest_giver'
  description: string
}

// Adversary from database
export interface SceneAdversary {
  id: string
  adversaryId: string
  adversaryName: string
  quantity: number
  customizations?: {
    nameOverride?: string
    hpModifier?: number
    stressModifier?: number
    customTactics?: string
    customDescription?: string
  }
}

// Environment from database
export interface SceneEnvironment {
  environmentId: string
  environmentName: string
  customDescription?: string
}

// Loot from database
export interface SceneLoot {
  items: Array<{
    itemId: string
    itemName: string
    itemType: 'item' | 'weapon' | 'armor' | 'consumable'
    tier?: number
    quantity: number
  }>
}

// Full expansion result for a Scene (replaces MovementResult)
export interface SceneExpansion {
  // REQUIRED
  descriptions: string[]

  // OPTIONAL components
  narration?: string | null
  npcs?: NPC[]
  adversaries?: SceneAdversary[]
  environment?: SceneEnvironment
  loot?: SceneLoot

  // Legacy fields (for backward compatibility)
  gmNotes?: string
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}

// Scene type (replaces Movement concept entirely)
export interface Scene {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  description: string // Scaffold summary
  estimatedTime?: string
  orderIndex?: number
  locked?: boolean

  // Expansion data (populated after expansion)
  expansion?: SceneExpansion
}

// LEGACY: MovementResult (kept for backward compatibility during migration)
export interface MovementResult {
  content: string
  mechanics?: {
    dcChecks?: Array<{
      skill: string
      dc: number
      consequences: string
    }>
    combatEncounter?: {
      enemies: Array<{
        name: string
        quantity: number
        tactics: string
      }>
      environment: string
      objectives: string[]
    }
  }
  gmNotes?: string
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}

export interface RefinementParams {
  content: string
  instruction: string
  context: {
    movement?: {
      type: string
      title: string
    }
    adventure?: {
      frame: string
      tone?: string
    }
  }
}

export interface RefinementResult {
  refinedContent: string
  changes: string[]
}

export interface RegenerateMovementParams {
  movement: Movement
  adventure: {
    frame: string
    focus: string
    partySize: number
    partyLevel: number
    difficulty: string
    stakes: string
  }
  lockedMovements?: Array<{
    id: string
    title: string
    type: string
    description: string
  }>
}

export interface MovementScaffoldResult {
  title: string
  description: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  estimatedTime: string
}

export interface TemperatureStrategy {
  scaffoldGeneration: number
  combatEncounters: number
  npcDialogue: number
  descriptions: number
  mechanicalElements: number
}

export interface LLMProvider {
  generateAdventureScaffold(_params: ScaffoldParams): Promise<ScaffoldResult>
  expandMovement(_params: ExpansionParams): Promise<MovementResult> // LEGACY
  expandScene(_params: ExpansionParams): Promise<SceneExpansion> // NEW
  refineContent(_params: RefinementParams): Promise<RefinementResult>
  regenerateMovement(_params: RegenerateMovementParams): Promise<MovementScaffoldResult>
}
