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
  expandMovement(_params: ExpansionParams): Promise<MovementResult>
  refineContent(_params: RefinementParams): Promise<RefinementResult>
  regenerateMovement(_params: RegenerateMovementParams): Promise<MovementScaffoldResult>
}
