/* eslint-disable max-lines */
// TODO: Refactor this file - it exceeds 300 lines (currently 435)
// Consider splitting into: base provider, scene expansion, movement expansion modules

import crypto from 'crypto'

import { OpenAI } from 'openai'

import { performanceMonitor } from '@/lib/performance/performance-monitor'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database.generated'

import { FRAME_PROMPTS } from './prompts/frame-prompts'
import type {
  LLMProvider,
  ScaffoldParams,
  ScaffoldResult,
  ExpansionParams,
  MovementResult,
  SceneExpansion,
  NPC,
  SceneAdversary,
  RefinementParams,
  RefinementResult,
  RegenerateMovementParams,
  MovementScaffoldResult,
  TemperatureStrategy,
} from './types'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI | null = null
  private temperatures: TemperatureStrategy

  constructor() {
    this.temperatures = {
      scaffoldGeneration: 0.75,
      combatEncounters: 0.5,
      npcDialogue: 0.9,
      descriptions: 0.8,
      mechanicalElements: 0.3,
    }
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      })
    }
    return this.client
  }

  async generateAdventureScaffold(params: ScaffoldParams): Promise<ScaffoldResult> {
    return performanceMonitor.trackOperation(
      'adventure_generation',
      () => this._generateAdventureScaffold(params),
      {
        frame: params.frame,
        partySize: params.partySize,
        partyLevel: params.partyLevel,
        difficulty: params.difficulty,
        stakes: params.stakes,
      },
    )
  }

  private async _generateAdventureScaffold(params: ScaffoldParams): Promise<ScaffoldResult> {
    // Check cache first
    const cached = await this.checkCache(params)
    if (cached) {
      return cached as ScaffoldResult
    }

    const systemPrompt = await this.loadFramePrompt(params.frame, 'scaffold')

    const completion = await this.getClient().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: this.temperatures.scaffoldGeneration,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildScaffoldPrompt(params) },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0]!.message.content!) as ScaffoldResult

    // Cache the response
    await this.cacheResponse(params, result, completion.usage?.total_tokens)

    return result
  }

  async expandMovement(params: ExpansionParams): Promise<MovementResult> {
    return performanceMonitor.trackOperation(
      'movement_expansion',
      () => this._expandMovement(params),
      {
        frame: params.adventure.frame,
        movementType: params.movement.type,
        partySize: params.adventure.partySize,
      },
    )
  }

  private async _expandMovement(params: ExpansionParams): Promise<MovementResult> {
    // Check cache first
    const cached = await this.checkCache(params)
    if (cached) {
      return cached as MovementResult
    }

    const temperature = this.getTemperatureForMovementType(params.movement.type)
    const systemPrompt = await this.loadFramePrompt(
      params.adventure.frame,
      `movement_${params.movement.type}`,
    )

    const completion = await this.getClient().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildExpansionPrompt(params) },
      ],
    })

    const content = completion.choices[0]!.message.content!

    // Parse structured response
    const result: MovementResult = {
      content,
      // Additional parsing for mechanics, GM notes, etc.
    }

    await this.cacheResponse(params, result, completion.usage?.total_tokens)

    return result
  }

  async expandScene(params: ExpansionParams): Promise<SceneExpansion> {
    return performanceMonitor.trackOperation('scene_expansion', () => this._expandScene(params), {
      frame: params.adventure.frame,
      sceneType: params.movement.type,
      partyLevel: params.adventure.partyLevel,
    })
  }

  private async _expandScene(params: ExpansionParams): Promise<SceneExpansion> {
    // Check cache first
    const cached = await this.checkCache(params)
    if (cached) {
      return cached as SceneExpansion
    }

    // Step 1: Use vector search to find relevant Daggerheart content
    const relevantContent = await this.searchDaggerheartContent(params)

    // Step 2: Build enriched prompt with relevant content
    const systemPrompt = await this.loadFramePrompt(
      params.adventure.frame,
      `scene_${params.movement.type}`,
    )

    const userPrompt = this.buildSceneExpansionPrompt({
      ...params,
      relevantContent,
    })

    const temperature = this.getTemperatureForMovementType(params.movement.type)

    const completion = await this.getClient().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })

    const response = JSON.parse(completion.choices[0]!.message.content!)

    // Step 3: Transform response to structured format with UUIDs
    const result: SceneExpansion = {
      descriptions: response.descriptions || [],
      narration: response.narration || null,
      npcs: (response.npcs || []).map((npc: Omit<NPC, 'id'>) => ({
        id: crypto.randomUUID(),
        ...npc,
      })),
      adversaries: (response.adversaries || []).map((adv: Omit<SceneAdversary, 'id'>) => ({
        id: crypto.randomUUID(),
        ...adv,
      })),
      environment: response.environment || undefined,
      loot: response.loot || undefined,
      gmNotes: response.gmNotes,
      transitions: response.transitions,
    }

    await this.cacheResponse(params, result, completion.usage?.total_tokens)

    return result
  }

  private async searchDaggerheartContent(params: ExpansionParams) {
    const supabase = await createServerSupabaseClient()

    // Build search query from scene context
    const searchQuery = `${params.movement.title} ${params.movement.content} ${params.adventure.focus}`

    // Search for relevant adversaries (tier-appropriate)
    const { data: adversaries } = await supabase.rpc('search_adversaries', {
      search_query: searchQuery,
      party_level: params.adventure.partyLevel,
      limit_count: 5,
    })

    // Search for relevant environments
    const { data: environments } = await supabase.rpc('search_environments', {
      search_query: searchQuery,
      limit_count: 3,
    })

    // Get tier-appropriate loot
    const { data: loot } = await supabase.rpc('get_tier_appropriate_loot', {
      party_level: params.adventure.partyLevel,
      item_type: 'all',
      limit_count: 10,
    })

    // Get all classes/ancestries/communities for NPC generation
    const { data: classes } = await supabase.from('daggerheart_classes').select('*')
    const { data: ancestries } = await supabase.from('daggerheart_ancestries').select('*')
    const { data: communities } = await supabase.from('daggerheart_communities').select('*')

    return {
      adversaries: adversaries || [],
      environments: environments || [],
      loot: loot || [],
      classes: classes || [],
      ancestries: ancestries || [],
      communities: communities || [],
    }
  }

  private buildSceneExpansionPrompt(
    params: ExpansionParams & {
      relevantContent: {
        adversaries: Array<{ name: string; tier: number; type: string; description?: string }>
        environments: Array<{ name: string; description?: string }>
        classes: Array<{ name: string }>
        ancestries: Array<{ name: string }>
        communities: Array<{ name: string }>
        loot: Array<{ name: string; tier: number }>
      }
    },
  ): string {
    const { relevantContent } = params
    return `Expand the following scene for a Daggerheart adventure.

**Scene to Expand:**
- Title: ${params.movement.title}
- Type: ${params.movement.type}
- Description: ${params.movement.content}

**Adventure Context:**
- Frame: ${params.adventure.frame}
- Focus: ${params.adventure.focus}
- Party: ${params.adventure.partySize} players, level ${params.adventure.partyLevel}

**Available Daggerheart Content (use these references):**

ADVERSARIES (choose 0-3 that fit the scene):
${relevantContent.adversaries.map((a) => `- ${a.name} (Tier ${a.tier}, ${a.type}): ${a.description?.substring(0, 100) || ''}`).join('\n')}

ENVIRONMENTS (choose 0-1 that fits the scene):
${relevantContent.environments.map((e) => `- ${e.name}: ${e.description?.substring(0, 100) || ''}`).join('\n')}

CLASSES (for NPCs):
${relevantContent.classes.map((c) => `- ${c.name}`).join(', ')}

ANCESTRIES (for NPCs):
${relevantContent.ancestries.map((a) => `- ${a.name}`).join(', ')}

COMMUNITIES (for NPCs):
${relevantContent.communities.map((c) => `- ${c.name}`).join(', ')}

LOOT OPTIONS (tier-appropriate for party level):
${relevantContent.loot.map((l) => `- ${l.name} (Tier ${l.tier})`).join(', ')}

**Generate the following components:**

1. **Scene Descriptions** (REQUIRED): Array of 3-5 text snippets describing what the GM should convey about the scene (sights, sounds, smells, atmosphere)

2. **Narration** (OPTIONAL): Single paragraph of read-aloud text for dramatic moments or dialogue. Use sparingly. Set to null if not needed.

3. **NPCs** (OPTIONAL): 0-3 named characters for interaction
   - Reference class/ancestry/community from lists above (use exact names)
   - Level should match party level ±1
   - Calculate HP/stress/evasion based on class starting values
   - Generate personality and role
   - Only create if the scene type warrants NPCs (social, quest_giver, etc.)

4. **Adversaries** (OPTIONAL): 0-3 combat threats from the adversaries list
   - Reference by name (must match adversary name exactly)
   - Specify quantity (1-5)
   - Can add customDescription for context
   - Only include for combat scenes or scenes with potential combat

5. **Environment** (OPTIONAL): 0-1 environment from the list
   - Reference by name (must match environment name exactly)
   - Can add customDescription to complement it

6. **Loot** (OPTIONAL): 0-5 items from loot options
   - Reference by name (must match item name exactly)
   - Specify quantity
   - Only include if contextually appropriate (chest, defeated enemy, reward)

Return JSON matching this structure:
{
  "descriptions": ["...", "...", "..."],
  "narration": "..." or null,
  "npcs": [{
    "name": "...",
    "className": "Bard",
    "communityName": "Wanderer",
    "ancestryName": "Human",
    "level": 3,
    "hp": 18,
    "stress": 15,
    "evasion": 13,
    "personality": "...",
    "role": "ally|neutral|antagonist|quest_giver",
    "description": "..."
  }],
  "adversaries": [{
    "adversaryName": "ACID BURROWER",
    "quantity": 2,
    "customizations": {
      "customDescription": "..."
    }
  }],
  "environment": {
    "environmentName": "THE WITHERWILD",
    "customDescription": "..."
  },
  "loot": {
    "items": [{
      "itemName": "Healing Potion",
      "itemType": "consumable",
      "quantity": 2
    }]
  },
  "gmNotes": "..." (optional tips),
  "transitions": { "fromPrevious": "...", "toNext": "..." }
}`
  }

  async refineContent(params: RefinementParams): Promise<RefinementResult> {
    return performanceMonitor.trackOperation(
      'content_refinement',
      () => this._refineContent(params),
      {
        contentLength: params.content.length,
        instructionLength: params.instruction.length,
        movementType: params.context?.movement?.type,
        frame: params.context?.adventure?.frame,
      },
    )
  }

  private async _refineContent(params: RefinementParams): Promise<RefinementResult> {
    const temperature =
      params.context.movement?.type === 'combat'
        ? this.temperatures.combatEncounters
        : this.temperatures.descriptions

    const completion = await this.getClient().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Daggerheart GM helping to refine adventure content.',
        },
        {
          role: 'user',
          content: `Original content: ${params.content}\n\nRefinement instruction: ${params.instruction}\n\nContext: ${JSON.stringify(params.context)}`,
        },
      ],
    })

    return {
      refinedContent: completion.choices[0]!.message.content!,
      changes: ['Applied refinement'], // Could parse actual changes
    }
  }

  async regenerateMovement(params: RegenerateMovementParams): Promise<MovementScaffoldResult> {
    return performanceMonitor.trackOperation(
      'movement_regeneration',
      () => this._regenerateMovement(params),
      {
        frame: params.adventure.frame,
        movementType: params.movement.type,
        lockedCount: params.lockedMovements?.length || 0,
      },
    )
  }

  private async _regenerateMovement(
    params: RegenerateMovementParams,
  ): Promise<MovementScaffoldResult> {
    const systemPrompt = await this.loadFramePrompt(params.adventure.frame, 'scaffold')
    const locked = params.lockedMovements?.length
      ? `\nLocked: ${params.lockedMovements.map((m) => `${m.title} (${m.type})`).join(', ')}`
      : ''
    const userPrompt = `Regenerate: ${params.movement.title} (${params.movement.type})
Content: ${params.movement.content}
Frame: ${params.adventure.frame}, Focus: ${params.adventure.focus}
Party: ${params.adventure.partySize} lvl ${params.adventure.partyLevel}, ${params.adventure.difficulty}, ${params.adventure.stakes}${locked}
NEW version: maintain type, fit locked, vary from original, appropriate difficulty.
JSON: {"title":"","description":"","type":"combat|exploration|social|puzzle","estimatedTime":""}`

    const completion = await this.getClient().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: this.temperatures.scaffoldGeneration,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })
    return JSON.parse(completion.choices[0]!.message.content!) as MovementScaffoldResult
  }

  private getTemperatureForMovementType(type: string): number {
    switch (type) {
      case 'combat':
        return this.temperatures.combatEncounters
      case 'social':
        return this.temperatures.npcDialogue
      case 'exploration':
      case 'puzzle':
        return this.temperatures.descriptions
      default:
        return this.temperatures.scaffoldGeneration
    }
  }

  private async checkCache(params: unknown): Promise<unknown | null> {
    const promptHash = await this.hashPrompt(params)
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('daggerheart_llm_cache')
      .select('*')
      .eq('prompt_hash', promptHash)
      .single()
    if (data) {
      await supabase
        .from('daggerheart_llm_cache')
        .update({
          accessed_at: new Date().toISOString(),
          access_count: (data.access_count || 0) + 1,
        })
        .eq('id', data.id)
      return JSON.parse(data.response as string)
    }
    return null
  }

  private async cacheResponse(
    params: unknown,
    response: unknown,
    tokenCount?: number,
  ): Promise<void> {
    const promptHash = await this.hashPrompt(params)
    const supabase = await createServerSupabaseClient()
    await supabase.from('daggerheart_llm_cache').insert({
      prompt_hash: promptHash,
      prompt_params: params as Json,
      response: JSON.stringify(response),
      response_metadata: { timestamp: new Date().toISOString(), provider: 'openai' } as Json,
      model: 'gpt-4-turbo-preview',
      temperature: this.temperatures.scaffoldGeneration,
      token_count: tokenCount || 0,
    })
  }

  private async hashPrompt(params: unknown): Promise<string> {
    const sortedParams = JSON.stringify(
      params,
      Object.keys(params as Record<string, unknown>).sort(),
    )
    return crypto.createHash('sha256').update(sortedParams).digest('hex')
  }

  private async loadFramePrompt(frame: string, type: string): Promise<string> {
    const frameLower = frame.toLowerCase() as keyof typeof FRAME_PROMPTS
    const framePrompts = FRAME_PROMPTS[frameLower] || FRAME_PROMPTS.default
    const promptType = type as keyof typeof framePrompts
    return framePrompts[promptType] || framePrompts.scaffold
  }

  private buildScaffoldPrompt(params: ScaffoldParams): string {
    const customFrame = params.customFrameDescription
      ? `\nCustom Frame: ${params.customFrameDescription}`
      : ''
    const numScenes = params.numScenes || 3
    return `Create a Daggerheart adventure:
Frame: ${params.frame}${customFrame}
Focus: ${params.focus}
Party: ${params.partySize} level ${params.partyLevel}
Difficulty: ${params.difficulty}, Stakes: ${params.stakes}

Generate: title, description, exactly ${numScenes} movements, 3-4hr duration
JSON: {"title":"","description":"","estimatedDuration":"","movements":[{"id":"","title":"","type":"combat|exploration|social|puzzle","description":"","estimatedTime":"","orderIndex":0}]}`
  }

  private buildExpansionPrompt(params: ExpansionParams): string {
    const prev = params.previousMovements
      ? `\nPrev: ${params.previousMovements[params.previousMovements.length - 1]?.title}`
      : ''
    const next = params.nextMovements ? `\nNext: ${params.nextMovements[0]?.title}` : ''
    return `Expand: ${params.movement.title} (${params.movement.type})
Content: ${params.movement.content}
Frame: ${params.adventure.frame}, Focus: ${params.adventure.focus}
Party: ${params.adventure.partySize} lvl ${params.adventure.partyLevel}${prev}${next}
Include: vivid descriptions, objectives, mechanics, GM notes, transitions.`
  }
}
