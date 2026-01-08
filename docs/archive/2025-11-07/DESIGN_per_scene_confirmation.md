# Design Doc: Per-Scene Confirmation Workflow

**Status**: Proposed
**Created**: 2025-10-29
**Issue**: #9 from user bug report
**Complexity**: HIGH - Major feature requiring schema changes

## Problem Statement

Currently, users must approve the **entire adventure scaffold** at once using "Mark as Ready". This is too coarse-grained.

### User's Desired Workflow

> "Suppose I have 3 scenes. I really like Scene 2, but not Scene 1 or 3. I want to:
>
> 1. **Lock Scene 2** (confirmed and unchangeable)
> 2. **Regenerate Scene 1** with Scene 2 as context
> 3. **Confirm Scene 1** once satisfied
> 4. **Regenerate Scene 3** with Scenes 1 & 2 as locked context
> 5. Only when **all scenes confirmed** → enable "Mark as Ready"

## Current Behavior

- User generates 3-scene adventure
- Gets scaffold with 3 movements
- Must accept/reject **all scenes together**
- No individual scene control
- "Mark as Ready" always available (even if user dislikes scenes)

## Desired Behavior

### 1. Individual Scene Confirmation

Each scene has its own confirmation state:

- ❌ **Unconfirmed** (gray) - Not yet approved
- ✅ **Confirmed** (green) - Locked, cannot be regenerated
- 🔄 **Regenerating** (yellow) - LLM processing

### 2. Locked Scenes as Context

When regenerating Scene X:

- Pass all **confirmed** scenes as immutable context
- LLM must maintain continuity with locked scenes
- Cannot alter locked scenes' themes/narrative arcs

### 3. Conditional "Mark as Ready"

"Mark as Ready" button:

- **Disabled** until ALL scenes confirmed
- Shows count: "2/3 scenes confirmed"
- Tooltip: "Confirm all scenes before marking ready"

## Architecture Changes

### Database Schema

**Add `confirmed` column to movements**:

```sql
-- Migration: 00019_add_scene_confirmation.sql

ALTER TABLE daggerheart_adventures
ADD COLUMN movements_jsonb_schema_version INT DEFAULT 1;

COMMENT ON COLUMN daggerheart_adventures.movements_jsonb_schema_version IS
  'Schema version for movements JSON structure. Version 2 adds confirmed field.';

-- No actual schema change needed - movements is JSONB
-- Add helper function to check if all movements confirmed

CREATE OR REPLACE FUNCTION all_movements_confirmed(adventure_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  movements_json JSONB;
  movement JSONB;
  all_confirmed BOOLEAN := TRUE;
BEGIN
  SELECT movements INTO movements_json
  FROM daggerheart_adventures
  WHERE id = adventure_id;

  IF movements_json IS NULL OR jsonb_array_length(movements_json) = 0 THEN
    RETURN FALSE;
  END IF;

  FOR movement IN SELECT * FROM jsonb_array_elements(movements_json)
  LOOP
    IF NOT COALESCE((movement->>'confirmed')::BOOLEAN, FALSE) THEN
      all_confirmed := FALSE;
      EXIT;
    END IF;
  END LOOP;

  RETURN all_confirmed;
END;
$$;
```

### TypeScript Types

```typescript
// lib/llm/types.ts

export interface Movement {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  content: string
  description?: string // Scaffold-stage description
  estimatedTime?: string
  orderIndex?: number
  confirmed?: boolean // NEW: User-approved, locked for regeneration
  confirmTimestamp?: string // NEW: When confirmed
}

export interface RegenerateMovementParams {
  movement: Movement // Movement to regenerate
  adventure: {
    frame: string
    focus: string
    partySize: number
    partyLevel: number
    difficulty: string
    stakes: string
  }
  confirmedMovements?: Movement[] // CHANGED: was lockedMovements
  // Confirmed movements are immutable context
}
```

### Server Actions

**New: `confirmMovement` action**:

```typescript
// app/actions/movements.ts

export async function confirmMovement(adventureId: string, movementId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get adventure
    const { data: adventure } = await supabase
      .from('daggerheart_adventures')
      .select('*')
      .eq('id', adventureId)
      .eq('user_id', user.id)
      .single()

    if (!adventure) {
      return { success: false, error: 'Adventure not found' }
    }

    // Confirm movement
    const movements = adventure.movements as Movement[]
    const updatedMovements = movements.map((m) =>
      m.id === movementId
        ? {
            ...m,
            confirmed: true,
            confirmTimestamp: new Date().toISOString(),
          }
        : m,
    )

    // Save
    const { error } = await supabase
      .from('daggerheart_adventures')
      .update({
        movements: updatedMovements as unknown as Json[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) throw error

    revalidatePath(`/adventures/${adventureId}`)

    return {
      success: true,
      allConfirmed: updatedMovements.every((m) => m.confirmed),
      confirmedCount: updatedMovements.filter((m) => m.confirmed).length,
      totalCount: updatedMovements.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm movement',
    }
  }
}

export async function unconfirmMovement(adventureId: string, movementId: string) {
  // Similar to confirmMovement, but sets confirmed: false
  // Useful if user wants to unlock and re-edit
}
```

**Update `regenerateScaffoldMovement`**:

```typescript
export async function regenerateScaffoldMovement(adventureId: string, movementId: string) {
  // ... existing validation ...

  // Get confirmed movements for context (was lockedMovements)
  const confirmedMovements = movements
    ?.filter((m) => m.confirmed && m.id !== movementId)
    .map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      description: m.description || '',
    }))

  // Pass to LLM with stronger constraint
  const regenerated = await llmProvider.regenerateMovement({
    movement: targetMovement,
    adventure: {
      /* ... */
    },
    confirmedMovements, // LLM must maintain continuity with these
  })

  // ... rest of logic ...
}
```

**Update `updateAdventureState`**:

```typescript
export async function updateAdventureState(
  adventureId: string,
  newState: 'draft' | 'ready' | 'archived',
) {
  // ... existing auth checks ...

  // NEW: Verify all movements confirmed before allowing 'ready' state
  if (newState === 'ready') {
    const supabase = await createServerSupabaseClient()
    const { data: adventure } = await supabase
      .from('daggerheart_adventures')
      .select('movements')
      .eq('id', adventureId)
      .single()

    const movements = adventure?.movements as Movement[]
    const allConfirmed = movements?.every((m) => m.confirmed) ?? false

    if (!allConfirmed) {
      const confirmedCount = movements?.filter((m) => m.confirmed).length ?? 0
      return {
        success: false,
        error: `Cannot mark as ready: Only ${confirmedCount}/${movements?.length} scenes confirmed`,
      }
    }
  }

  // ... existing update logic ...
}
```

### UI Components

**New: `MovementConfirmationBadge`**:

```typescript
// components/features/movement-confirmation-badge.tsx

interface MovementConfirmationBadgeProps {
  confirmed: boolean
  onConfirm: () => void
  onUnconfirm: () => void
  disabled?: boolean
}

export function MovementConfirmationBadge({
  confirmed,
  onConfirm,
  onUnconfirm,
  disabled,
}: MovementConfirmationBadgeProps) {
  if (confirmed) {
    return (
      <Badge variant="success" className="gap-2">
        <CheckCircle className="h-3 w-3" />
        Confirmed
        {!disabled && (
          <button
            onClick={onUnconfirm}
            className="ml-1 hover:text-destructive"
            aria-label="Unconfirm scene"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Badge>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onConfirm}
      disabled={disabled}
      className="gap-2"
    >
      <Circle className="h-3 w-3" />
      Confirm Scene
    </Button>
  )
}
```

**Update: `FocusMode` component**:

```typescript
// components/features/focus-mode.tsx

export function FocusMode({
  movements,
  adventureId,
  adventureState,
  onUpdate,
  onExit,
  onRefreshAdventure,
}: FocusModeProps) {
  const [confirmingMovementId, setConfirmingMovementId] = useState<string | null>(null)

  const handleConfirm = async (movementId: string) => {
    setConfirmingMovementId(movementId)

    const { confirmMovement } = await import('@/app/actions/movements')
    const result = await confirmMovement(adventureId, movementId)

    if (result.success) {
      toast.success('Scene confirmed!')

      if (result.allConfirmed) {
        toast.success(`All ${result.totalCount} scenes confirmed! You can now mark as ready.`)
      } else {
        toast.info(`${result.confirmedCount}/${result.totalCount} scenes confirmed`)
      }

      onRefreshAdventure?.()
    } else {
      toast.error(result.error || 'Failed to confirm scene')
    }

    setConfirmingMovementId(null)
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {movements.map((movement) => (
        <motion.div key={movement.id} /* ... */>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{movement.title}</h3>

              {/* NEW: Confirmation badge */}
              {adventureState === 'draft' && (
                <MovementConfirmationBadge
                  confirmed={movement.confirmed ?? false}
                  onConfirm={() => handleConfirm(movement.id)}
                  onUnconfirm={() => handleUnconfirm(movement.id)}
                  disabled={confirmingMovementId === movement.id}
                />
              )}
            </div>

            {/* Rest of card... */}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
```

**Update: Adventure Detail Page**:

```typescript
// app/adventures/[id]/page.tsx

export default function AdventureDetailPage({ params }) {
  const [adventure, setAdventure] = useState<Adventure | null>(null)

  const confirmedCount = adventure?.movements?.filter((m) => m.confirmed).length ?? 0
  const totalCount = adventure?.movements?.length ?? 0
  const allConfirmed = confirmedCount === totalCount && totalCount > 0

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{adventure.title}</h1>
            {adventure.state === 'draft' && (
              <p className="text-sm text-muted-foreground mt-1">
                {confirmedCount}/{totalCount} scenes confirmed
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {adventure.state === 'draft' && (
              <>
                <Button
                  variant="default"
                  disabled={!allConfirmed || isUpdating}
                  onClick={handleMarkAsReady}
                  title={
                    !allConfirmed
                      ? `Confirm all ${totalCount} scenes before marking ready`
                      : 'Mark adventure as ready for expansion'
                  }
                >
                  {isUpdating ? 'Updating...' : 'Mark as Ready'}
                </Button>

                <Button variant="secondary" onClick={() => setFocusMode(true)}>
                  Edit Details
                </Button>
              </>
            )}
            {/* ... */}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## LLM Prompt Engineering

When confirmed movements exist, modify the regeneration prompt:

```typescript
// lib/llm/openai-provider.ts

private buildScaffoldRegenerationPrompt(params: RegenerateMovementParams): string {
  const confirmedContext = params.confirmedMovements?.length
    ? `\n\nCONFIRMED SCENES (MUST MAINTAIN CONTINUITY):\n${params.confirmedMovements
        .map((m, i) => `${i + 1}. ${m.title} (${m.type}): ${m.description}`)
        .join('\n')}\n\nIMPORTANT: The regenerated scene MUST fit seamlessly with the confirmed scenes above. Maintain thematic consistency, narrative flow, and difficulty progression.`
    : ''

  return `Regenerate: ${params.movement.title} (${params.movement.type})
Content: ${params.movement.content}
Frame: ${params.adventure.frame}, Focus: ${params.adventure.focus}
Party: ${params.adventure.partySize} lvl ${params.adventure.partyLevel}${confirmedContext}

Generate a NEW version that:
- Maintains scene type (${params.movement.type})
- Fits with confirmed scenes (if any)
- Provides fresh approach while maintaining adventure coherence
- Matches difficulty (${params.adventure.difficulty}) and stakes (${params.adventure.stakes})

JSON: {"title":"","description":"","type":"${params.movement.type}","estimatedTime":""}`
}
```

## User Experience Flow

### Scenario: 3-Scene Adventure

**1. Initial Generation**

```
Scene 1: The Gathering Storm (social) [UNCONFIRMED]
Scene 2: Into the Unknown (exploration) [UNCONFIRMED]
Scene 3: The Heart of Danger (combat) [UNCONFIRMED]

[Mark as Ready] ← DISABLED (0/3 confirmed)
```

**2. User likes Scene 2, confirms it**

```
Scene 1: The Gathering Storm (social) [UNCONFIRMED]
Scene 2: Into the Unknown (exploration) ✅ [CONFIRMED]
Scene 3: The Heart of Danger (combat) [UNCONFIRMED]

[Mark as Ready] ← DISABLED (1/3 confirmed)
```

**3. User regenerates Scene 1 (Scene 2 is locked context)**

```
Scene 1: [REGENERATING...] → The Dark Arrival (social) [UNCONFIRMED]
Scene 2: Into the Unknown (exploration) ✅ [CONFIRMED]
Scene 3: The Heart of Danger (combat) [UNCONFIRMED]
```

**4. User confirms new Scene 1**

```
Scene 1: The Dark Arrival (social) ✅ [CONFIRMED]
Scene 2: Into the Unknown (exploration) ✅ [CONFIRMED]
Scene 3: The Heart of Danger (combat) [UNCONFIRMED]

[Mark as Ready] ← DISABLED (2/3 confirmed)
```

**5. User regenerates Scene 3 (Scenes 1 & 2 locked)**
LLM receives both Scenes 1 and 2 as confirmed context, generates Scene 3 that builds on them.

**6. User confirms Scene 3**

```
Scene 1: The Dark Arrival (social) ✅ [CONFIRMED]
Scene 2: Into the Unknown (exploration) ✅ [CONFIRMED]
Scene 3: The Final Confrontation (combat) ✅ [CONFIRMED]

[Mark as Ready] ← ENABLED (3/3 confirmed) ✨
```

**7. User clicks "Mark as Ready"**
Adventure transitions to `ready` state, enters expansion phase.

## Testing Strategy

### Unit Tests

```typescript
describe('confirmMovement', () => {
  it('marks movement as confirmed', async () => {
    const result = await confirmMovement('adv-1', 'movement-1')
    expect(result.success).toBe(true)
    expect(result.confirmedCount).toBe(1)
    expect(result.allConfirmed).toBe(false)
  })

  it('detects when all movements confirmed', async () => {
    // Confirm all movements
    await confirmMovement('adv-1', 'movement-1')
    await confirmMovement('adv-1', 'movement-2')
    const result = await confirmMovement('adv-1', 'movement-3')

    expect(result.allConfirmed).toBe(true)
  })
})

describe('updateAdventureState', () => {
  it('rejects ready state when scenes unconfirmed', async () => {
    const result = await updateAdventureState('adv-1', 'ready')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only 1/3 scenes confirmed')
  })

  it('allows ready state when all confirmed', async () => {
    // Setup: Confirm all scenes
    const result = await updateAdventureState('adv-1', 'ready')
    expect(result.success).toBe(true)
  })
})

describe('regenerateScaffoldMovement', () => {
  it('passes confirmed movements as context', async () => {
    const llmSpy = vi.spyOn(llmProvider, 'regenerateMovement')

    await regenerateScaffoldMovement('adv-1', 'movement-3')

    expect(llmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmedMovements: expect.arrayContaining([
          expect.objectContaining({ id: 'movement-1', confirmed: true }),
          expect.objectContaining({ id: 'movement-2', confirmed: true }),
        ]),
      }),
    )
  })
})
```

### Integration Tests

```typescript
describe('Per-scene confirmation workflow', () => {
  it('allows selective scene confirmation', async () => {
    // Generate 3-scene adventure
    const { adventureId } = await generateAdventure(config)

    // Confirm middle scene
    await confirmMovement(adventureId, 'movement-2')

    // Verify only that scene is confirmed
    const adventure = await getAdventure(adventureId)
    expect(adventure.movements[0].confirmed).toBe(false)
    expect(adventure.movements[1].confirmed).toBe(true)
    expect(adventure.movements[2].confirmed).toBe(false)
  })

  it('enforces all-confirmed requirement for ready state', async () => {
    const { adventureId } = await generateAdventure(config)

    // Try to mark ready without confirming
    const result = await updateAdventureState(adventureId, 'ready')
    expect(result.success).toBe(false)

    // Confirm all scenes
    await confirmMovement(adventureId, 'movement-1')
    await confirmMovement(adventureId, 'movement-2')
    await confirmMovement(adventureId, 'movement-3')

    // Now it works
    const result2 = await updateAdventureState(adventureId, 'ready')
    expect(result2.success).toBe(true)
  })

  it('regenerates with confirmed scenes as immutable context', async () => {
    const { adventureId } = await generateAdventure(config)

    // Confirm first two scenes
    await confirmMovement(adventureId, 'movement-1')
    await confirmMovement(adventureId, 'movement-2')

    // Regenerate third scene
    const originalTitle = adventure.movements[2].title
    await regenerateScaffoldMovement(adventureId, 'movement-3')

    // Verify first two scenes unchanged
    const updated = await getAdventure(adventureId)
    expect(updated.movements[0].title).toBe(originalScenes[0].title)
    expect(updated.movements[1].title).toBe(originalScenes[1].title)
    expect(updated.movements[2].title).not.toBe(originalTitle)
  })
})
```

### E2E Tests (Playwright)

```typescript
test('per-scene confirmation workflow', async ({ page }) => {
  // Generate adventure
  await generateTestAdventure(page, { numScenes: 3 })

  // Enter Focus Mode
  await page.click('text=Edit Details')

  // Confirm Scene 2
  await page.click('[data-testid="movement-card-movement-2"]')
  await page.click('text=Confirm Scene')
  await expect(page.locator('text=Scene confirmed!')).toBeVisible()

  // Verify Mark as Ready is disabled
  await page.click('text=Exit')
  await expect(page.locator('button:has-text("Mark as Ready")')).toBeDisabled()
  await expect(page.locator('text=1/3 scenes confirmed')).toBeVisible()

  // Regenerate Scene 1
  // ... (test regeneration flow)

  // Confirm all scenes
  await confirmAllScenes(page)

  // Verify Mark as Ready enabled
  await expect(page.locator('button:has-text("Mark as Ready")')).toBeEnabled()
  await page.click('text=Mark as Ready')

  // Verify state transition
  await expect(page.locator('text=Adventure marked as ready!')).toBeVisible()
})
```

## Migration Strategy

### Phase 1: Database Preparation

- Add helper function `all_movements_confirmed()`
- Update movement types to include `confirmed` field
- No data migration needed (JSONB is schema-less)

### Phase 2: Backend Implementation

- Implement `confirmMovement()` server action
- Update `regenerateScaffoldMovement()` to use confirmed context
- Update `updateAdventureState()` validation

### Phase 3: Frontend Implementation

- Create `MovementConfirmationBadge` component
- Update `FocusMode` to show confirmation UI
- Update adventure detail page to show progress

### Phase 4: Testing & Rollout

- Write unit/integration/E2E tests
- Beta test with select users
- Full rollout

### Rollback Plan

- Phase 4 → 3: Hide UI, keep backend
- Phase 3 → 2: Remove frontend components
- Phase 2 → 1: Remove server actions
- Phase 1 → 0: Drop database function

## Performance Considerations

- **No N+1 queries**: Movements are embedded in adventure JSON
- **Optimistic updates**: Immediately show confirmed state in UI
- **Debouncing**: Prevent rapid confirm/unconfirm clicks
- **Caching**: Cache LLM responses with confirmed context hash

## Accessibility

- Confirmation badges have proper ARIA labels
- Keyboard navigation for confirm buttons
- Screen reader announces "X of Y scenes confirmed"
- Focus management when confirming scenes

## Open Questions

1. **Q**: Can users unconfirm a scene after confirming?
   **A**: Yes, unless adventure is marked ready. Provides flexibility.

2. **Q**: What if user regenerates a confirmed scene's neighbor - should it auto-unconfirm?
   **A**: No. Confirmed = locked. User must manually unconfirm if desired.

3. **Q**: Should confirmation persist across different adventure edits?
   **A**: Yes. Confirmed state is stored in database, survives page reloads.

4. **Q**: What happens to confirmed status when marking ready?
   **A**: Irrelevant after ready. Confirmed only matters in draft phase.

## Acceptance Criteria

- [ ] Users can confirm individual scenes
- [ ] Confirmed scenes show visual badge (green checkmark)
- [ ] "Mark as Ready" disabled until all scenes confirmed
- [ ] Progress indicator shows "X/Y scenes confirmed"
- [ ] Regeneration respects confirmed scenes as immutable context
- [ ] LLM maintains continuity with confirmed scenes
- [ ] Users can unconfirm scenes (before marking ready)
- [ ] Tests verify all confirmation logic
- [ ] E2E tests cover full workflow

## Estimated Effort

- **Database**: 2 hours (migration + function)
- **Backend**: 4 hours (server actions + tests)
- **Frontend**: 6 hours (components + integration)
- **Testing**: 4 hours (unit + integration + E2E)
- **Total**: ~16 hours (2 days)

## Related Issues

- Issue #6: Regeneration category fix (related to draft vs ready state)
- Issue #5: Quick prompts (context-aware prompts per phase)
- Regeneration tracking system (limits apply per phase)

---

**Created**: 2025-10-29
**Version**: 1.0
**Status**: Ready for review
