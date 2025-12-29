# Design Doc: Fix Regeneration Category at Scaffold Stage

**Status**: Proposed
**Created**: 2025-10-29
**Issue**: #6 from user bug report

## Problem Statement

When users are in the scaffold stage (adventure state = 'draft') and click "Refine Content" from Focus Mode, the system incorrectly categorizes this as "expansion" regeneration and counts it against the expansion limit (20) instead of the scaffold limit (10).

## Current Behavior

1. User creates adventure → state = 'draft' (scaffold phase)
2. User enters Focus Mode to review/edit movements
3. User clicks "Refine Content" in AI Chat panel
4. System calls `refineMovementContent()` which increments `expansion_regenerations_used`
5. RegenerationConfirmDialog shows `type="expansion"`

**Expected**: Should use `scaffold_regenerations_used` and show `type="scaffold"`

## Root Cause

The `AIChat` component doesn't know which regeneration phase the adventure is in:

- It only receives `expansionRegenerationsUsed` prop
- It has no awareness of adventure state ('draft' vs 'ready')
- It always uses expansion type for RegenerationConfirmDialog

## Proposed Solution

### Option A: Pass Adventure State to AIChat (Recommended)

**Changes Required:**

1. Update `AIChat` component props to include `adventureState`
2. Update `FocusMode` to pass down adventure state
3. Update adventure detail page to pass state through props chain
4. Modify AIChat logic to choose regeneration type based on state:
   - `state === 'draft'` → Use scaffold regeneration
   - `state === 'ready'` → Use expansion regeneration

**Pros:**

- Clean separation of concerns
- State-driven behavior
- Easy to test

**Cons:**

- Requires prop drilling through components

### Option B: Create Separate Scaffold Refinement Action

**Changes Required:**

1. Create new server action: `refineScaffoldMovement()`
2. Update AIChat to call different action based on state
3. Duplicate refinement logic with scaffold counter increment

**Pros:**

- Explicit action names make intent clear
- Can optimize prompts per phase

**Cons:**

- Code duplication
- More complex action layer

## Recommended Approach: Option A

### Implementation Plan

#### 1. Update Type Definitions

```typescript
// components/features/ai-chat.tsx
interface AIChatProps {
  movement: Movement
  adventureId: string
  adventureState: 'draft' | 'ready' | 'archived' // NEW
  scaffoldRegenerationsUsed?: number // NEW
  expansionRegenerationsUsed?: number
  onSuggestionApply: (_suggestion: string) => void
  onRefreshAdventure?: (() => void) | undefined
}
```

#### 2. Update AIChat Component Logic

```typescript
export function AIChat({
  movement,
  adventureId,
  adventureState,
  scaffoldRegenerationsUsed = 0,
  expansionRegenerationsUsed = 0,
  // ...
}: AIChatProps) {
  const isScaffoldPhase = adventureState === 'draft'

  const remainingRegens = isScaffoldPhase
    ? 10 - scaffoldRegenerationsUsed
    : 20 - expansionRegenerationsUsed

  const regenerationType = isScaffoldPhase ? 'scaffold' : 'expansion'

  // Use appropriate action
  const performRefine = async () => {
    const action = isScaffoldPhase
      ? refineScaffoldMovement // Would need to create this
      : refineMovementContent

    const result = await action(adventureId, movement.id, instruction)
    // ...
  }
}
```

#### 3. Update FocusMode Component

```typescript
<FocusMode
  movements={formattedMovements}
  adventureId={adventure.id}
  adventureState={adventure.state}  // NEW
  scaffoldRegenerationsUsed={adventure.scaffold_regenerations_used ?? 0}
  expansionRegenerationsUsed={adventure.expansion_regenerations_used ?? 0}
  // ...
/>
```

#### 4. Update Server Actions

**Decision Point**: Do we need separate actions or can we reuse existing ones?

**Recommendation**: Reuse `refineMovementContent` but make it state-aware:

```typescript
export async function refineMovementContent(
  adventureId: string,
  movementId: string,
  instruction: string,
) {
  // ... existing validation ...

  const adventure = await getAdventure(adventureId)
  const isScaffoldPhase = adventure.state === 'draft'

  if (isScaffoldPhase) {
    // Check scaffold limit
    const scaffoldUsed = adventure.scaffold_regenerations_used ?? 0
    if (scaffoldUsed >= REGENERATION_LIMITS.SCAFFOLD) {
      return { success: false, error: REGENERATION_LIMIT_ERRORS.SCAFFOLD }
    }
  } else {
    // Check expansion limit
    const expansionUsed = adventure.expansion_regenerations_used ?? 0
    if (expansionUsed >= REGENERATION_LIMITS.EXPANSION) {
      return { success: false, error: REGENERATION_LIMIT_ERRORS.EXPANSION }
    }
  }

  // ... LLM refinement ...

  // Increment appropriate counter
  const limitChecker = new RegenerationLimitChecker()
  if (isScaffoldPhase) {
    await limitChecker.incrementScaffoldCount(adventureId)
  } else {
    await limitChecker.incrementExpansionCount(adventureId)
  }
}
```

## Testing Strategy

### Unit Tests

- `ai-chat.test.tsx`: Verify correct regeneration type passed to dialog based on state
- `movements.test.ts`: Verify correct counter incremented based on state

### Integration Tests

- Create adventure in draft state
- Enter Focus Mode, refine movement
- Verify `scaffold_regenerations_used` incremented
- Mark adventure as ready
- Refine movement again
- Verify `expansion_regenerations_used` incremented

## Migration Notes

**Breaking Changes**: None - this is a bug fix

**Backward Compatibility**: Fully compatible

## Open Questions

1. **Q**: Should expansion also be available in draft state?
   **A**: No - expansion is for detailed 6-component scene generation, only available after scaffold approved

2. **Q**: What happens if user marks as ready, then goes back to draft?
   **A**: State transitions are one-way (draft → ready → archived), so not possible

## Acceptance Criteria

- [ ] AIChat component receives and uses adventure state
- [ ] Scaffold phase refinements count toward scaffold limit (10)
- [ ] Ready phase refinements count toward expansion limit (20)
- [ ] RegenerationConfirmDialog shows correct type badge
- [ ] Tests verify counter increments correctly per phase
- [ ] Error messages reference correct limit type

## Related Issues

- Issue #9: Per-scene confirmation workflow (future enhancement)
- Regeneration tracking system (implemented in migrations 00012, 00013)

---

**Next Steps:**

1. Get approval on Option A approach
2. Implement changes in order: types → component → server action
3. Write tests
4. Verify in local environment
