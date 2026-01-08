# FEATURE-001: Per-Scene Confirmation for Expansion Stage

**Command**: `/execute-feature FEATURE_001_expansion_confirmation_workflow`
**Status**: Not Started
**Priority**: P1-High (Major UX Gap)
**Estimated Time**: 8-10 hours
**Dependencies**: Issue #9 (Scaffold Confirmation) ✅ Complete

---

## Quick Start

```bash
# Execute with:
/execute-feature FEATURE_001_expansion_confirmation_workflow

# Or manually:
git checkout -b feature/expansion-confirmation-workflow
npm run test:watch
# Follow implementation phases below
```

---

## Problem Statement

Users can currently export adventures with mixed state (some movements expanded, some scaffold-only). This creates:

- ❌ No visual indicator of which movements are expanded
- ❌ No confirmation gate before export
- ❌ Inconsistent workflow with scaffold stage (which has confirmation)
- ❌ Potential for incomplete content at the table

**Example**: User might expand Movement 1 and 2, but forget Movement 3, then export. At the game table, Movement 3 is just an outline—no NPCs, no descriptions, no adversaries.

---

## Acceptance Criteria

### Must Have:

- [ ] Each expanded movement has a confirmation mechanism
- [ ] Cannot export until all movements are expanded AND confirmed
- [ ] Progress indicator shows "X/Y movements expanded and confirmed"
- [ ] Visual badges on each movement: Not Expanded | Expanded | Confirmed
- [ ] Confirmation persists across page refresh
- [ ] Confirmed expansions can be unconfirmed for regeneration
- [ ] Export button disabled until all confirmed

### Should Have:

- [ ] Analytics tracking for confirmation events
- [ ] Toast notifications for confirmation/unconfirmation
- [ ] Consistent UI with scaffold confirmation (same colors, button text)
- [ ] Keyboard shortcuts for confirmation

### Nice to Have:

- [ ] Time tracking: How long from expansion to confirmation
- [ ] Comparison view: Scaffold vs Expanded content
- [ ] Bulk confirm all expansions

---

## Implementation Phases

### Phase 1: Backend (2-3 hours)

**Tasks:**

1. Create migration: `supabase/migrations/00020_add_expansion_confirmation.sql`
2. Add helper function: `all_movements_expanded_and_confirmed()`
3. Update TypeScript types in `lib/llm/types.ts`:
   - Add `confirmed` and `confirmTimestamp` to `SceneExpansion` interface
4. Implement Server Actions in `app/actions/scenes.ts`:
   - `confirmExpansion(adventureId, movementId)`
   - `unconfirmExpansion(adventureId, movementId)`
5. Update export validation in `app/actions/export.ts`:
   - Block export if any movement not expanded
   - Block export if any expansion not confirmed
6. Add analytics events in `lib/analytics/analytics.ts`:
   - `EXPANSION_CONFIRMED`
   - `EXPANSION_UNCONFIRMED`
   - `EXPANSION_ALL_CONFIRMED`

**Testing (TDD):**

- Write integration tests first in `__tests__/integration/actions/expansion-confirmation.test.ts`
- Test coverage requirements:
  - ✅ Confirm expansion successfully
  - ✅ Cannot confirm non-expanded movement
  - ✅ Unconfirm expansion successfully
  - ✅ Export blocked if any movement not expanded
  - ✅ Export blocked if any expansion not confirmed
  - ✅ Progress calculation (X/Y confirmed)
  - ✅ Authorization checks (RLS)

**Success Criteria:**

- All integration tests passing (≥90% coverage)
- Export properly blocked for unconfirmed expansions
- Analytics events tracked correctly

---

### Phase 2: Frontend Components (3-4 hours)

**Component 1: ExpansionConfirmationBadge**

- File: `features/focus-mode/components/ExpansionConfirmationBadge.tsx`
- Shows three states:
  - Not Expanded (gray badge with Sparkles icon)
  - Expanded (blue button: "Confirm Expansion")
  - Confirmed (green badge with CheckCircle, X to unconfirm)
- Tooltips explain each state
- Loading states during confirmation

**Component 2: Expansion Progress Indicator**

- File: Update `app/adventures/[id]/page.tsx`
- Only shown when `adventure.state === 'ready'`
- Card with colored border:
  - Green: All confirmed
  - Yellow: Not all confirmed
- Shows "X/Y movements expanded and confirmed"
- Helpful text explaining what to do next

**Component 3: Focus Mode Integration**

- File: Update `components/features/focus-mode.tsx`
- Add confirmation handlers:
  - `handleConfirmExpansion(movementId)`
  - `handleUnconfirmExpansion(movementId)`
- Render ExpansionConfirmationBadge for each movement
- Show confirmation count in header

**Testing:**

- Component tests for each badge state
- Test confirmation/unconfirmation flows
- Test toast notifications

**Success Criteria:**

- Badge shows correct status for each movement
- Progress indicator updates in real-time
- Export button disabled until all confirmed
- Mobile responsive

---

### Phase 3: E2E Tests (2 hours)

**File**: `__tests__/e2e/expansion-confirmation.spec.ts`

**Test Scenarios:**

1. Full workflow: generate → scaffold confirm → expand → expansion confirm → export
2. Expansion confirmation persists across page refresh
3. Unconfirm expansion removes confirmation
4. Progress indicator updates in real-time
5. Export blocked if any movement not expanded
6. Export blocked if any expansion not confirmed
7. Confirmed expansion cannot be regenerated (shows dialog)

**Success Criteria:**

- All E2E tests passing in Chromium, Firefox, WebKit
- Screenshots captured for documentation

---

### Phase 4: Documentation (1 hour)

1. Update user documentation (if exists)
2. Update `TESTING_STRATEGY.md` with new E2E patterns
3. Create PR with full context from design doc

---

## Technical Specification

### Database Migration

```sql
-- supabase/migrations/00020_add_expansion_confirmation.sql

-- No schema changes needed (movements is JSONB)
-- Just add helper function for export validation

CREATE OR REPLACE FUNCTION all_movements_expanded_and_confirmed(adventure_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  movements_json JSONB;
  movement JSONB;
  all_ready BOOLEAN := TRUE;
BEGIN
  SELECT movements INTO movements_json
  FROM daggerheart_adventures
  WHERE id = adventure_id;

  IF movements_json IS NULL OR jsonb_array_length(movements_json) = 0 THEN
    RETURN FALSE;
  END IF;

  FOR movement IN SELECT * FROM jsonb_array_elements(movements_json)
  LOOP
    -- Check if movement has expansion
    IF NOT (movement ? 'expansion') THEN
      all_ready := FALSE;
      EXIT;
    END IF;

    -- Check if expansion is confirmed
    IF NOT COALESCE((movement->'expansion'->>'confirmed')::BOOLEAN, FALSE) THEN
      all_ready := FALSE;
      EXIT;
    END IF;
  END LOOP;

  RETURN all_ready;
END;
$$;

COMMENT ON FUNCTION all_movements_expanded_and_confirmed IS
  'Returns TRUE if all movements have expansion data AND are confirmed';
```

### TypeScript Types

```typescript
// lib/llm/types.ts

export interface SceneExpansion {
  // Existing fields
  descriptions: string[]
  narration?: string
  npcs?: NPC[]
  adversaries?: Adversary[]
  environment?: Environment
  loot?: Loot
  generatedAt: string
  tokensUsed?: number

  // NEW: Confirmation tracking
  confirmed?: boolean
  confirmTimestamp?: string
}
```

### Server Actions

See full design doc for complete implementation of:

- `confirmExpansion(adventureId, movementId)`
- `unconfirmExpansion(adventureId, movementId)`
- Updated `exportAdventure()` validation

---

## Edge Cases & Error Handling

### 1. Regenerate After Confirmation

**Solution**: Show dialog: "This will unconfirm the expansion. Continue?"

- If yes: unconfirm, then regenerate
- Matches scaffold behavior

### 2. Manual Edits

**Solution**: Manual edits do NOT auto-confirm

- User must explicitly click "Confirm Expansion" after edits

### 3. Hit Regeneration Limit

**Solution**: Allow confirmation without regenerations

- Show message: "Limit reached (20/20). Manual editing available."
- Confirmation still works
- Export available once all confirmed

### 4. Mixed Expansion State

**Solution**: Strict validation

- `expansion` field must be complete (all required components)
- If incomplete, treat as "Not Expanded"

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All integration tests passing (≥90% coverage)
- [ ] All E2E tests passing (all browsers)
- [ ] Export properly blocked for unconfirmed content
- [ ] Progress indicator shows correct state
- [ ] Analytics tracking all events
- [ ] Toast notifications working
- [ ] Mobile responsive
- [ ] No TypeScript/ESLint errors
- [ ] PR created with full context
- [ ] Code reviewed and merged

---

## Related Documentation

**Full Design Doc**: See `docs/archive/2025-11-07/DESIGN_expansion_confirmation.md` for:

- Complete API specifications
- All component code examples
- Full workflow diagrams
- Analytics event schemas
- Future enhancements

**Related Features**:

- Issue #9: Per-scene confirmation for scaffold (✅ Complete)
- Six-component expansion system (✅ Complete)
- Focus Mode AI Chat (✅ Complete)

---

**Created**: 2025-11-07 (from design doc dated 2025-10-30)
**Estimated Total Time**: 8-10 hours
**Next Session**: Start with Phase 1 (Backend + Tests)
