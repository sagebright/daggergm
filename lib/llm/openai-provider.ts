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
      .from('llm_cache')
      .select('*')
      .eq('prompt_hash', promptHash)
      .single()
    if (data) {
      await supabase
        .from('llm_cache')
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
    await supabase.from('llm_cache').insert({
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
    return `Create a Daggerheart adventure:
Frame: ${params.frame}${customFrame}
Focus: ${params.focus}
Party: ${params.partySize} level ${params.partyLevel}
Difficulty: ${params.difficulty}, Stakes: ${params.stakes}

Generate: title, description, 3-5 movements, 3-4hr duration
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
