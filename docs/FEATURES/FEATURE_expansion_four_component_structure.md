# Feature: Expansion Four-Component Structure

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 2 - Fix Expansion Structure
**Estimated Time**: 3 hours
**Dependencies**: None (but Phase 1 features recommended first)

---

## Overview

Restructure movement expansion to return 4 separate components (NPCs, Enemies, Descriptions, Narration) instead of a single `content` string. This aligns with SYSTEM_OVERVIEW.md's specification for how expanded movements should be structured.

---

## Acceptance Criteria

- [ ] `MovementResult` type updated with 4-component structure
- [ ] `expandMovement()` returns structured components
- [ ] NPCs array with name, personality, stats, role
- [ ] Enemies array with name, quantity, stats, tactics
- [ ] Descriptions array of text snippets
- [ ] Narration as optional string
- [ ] OpenAI prompt updated to generate structured output
- [ ] Database saves new structure correctly
- [ ] Integration tests verify structure
- [ ] Backward compatibility handled (or breaking change documented)

---

## Technical Specification

### Type Updates

**File**: `lib/llm/types.ts`

**Current**:

```typescript
export interface MovementResult {
  content: string
  mechanics?: {
    dcChecks?: Array<{...}>
    combatEncounter?: {
      enemies: Array<{...}>
      environment: string
      objectives: string[]
    }>
  }
  gmNotes?: string
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}
```

**New**:

```typescript
export interface NPC {
  id: string // UUID for component-level regeneration
  name: string
  personality: string
  stats: {
    level?: number
    hp?: number
    stress?: number
    armorScore?: number
    damageDie?: string
    [key: string]: unknown // Flexible for other stats
  }
  role: string // "quest giver" | "ally" | "neutral" | "antagonist"
  description: string // Physical description
}

export interface Enemy {
  id: string // UUID for component-level regeneration
  name: string
  quantity: number
  stats: {
    level: number
    hp: number
    stress: number
    armorScore: number
    damageDie: string
    difficulty: number
    [key: string]: unknown
  }
  tactics: string // Combat strategy
  description: string // Physical description
}

export interface MovementResult {
  npcs: NPC[]
  enemies: Enemy[]
  descriptions: string[] // Array of descriptive text snippets
  narration: string | null // Optional read-aloud text

  // Preserve for backward compatibility (can be deprecated later)
  gmNotes?: string
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}
```

### OpenAI Provider Update

**File**: `lib/llm/openai-provider.ts`

Update `_expandMovement()` method:

```typescript
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

  const userPrompt = this.buildExpansionPromptV2(params)

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

  // Transform response to new structure
  const result: MovementResult = {
    npcs: (response.npcs || []).map((npc: any) => ({
      id: crypto.randomUUID(),
      name: npc.name,
      personality: npc.personality,
      stats: npc.stats || {},
      role: npc.role || 'neutral',
      description: npc.description || '',
    })),
    enemies: (response.enemies || []).map((enemy: any) => ({
      id: crypto.randomUUID(),
      name: enemy.name,
      quantity: enemy.quantity || 1,
      stats: enemy.stats || {},
      tactics: enemy.tactics || '',
      description: enemy.description || '',
    })),
    descriptions: response.descriptions || [],
    narration: response.narration || null,
    gmNotes: response.gmNotes,
    transitions: response.transitions,
  }

  await this.cacheResponse(params, result, completion.usage?.total_tokens)

  return result
}

private buildExpansionPromptV2(params: ExpansionParams): string {
  return `Expand the following movement into 4 detailed components:

**Movement to Expand:**
- Title: ${params.movement.title}
- Type: ${params.movement.type}
- Description: ${params.movement.description}

**Adventure Context:**
- Frame: ${params.adventure.frame}
- Focus: ${params.adventure.focus}
- Party: ${params.adventure.partySize} players, level ${params.adventure.partyLevel}

**Generate the following components:**

1. **NPCs**: Array of 0-3 NPCs (if applicable)
   - Each with: name, personality, stats (level, HP, stress, armorScore, damageDie), role, description
   - Use Daggerheart stat blocks

2. **Enemies**: Array of 0-5 enemy types (if combat movement)
   - Each with: name, quantity, stats (level, HP, stress, armorScore, damageDie, difficulty), tactics, description
   - Balanced for party level ${params.adventure.partyLevel}

3. **Descriptions**: Array of 3-5 text snippets the GM can use to describe:
   - The scene/environment
   - Key objects or features
   - Atmosphere and mood
   - Sensory details (sights, sounds, smells)

4. **Narration**: Single optional paragraph the GM can read aloud to players
   - Evocative opening or dramatic moment
   - Can include dialogue
   - Null if not applicable

Return JSON matching this structure:
{
  "npcs": [{ "name": "...", "personality": "...", "stats": {...}, "role": "...", "description": "..." }],
  "enemies": [{ "name": "...", "quantity": 1, "stats": {...}, "tactics": "...", "description": "..." }],
  "descriptions": ["...", "...", "..."],
  "narration": "..." or null,
  "gmNotes": "..." (optional GM tips),
  "transitions": { "fromPrevious": "...", "toNext": "..." }
}`
}
```

### Database Storage

**File**: `app/actions/movements.ts`

Update `expandMovement()` to save new structure:

```typescript
// After LLM expansion (line 123+)
const expansion = await getLLMProvider().expandMovement({...})

// Update movement with expanded components
const updatedMovements = movements?.map((m) =>
  m.id === movementId
    ? {
        ...m,
        // New 4-component structure
        npcs: expansion.npcs,
        enemies: expansion.enemies,
        descriptions: expansion.descriptions,
        narration: expansion.narration,
        // Keep legacy fields for backward compatibility
        gmNotes: expansion.gmNotes,
        transitions: expansion.transitions,
      }
    : m,
)

const { error } = await supabase
  .from('adventures')
  .update({
    movements: updatedMovements as unknown as Json[],
    updated_at: new Date().toISOString(),
  })
  .eq('id', adventureId)
```

### Movement Type Update

**File**: `lib/llm/types.ts` (or wherever Movement is defined)

```typescript
export interface Movement {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  description: string // Scaffold summary
  estimatedTime?: string
  orderIndex?: number
  locked?: boolean

  // Expansion components (populated after expansion)
  npcs?: NPC[]
  enemies?: Enemy[]
  descriptions?: string[]
  narration?: string | null

  // Legacy/backward compatibility
  content?: string
  gmNotes?: string
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}
```

---

## Testing Requirements

### Integration Tests

**File**: `tests/integration/expansion-structure.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { expandMovement } from '@/app/actions/movements'
import { createTestSupabaseClient, cleanupTestData } from '../helpers/testDb'
import type { NPC, Enemy, Movement } from '@/lib/llm/types'

describe('Expansion Four-Component Structure', () => {
  let supabase: ReturnType<typeof createTestSupabaseClient>
  let testUserId: string
  let adventureId: string
  let movementId: string

  beforeEach(async () => {
    supabase = createTestSupabaseClient()
    await cleanupTestData(supabase)

    // Create test adventure with movement
    // ... setup code
  })

  describe('Component Structure', () => {
    it('should return expansion with 4 components', async () => {
      const result = await expandMovement(adventureId, movementId)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('npcs')
      expect(result).toHaveProperty('enemies')
      expect(result).toHaveProperty('descriptions')
      expect(result).toHaveProperty('narration')
    })

    it('should have NPCs as array (0 or more)', async () => {
      const result = await expandMovement(adventureId, movementId)

      expect(Array.isArray(result.npcs)).toBe(true)
      // Could be empty for some movement types
    })

    it('should have enemies as array (0 or more)', async () => {
      const result = await expandMovement(adventureId, movementId)

      expect(Array.isArray(result.enemies)).toBe(true)
    })

    it('should have descriptions as array with at least one item', async () => {
      const result = await expandMovement(adventureId, movementId)

      expect(Array.isArray(result.descriptions)).toBe(true)
      expect(result.descriptions!.length).toBeGreaterThan(0)
    })

    it('should have narration as string or null', async () => {
      const result = await expandMovement(adventureId, movementId)

      expect(typeof result.narration === 'string' || result.narration === null).toBe(true)
    })
  })

  describe('NPC Structure', () => {
    it('should have correct NPC fields when NPCs exist', async () => {
      // Use a movement type likely to generate NPCs (social, exploration)
      const result = await expandMovement(adventureId, movementId)

      if (result.npcs && result.npcs.length > 0) {
        const npc = result.npcs[0]!

        expect(npc).toHaveProperty('id')
        expect(npc).toHaveProperty('name')
        expect(npc).toHaveProperty('personality')
        expect(npc).toHaveProperty('stats')
        expect(npc).toHaveProperty('role')
        expect(npc).toHaveProperty('description')

        expect(typeof npc.id).toBe('string')
        expect(typeof npc.name).toBe('string')
        expect(typeof npc.personality).toBe('string')
        expect(typeof npc.stats).toBe('object')
      }
    })

    it('should assign unique IDs to each NPC', async () => {
      const result = await expandMovement(adventureId, movementId)

      if (result.npcs && result.npcs.length > 1) {
        const ids = result.npcs.map((npc) => npc.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
      }
    })
  })

  describe('Enemy Structure', () => {
    it('should have correct enemy fields when enemies exist', async () => {
      // Use combat movement
      const result = await expandMovement(adventureId, movementId)

      if (result.enemies && result.enemies.length > 0) {
        const enemy = result.enemies[0]!

        expect(enemy).toHaveProperty('id')
        expect(enemy).toHaveProperty('name')
        expect(enemy).toHaveProperty('quantity')
        expect(enemy).toHaveProperty('stats')
        expect(enemy).toHaveProperty('tactics')
        expect(enemy).toHaveProperty('description')

        expect(typeof enemy.quantity).toBe('number')
        expect(enemy.quantity).toBeGreaterThan(0)
      }
    })
  })

  describe('Database Storage', () => {
    it('should save expanded components to database', async () => {
      await expandMovement(adventureId, movementId)

      const { data: adventure } = await supabase
        .from('adventures')
        .select('movements')
        .eq('id', adventureId)
        .single()

      const movement = (adventure!.movements as Movement[]).find((m) => m.id === movementId)

      expect(movement).toBeDefined()
      expect(movement!.npcs).toBeDefined()
      expect(movement!.enemies).toBeDefined()
      expect(movement!.descriptions).toBeDefined()
      expect(movement!).toHaveProperty('narration')
    })
  })
})
```

### MSW Mock Update

**File**: `tests/mocks/openai.ts` (or wherever MSW handlers are)

Update OpenAI mock to return 4-component structure:

```typescript
export const openaiHandlers = [
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              npcs: [
                {
                  name: 'Test NPC',
                  personality: 'Wise and cautious',
                  stats: { level: 2, hp: 15, stress: 10, armorScore: 12 },
                  role: 'quest giver',
                  description: 'An elderly scholar',
                },
              ],
              enemies: [
                {
                  name: 'Shadow Beast',
                  quantity: 2,
                  stats: { level: 2, hp: 20, stress: 12, armorScore: 14, damageDie: 'd8' },
                  tactics: 'Ambush from darkness',
                  description: 'Shadowy creature with glowing eyes',
                },
              ],
              descriptions: [
                'The chamber is dimly lit by flickering torches.',
                'Strange runes cover the walls.',
                'A sense of ancient power fills the air.',
              ],
              narration:
                'As you enter the chamber, the air grows cold and shadows seem to move of their own accord.',
              gmNotes: 'This is a key moment - build tension',
            }),
          },
        },
      ],
      usage: { total_tokens: 500 },
    })
  }),
]
```

---

## Implementation Steps

1. **Update types in `lib/llm/types.ts`**
   - Add `NPC` and `Enemy` interfaces
   - Update `MovementResult`
   - Update `Movement` interface

2. **Update OpenAI provider**
   - Modify `_expandMovement()` to parse 4-component structure
   - Update `buildExpansionPromptV2()` with new format
   - Assign UUIDs to NPCs and enemies

3. **Update `app/actions/movements.ts`**
   - Modify how expansion results are saved to movements array

4. **Update MSW mocks**
   - Return 4-component structure in test mocks

5. **Write integration tests**
   - Create `tests/integration/expansion-structure.test.ts`
   - Test all 4 components
   - Verify database storage

6. **Run tests**
   - `npm run test:coverage`
   - Fix any broken tests

7. **Manual verification**
   - Generate real adventure
   - Expand movement
   - Inspect database to verify structure

8. **Commit changes**
   - Message: "feat: restructure expansion to return 4 components (NPCs, Enemies, Descriptions, Narration)"

---

## Verification Checklist

- [ ] `MovementResult` has 4 component fields
- [ ] `NPC` and `Enemy` types defined
- [ ] OpenAI prompt generates correct structure
- [ ] Each NPC/Enemy gets unique ID
- [ ] Database correctly stores nested structure
- [ ] Integration tests pass
- [ ] MSW mocks updated
- [ ] No TypeScript errors
- [ ] Linting passes

---

## Breaking Changes

**This is a BREAKING CHANGE** if any code reads `movement.content` or `expansion.content`.

### Migration Path

**Option 1**: Maintain backward compatibility

- Keep `content` field, populate with concatenated descriptions
- Gradually migrate UI to use new fields

**Option 2**: Breaking change (recommended)

- Remove `content` field entirely
- Update all UI code to use new structure
- Accept that old adventures won't display correctly (acceptable for early MVP)

**Recommendation**: Option 2 for MVP phase.

---

## UI Integration Notes

This feature updates the Server Action and data structure. Separate UI feature needed:

- `FEATURE_expansion_components_ui.md` - Display 4 components separately

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:198-255](../IMPLEMENTATION_GAP_ANALYSIS.md#L198-L255)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:106-112](../SYSTEM_OVERVIEW.md#L106-L112)
- **Current Types**: [lib/llm/types.ts:50-73](../../lib/llm/types.ts#L50-L73)

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-24
