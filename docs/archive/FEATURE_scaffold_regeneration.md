# Feature: Scaffold Regeneration with Limits

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Fix Business Model
**Estimated Time**: 1.5 hours
**Dependencies**: FEATURE_regeneration_tracking_database.md

---

## Overview

Implement scaffold-level regeneration functionality. Users should be able to regenerate individual movements during the Scaffold stage (before expansion), with a limit of 10 regenerations per adventure.

---

## Acceptance Criteria

- [ ] New `regenerateScaffoldMovement()` Server Action created
- [ ] Function checks scaffold regeneration limit (10 max)
- [ ] Function does NOT consume credits
- [ ] Counter increments after successful regeneration
- [ ] Regenerated movement maintains `id` and `orderIndex`
- [ ] Regeneration uses locked movements as context
- [ ] Clear error when limit reached
- [ ] Integration tests verify all functionality
- [ ] Analytics event tracked for regenerations

---

## Technical Specification

### Server Action

**File**: `app/actions/movements.ts`

Add new function:

```typescript
/**
 * Regenerates a single movement during Scaffold stage
 * Does not consume credits but enforces 10 regeneration limit
 */
export async function regenerateScaffoldMovement(adventureId: string, movementId: string) {
  // Validate input
  const validationResult = movementExpansionRequestSchema.safeParse({
    adventureId,
    movementId,
  })

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || 'Validation failed',
    }
  }

  let userId: string | null = null

  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    userId = user.id

    // Apply rate limiting
    try {
      const rateLimitContext = await getRateLimitContext(userId)
      await withRateLimit('movement_regeneration', rateLimitContext, async () => {
        // Rate limiting wrapper
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

    // Get adventure
    const { data: adventure } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (!adventure) {
      return { success: false, error: 'Adventure not found' }
    }

    // Check ownership
    if (adventure.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check scaffold regeneration limit (10 max)
    const SCAFFOLD_LIMIT = 10
    if (adventure.scaffold_regenerations_used >= SCAFFOLD_LIMIT) {
      return {
        success: false,
        error: `Scaffold regeneration limit reached (${SCAFFOLD_LIMIT} maximum). Try locking movements you're satisfied with and expanding the adventure.`,
      }
    }

    // Find the movement to regenerate
    const movements = adventure.movements as Movement[] | null
    const targetMovement = movements?.find((m) => m.id === movementId)
    if (!targetMovement) {
      return { success: false, error: 'Movement not found' }
    }

    // Get locked movements for context
    const lockedMovements = movements?.filter((m) => m.locked && m.id !== movementId) || []

    // Regenerate using LLM
    const startTime = Date.now()
    const config = adventure.config as {
      party_size?: number
      party_level?: number
      difficulty?: string
      stakes?: string
    } | null

    const llmProvider = getLLMProvider()
    const regenerated = await llmProvider.regenerateMovement({
      movement: targetMovement,
      adventure: {
        frame: adventure.frame,
        focus: adventure.focus,
        partySize: config?.party_size || 4,
        partyLevel: config?.party_level || 2,
        difficulty: config?.difficulty || 'standard',
        stakes: config?.stakes || 'personal',
      },
      lockedMovements, // Provide context
    })
    const duration = (Date.now() - startTime) / 1000

    // Track regeneration event
    await analytics.track(ANALYTICS_EVENTS.SCAFFOLD_MOVEMENT_REGENERATED, {
      userId,
      adventureId,
      movementId,
      movementType: targetMovement.type,
      duration,
      regenerationCount: adventure.scaffold_regenerations_used + 1,
      lockedCount: lockedMovements.length,
    })

    // Update movement with regenerated content
    const updatedMovements = movements?.map((m) =>
      m.id === movementId
        ? {
            ...m,
            title: regenerated.title,
            description: regenerated.description,
            type: regenerated.type,
            estimatedTime: regenerated.estimatedTime,
            // Preserve id and orderIndex
          }
        : m,
    )

    // Increment regeneration counter and save
    const { error } = await supabase
      .from('adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        scaffold_regenerations_used: adventure.scaffold_regenerations_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) {
      throw error
    }

    revalidatePath(`/adventures/${adventureId}`)

    return {
      success: true,
      movement: regenerated,
      remainingRegenerations: SCAFFOLD_LIMIT - (adventure.scaffold_regenerations_used + 1),
    }
  } catch (error) {
    console.error('Error regenerating movement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate movement',
    }
  }
}
```

### LLM Provider Update

**File**: `lib/llm/provider.ts`

Add to `LLMProvider` interface:

```typescript
export interface LLMProvider {
  generateAdventureScaffold(_params: ScaffoldParams): Promise<ScaffoldResult>
  regenerateMovement(_params: RegenerateMovementParams): Promise<MovementScaffoldResult>
  expandMovement(_params: ExpansionParams): Promise<MovementResult>
  refineContent(_params: RefinementParams): Promise<RefinementResult>
}
```

**File**: `lib/llm/types.ts`

Add new interfaces:

```typescript
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
```

**File**: `lib/llm/openai-provider.ts`

Implement method:

```typescript
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

private async _regenerateMovement(params: RegenerateMovementParams): Promise<MovementScaffoldResult> {
  const systemPrompt = await this.loadFramePrompt(params.adventure.frame, 'scaffold')

  // Build context with locked movements
  let contextText = `\nLocked movements to preserve:\n`
  if (params.lockedMovements && params.lockedMovements.length > 0) {
    contextText += params.lockedMovements
      .map((m) => `- ${m.title} (${m.type}): ${m.description}`)
      .join('\n')
  } else {
    contextText = ''
  }

  const userPrompt = `Regenerate the following movement for a ${params.adventure.frame} adventure focused on "${params.adventure.focus}".

Original movement:
- Title: ${params.movement.title}
- Type: ${params.movement.type}
- Description: ${params.movement.description}

Party: ${params.adventure.partySize} players, level ${params.adventure.partyLevel}
Difficulty: ${params.adventure.difficulty}
Stakes: ${params.adventure.stakes}
${contextText}

Generate a NEW version of this movement that:
1. Maintains the same general type (${params.movement.type}) unless a different type would work better
2. Fits cohesively with the locked movements
3. Offers variety from the original
4. Stays appropriate for the party and difficulty

Return JSON: { "title": "...", "description": "...", "type": "combat|exploration|social|puzzle", "estimatedTime": "..." }`

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
```

### Analytics Event

**File**: `lib/analytics/analytics.ts`

Add event constant:

```typescript
export const ANALYTICS_EVENTS = {
  // ... existing events
  SCAFFOLD_MOVEMENT_REGENERATED: 'scaffold_movement_regenerated',
}
```

---

## Testing Requirements

### Integration Tests

**File**: `tests/integration/scaffold-regeneration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { regenerateScaffoldMovement } from '@/app/actions/movements'
import { createTestSupabaseClient, cleanupTestData } from '../helpers/testDb'

describe('Scaffold Regeneration', () => {
  let supabase: ReturnType<typeof createTestSupabaseClient>
  let testUserId: string
  let adventureId: string
  let movementId: string

  beforeEach(async () => {
    supabase = createTestSupabaseClient()
    await cleanupTestData(supabase)

    // Create test user and adventure with movements
    // ... setup code
  })

  it('should regenerate movement when under limit', async () => {
    await supabase
      .from('adventures')
      .update({ scaffold_regenerations_used: 5 })
      .eq('id', adventureId)

    const result = await regenerateScaffoldMovement(adventureId, movementId)

    expect(result.success).toBe(true)
    expect(result.movement).toBeDefined()
    expect(result.remainingRegenerations).toBe(4) // 10 - 6
  })

  it('should block regeneration when at limit', async () => {
    await supabase
      .from('adventures')
      .update({ scaffold_regenerations_used: 10 })
      .eq('id', adventureId)

    const result = await regenerateScaffoldMovement(adventureId, movementId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('limit reached')
    expect(result.error).toContain('10')
  })

  it('should increment counter after successful regeneration', async () => {
    await supabase
      .from('adventures')
      .update({ scaffold_regenerations_used: 3 })
      .eq('id', adventureId)

    await regenerateScaffoldMovement(adventureId, movementId)

    const { data } = await supabase
      .from('adventures')
      .select('scaffold_regenerations_used')
      .eq('id', adventureId)
      .single()

    expect(data!.scaffold_regenerations_used).toBe(4)
  })

  it('should NOT consume credits', async () => {
    const { data: before } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', testUserId)
      .single()

    await regenerateScaffoldMovement(adventureId, movementId)

    const { data: after } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', testUserId)
      .single()

    expect(after!.credits).toBe(before!.credits)
  })

  it('should preserve movement id and orderIndex', async () => {
    const { data: before } = await supabase
      .from('adventures')
      .select('movements')
      .eq('id', adventureId)
      .single()

    const originalMovement = (before!.movements as Movement[]).find((m) => m.id === movementId)
    const originalOrderIndex = originalMovement!.orderIndex

    await regenerateScaffoldMovement(adventureId, movementId)

    const { data: after } = await supabase
      .from('adventures')
      .select('movements')
      .eq('id', adventureId)
      .single()

    const updatedMovement = (after!.movements as Movement[]).find((m) => m.id === movementId)

    expect(updatedMovement!.id).toBe(movementId)
    expect(updatedMovement!.orderIndex).toBe(originalOrderIndex)
  })

  it('should update movement content', async () => {
    const { data: before } = await supabase
      .from('adventures')
      .select('movements')
      .eq('id', adventureId)
      .single()

    const originalTitle = (before!.movements as Movement[]).find((m) => m.id === movementId)!.title

    await regenerateScaffoldMovement(adventureId, movementId)

    const { data: after } = await supabase
      .from('adventures')
      .select('movements')
      .eq('id', adventureId)
      .single()

    const newTitle = (after!.movements as Movement[]).find((m) => m.id === movementId)!.title

    // Title should change (LLM generates new content)
    expect(newTitle).not.toBe(originalTitle)
  })
})
```

---

## Implementation Steps

1. **Add types to `lib/llm/types.ts`**
   - `RegenerateMovementParams`
   - `MovementScaffoldResult`

2. **Update `lib/llm/provider.ts` interface**
   - Add `regenerateMovement()` method signature

3. **Implement in `lib/llm/openai-provider.ts`**
   - Add `regenerateMovement()` and `_regenerateMovement()` methods
   - Use locked movements as context

4. **Add analytics event**
   - Update `lib/analytics/analytics.ts`

5. **Create Server Action**
   - Add `regenerateScaffoldMovement()` to `app/actions/movements.ts`
   - Check limits, call LLM, increment counter

6. **Write integration tests**
   - Create `tests/integration/scaffold-regeneration.test.ts`
   - Test limit enforcement, counter increment, credit preservation

7. **Run tests**
   - `npm run test:coverage`
   - Ensure ≥90% coverage

8. **Commit changes**
   - Message: "feat: add scaffold movement regeneration with 10 regeneration limit"

---

## Verification Checklist

- [ ] `regenerateScaffoldMovement()` Server Action exists
- [ ] Function checks `scaffold_regenerations_used` before LLM call
- [ ] Counter increments after successful regeneration
- [ ] No credit consumption
- [ ] Movement `id` and `orderIndex` preserved
- [ ] Error message clear at limit
- [ ] Analytics event tracked
- [ ] Integration tests pass
- [ ] TypeScript compiles
- [ ] Linting passes

---

## UI Integration Notes

This feature creates the Server Action. UI integration (button, loading state, etc.) should be a separate feature:

- `FEATURE_scaffold_regeneration_ui.md`

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:396-422](../IMPLEMENTATION_GAP_ANALYSIS.md#L396-L422)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:102-113](../SYSTEM_OVERVIEW.md#L102-L113)
- **Existing Movement Actions**: [app/actions/movements.ts](../../app/actions/movements.ts)

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-24
