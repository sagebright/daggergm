# Design Doc: Scaffold-Specific Quick Prompts

**Status**: Proposed
**Created**: 2025-10-29
**Issue**: #5 from user bug report

## Problem Statement

Current Quick Prompts in AIChat are too specific for the scaffold review stage. When users are reviewing scene arcs/scaffolds, they're thinking about **thematic direction** and **high-level scope**, not granular details like "Add specific DC checks" or "Add dialogue examples".

### Current Prompts (Too Specific for Scaffold)

```typescript
const quickPrompts = [
  'Add more sensory details',
  'Include specific DC checks',
  'Add dialogue examples',
  'Describe environmental hazards',
  'Add treasure or rewards',
]
```

### User's Feedback

At scaffold stage, users are reacting to narrative arcs like:

> "The adventure begins in the edge village of Thistleborn, where the party learns of the disappearances..."

Their reactions should be:

- "I want a dungeon crawl for treasure, not investigation"
- "Initial stakes should feel higher than a random missing person"
- "I want to fight an intelligent creature whose intelligence matters in combat"

These are **theme/scope/feel concerns**, not detail-level refinements.

## Proposed Solution

### Context-Aware Quick Prompts

Prompt suggestions should vary based on:

1. **Adventure state** (draft = scaffold, ready = expansion)
2. **Movement type** (combat, social, exploration, puzzle)

### Scaffold-Stage Prompts (Thematic & Scope)

#### General (All Movement Types):

```typescript
const scaffoldGeneralPrompts = [
  'Make stakes feel higher',
  'Change tone to be more serious/lighthearted',
  'Add mystery/intrigue elements',
  'Make it more combat-focused',
  'Add moral dilemma for players',
]
```

#### Combat-Specific:

```typescript
const scaffoldCombatPrompts = [
  'Make enemy intelligent and strategic',
  'Add environmental combat challenges',
  'Make this boss-level encounter',
  'Include non-combat resolution option',
  'Make enemies sympathetic/tragic',
]
```

#### Social-Specific:

```typescript
const scaffoldSocialPrompts = [
  'Add political intrigue',
  'Make NPC morally gray',
  'Add time pressure to negotiation',
  'Include competing factions',
  'Make stakes personal for party',
]
```

#### Exploration-Specific:

```typescript
const scaffoldExplorationPrompts = [
  'Change to dungeon crawl',
  'Add discovery/mystery element',
  'Include environmental storytelling',
  'Make location more dangerous',
  'Add sense of wonder/awe',
]
```

### Expansion-Stage Prompts (Detail-Level)

Keep existing prompts for expansion phase:

```typescript
const expansionPrompts = [
  'Add more sensory details',
  'Include specific DC checks',
  'Add dialogue examples',
  'Describe environmental hazards',
  'Add treasure or rewards',
]
```

## Implementation Plan

### 1. Create Prompt Configuration File

**File**: `lib/llm/quick-prompts.ts`

```typescript
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
```

### 2. Update AIChat Component

```typescript
// components/features/ai-chat.tsx

import { getQuickPrompts } from '@/lib/llm/quick-prompts'

interface AIChatProps {
  movement: Movement
  adventureId: string
  adventureState: 'draft' | 'ready' | 'archived' // NEW
  // ... existing props
}

export function AIChat({
  movement,
  adventureId,
  adventureState,
  // ...
}: AIChatProps) {
  const phase = adventureState === 'draft' ? 'scaffold' : 'expansion'

  const quickPrompts = getQuickPrompts(
    phase,
    movement.type as 'combat' | 'social' | 'exploration' | 'puzzle',
  )

  // Rest of component...
}
```

### 3. Update FocusMode to Pass Adventure State

```typescript
// components/features/focus-mode.tsx

interface FocusModeProps {
  movements: Movement[]
  adventureId: string
  adventureState: 'draft' | 'ready' | 'archived'  // NEW
  // ...
}

<AIChat
  movement={focusedMovement}
  adventureId={adventureId}
  adventureState={adventureState}  // NEW
  // ...
/>
```

### 4. Update Adventure Detail Page

```typescript
// app/adventures/[id]/page.tsx

<FocusMode
  movements={formattedMovements}
  adventureId={adventure.id}
  adventureState={adventure.state}  // NEW
  // ...
/>
```

## User Experience Flow

### Scaffold Phase (Draft State)

**User views Scene 1 (Social)**:

> "The party arrives at Thistleborn, learns of disappearances..."

**Quick Prompts Shown**:

1. "Add political intrigue" ← Social-specific
2. "Make NPC morally gray" ← Social-specific
3. "Add time pressure" ← Social-specific
4. "Make stakes feel higher" ← General
5. "Add mystery/intrigue" ← General

**User clicks**: "Make stakes feel higher"

**LLM regenerates with higher stakes**:

> "The party arrives to find Thistleborn under siege, with the chieftain's daughter among the missing. Panic grips the villagers as shadow creatures emerge at dusk..."

### Expansion Phase (Ready State)

Same scene, now in expansion phase.

**Quick Prompts Shown**:

1. "Add dialogue examples" ← Social-specific
2. "Include NPC motivations" ← Social-specific
3. "Add persuasion mechanics" ← Social-specific
4. "Add more sensory details" ← General
5. "Include specific mechanics" ← General

## Testing Strategy

### Unit Tests

```typescript
describe('getQuickPrompts', () => {
  it('returns scaffold prompts for draft phase', () => {
    const prompts = getQuickPrompts('scaffold', 'combat')
    expect(prompts).toContain('Make enemy intelligent and strategic')
    expect(prompts).not.toContain('Add specific DC checks')
  })

  it('returns expansion prompts for ready phase', () => {
    const prompts = getQuickPrompts('expansion', 'combat')
    expect(prompts).toContain('Include specific DC checks')
    expect(prompts).not.toContain('Make enemy intelligent')
  })

  it('combines type-specific and general prompts', () => {
    const prompts = getQuickPrompts('scaffold', 'social')
    expect(prompts).toHaveLength(5)
    expect(prompts.slice(0, 3)).toEqual([
      'Add political intrigue',
      'Make NPC morally gray',
      'Add time pressure',
    ])
  })
})
```

### Integration Tests

```typescript
describe('AIChat prompt selection', () => {
  it('shows scaffold prompts when adventure is in draft state', async () => {
    render(
      <AIChat
        movement={{ type: 'combat', ... }}
        adventureState="draft"
        ...
      />
    )

    expect(screen.getByText('Make enemy intelligent and strategic')).toBeVisible()
  })

  it('shows expansion prompts when adventure is ready', async () => {
    render(
      <AIChat
        movement={{ type: 'combat', ... }}
        adventureState="ready"
        ...
      />
    )

    expect(screen.getByText('Include specific DC checks')).toBeVisible()
  })
})
```

## Migration/Rollout Plan

**Phase 1**: Create quick-prompts.ts configuration
**Phase 2**: Update AIChat to use new prompts
**Phase 3**: Update FocusMode and page to pass state
**Phase 4**: Test with real users, iterate on prompts

**Rollback**: Simple - just revert to hardcoded prompts

## Open Questions

1. **Q**: Should we allow custom prompts per adventure frame (Witherwild vs Order)?
   **A**: Not initially - keep it simple. Add if users request it.

2. **Q**: Should prompts be user-customizable?
   **A**: Not in MVP. Could add "Save custom prompt" feature later.

3. **Q**: How many prompts per category?
   **A**: 5 each type = ~20 total per phase. Rotate to keep fresh.

## Acceptance Criteria

- [ ] Quick prompts vary based on adventure state (draft vs ready)
- [ ] Prompts are type-specific (combat, social, exploration, puzzle)
- [ ] Scaffold prompts focus on theme/scope/feel
- [ ] Expansion prompts focus on details/mechanics
- [ ] Configuration is easy to extend (add new prompts)
- [ ] Tests verify correct prompt selection
- [ ] UI displays prompts clearly

## Related Docs

- DESIGN_scaffold_regeneration_category_fix.md (adventure state awareness)
- FOCUS_MODE.md (Focus Mode architecture)
- LLM_INTEGRATION.md (Prompt engineering)

---

**Created**: 2025-10-29
**Version**: 1.0
**Status**: Ready for implementation
