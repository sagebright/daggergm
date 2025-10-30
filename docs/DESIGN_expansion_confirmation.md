# Design Document: Per-Scene Confirmation for Expansion Stage

**Status**: Draft
**Created**: 2025-10-30
**Related**: Issue #9 (Scaffold Confirmation), Future Issue TBD
**Dependencies**: Requires completion of Issue #9 (scaffold confirmation)

---

## Executive Summary

This design extends the per-scene confirmation feature (Issue #9) from the scaffold stage to the expansion stage. Users will confirm each expanded movement before being allowed to export the adventure, ensuring all content is complete and reviewed.

**Key Goals:**

- Provide consistent UX between scaffold and expansion stages
- Prevent accidental export of incomplete/unreviewed content
- Give GMs confidence that all adventure content is ready for their game session
- Maintain clear progress indicators throughout the workflow

---

## Background

### Current Scaffold Stage (Issue #9 - Implemented)

**Workflow:**

1. User generates adventure (3-5 movement outlines)
2. User reviews/regenerates individual movements in Focus Mode
3. User confirms each movement individually
4. Progress indicator shows "X/Y scenes confirmed"
5. "Mark as Ready" button disabled until ALL scenes confirmed
6. Once all confirmed, user can transition to expansion stage

**Result:** User has explicit control over scaffold completion.

### Current Expansion Stage (Needs Improvement)

**Workflow:**

1. User clicks "Mark as Ready" (adventure state: `draft` → `ready`)
2. User enters Focus Mode
3. User expands individual movements (on-demand, per-scene)
4. LLM generates 6 components: descriptions, narration, NPCs, adversaries, environment, loot
5. User can refine with custom instructions
6. **No confirmation step** - user can export at any time

**Problems:**

- ❌ No visual indicator of which movements are expanded
- ❌ No confirmation gate before export
- ❌ User could export with mixed state (some expanded, some scaffold-only)
- ❌ Inconsistent with scaffold workflow

---

## User Stories

### User Story 1: Quality Assurance Gate

**As a** Game Master preparing for a session
**I want to** confirm that each expanded scene is complete and satisfactory
**So that** I don't accidentally export an adventure with missing content

**Acceptance Criteria:**

- Each expanded movement has a confirmation mechanism
- Cannot export until all movements are expanded AND confirmed
- Clear visual indicator of confirmation status

### User Story 2: Progress Visibility

**As a** user expanding my adventure
**I want to** see which movements I've expanded and confirmed
**So that** I know how much work remains before export

**Acceptance Criteria:**

- Progress indicator shows "X/Y movements expanded and confirmed"
- Visual badges on each movement show status: Not Expanded | Expanded | Confirmed
- Can see at a glance which movements need attention

### User Story 3: Consistent Workflow

**As a** user who just completed scaffold confirmation
**I want** expansion to work the same way
**So that** I don't have to learn a different workflow pattern

**Acceptance Criteria:**

- Expansion confirmation UI matches scaffold confirmation UI
- Same button text, badge colors, tooltip explanations
- Same "confirm → lock from regeneration" behavior

---

## Design Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│ Adventure Detail Page (state: ready)                │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Expansion Progress Indicator                    │ │
│ │ "2/3 movements expanded and confirmed"          │ │
│ │ [Yellow Border] Not all movements ready         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Edit Details] [Export] ← Export DISABLED          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Focus Mode (state: ready)                           │
├─────────────────────────────────────────────────────┤
│ Movement 1: [Badge: Confirmed ✓]                   │
│ Movement 2: [Badge: Expanded - Confirm Scene]      │ ← Active
│ Movement 3: [Badge: Not Expanded]                  │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ AI Chat Panel                                   ││
│ │ [Expand Movement] (if not expanded)             ││
│ │ [Confirm Expansion] (if expanded but not conf.) ││
│ │ [Refine with AI]                                ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## Data Model Changes

### Database Migration: `00020_add_expansion_confirmation.sql`

```sql
-- Add expansion confirmation tracking to movements JSONB
-- No schema changes needed - use existing movements column

-- Helper function: Check if all movements are expanded and confirmed
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
    -- Check if movement is expanded (has expansion field)
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

### TypeScript Type Updates

```typescript
// lib/llm/types.ts

export interface Movement {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  content: string
  estimatedTime?: string

  // Scaffold phase (Issue #9)
  confirmed?: boolean
  confirmTimestamp?: string

  // Expansion phase (THIS FEATURE)
  expansion?: SceneExpansion // Indicates movement has been expanded
}

export interface Scene {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  description: string
  estimatedTime?: string
  orderIndex?: number

  // Scaffold phase (Issue #9)
  confirmed?: boolean
  confirmTimestamp?: string

  // Expansion phase (THIS FEATURE)
  expansion?: SceneExpansion
}

export interface SceneExpansion {
  // Required
  descriptions: string[] // Array of description paragraphs

  // Optional components
  narration?: string
  npcs?: NPC[]
  adversaries?: Adversary[]
  environment?: Environment
  loot?: Loot

  // Confirmation tracking (NEW)
  confirmed?: boolean
  confirmTimestamp?: string

  // Generation metadata
  generatedAt: string
  tokensUsed?: number
}
```

---

## API Design

### New Server Actions

**File**: `app/actions/scenes.ts`

```typescript
/**
 * Confirm an expanded scene
 * Marks the expansion as confirmed and locks it from regeneration
 * Related: Expansion Stage Confirmation
 */
export async function confirmExpansion(
  adventureId: string,
  movementId: string,
): Promise<{
  success: boolean
  error?: string
  allConfirmed?: boolean
  confirmedCount?: number
  totalCount?: number
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get adventure with movements
    const { data: adventure } = await supabase
      .from('daggerheart_adventures')
      .select('*')
      .eq('id', adventureId)
      .eq('user_id', user.id)
      .single()

    if (!adventure) {
      return { success: false, error: 'Adventure not found' }
    }

    const movements = (adventure.movements as unknown as Movement[]) || []
    const movementIndex = movements.findIndex((m) => m.id === movementId)

    if (movementIndex === -1) {
      return { success: false, error: 'Movement not found' }
    }

    const movement = movements[movementIndex]

    // Verify movement has been expanded
    if (!movement.expansion) {
      return {
        success: false,
        error: 'Cannot confirm - movement has not been expanded yet',
      }
    }

    // Update expansion with confirmation
    const updatedMovements = movements.map((m) =>
      m.id === movementId
        ? {
            ...m,
            expansion: {
              ...m.expansion!,
              confirmed: true,
              confirmTimestamp: new Date().toISOString(),
            },
          }
        : m,
    )

    // Save to database
    const { error } = await supabase
      .from('daggerheart_adventures')
      .update({
        movements: updatedMovements as unknown as Json[] | null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) throw error

    revalidatePath(`/adventures/${adventureId}`)

    // Calculate progress
    const expandedCount = updatedMovements.filter((m) => m.expansion).length
    const confirmedCount = updatedMovements.filter((m) => m.expansion?.confirmed).length
    const allConfirmed = confirmedCount === expandedCount && expandedCount === movements.length

    // Track analytics
    await analytics.track(ANALYTICS_EVENTS.EXPANSION_CONFIRMED, {
      userId: user.id,
      adventureId,
      movementId,
      expandedCount,
      confirmedCount,
      totalCount: movements.length,
      allConfirmed,
    })

    return {
      success: true,
      allConfirmed,
      confirmedCount,
      totalCount: movements.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm expansion',
    }
  }
}

/**
 * Unconfirm an expanded scene
 * Removes confirmation lock, allowing regeneration
 * Related: Expansion Stage Confirmation
 */
export async function unconfirmExpansion(
  adventureId: string,
  movementId: string,
): Promise<{
  success: boolean
  error?: string
  allConfirmed?: boolean
  confirmedCount?: number
  totalCount?: number
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: adventure } = await supabase
      .from('daggerheart_adventures')
      .select('*')
      .eq('id', adventureId)
      .eq('user_id', user.id)
      .single()

    if (!adventure) {
      return { success: false, error: 'Adventure not found' }
    }

    const movements = (adventure.movements as unknown as Movement[]) || []
    const movementIndex = movements.findIndex((m) => m.id === movementId)

    if (movementIndex === -1) {
      return { success: false, error: 'Movement not found' }
    }

    const updatedMovements = movements.map((m) =>
      m.id === movementId && m.expansion
        ? {
            ...m,
            expansion: {
              ...m.expansion,
              confirmed: false,
              confirmTimestamp: undefined,
            },
          }
        : m,
    )

    const { error } = await supabase
      .from('daggerheart_adventures')
      .update({
        movements: updatedMovements as unknown as Json[] | null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)

    if (error) throw error

    revalidatePath(`/adventures/${adventureId}`)

    const expandedCount = updatedMovements.filter((m) => m.expansion).length
    const confirmedCount = updatedMovements.filter((m) => m.expansion?.confirmed).length

    await analytics.track(ANALYTICS_EVENTS.EXPANSION_UNCONFIRMED, {
      userId: user.id,
      adventureId,
      movementId,
      expandedCount,
      confirmedCount,
      totalCount: movements.length,
    })

    return {
      success: true,
      allConfirmed: false,
      confirmedCount,
      totalCount: movements.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unconfirm expansion',
    }
  }
}
```

### Updated Export Validation

**File**: `app/actions/export.ts`

```typescript
export async function exportAdventure(adventureId: string, format: 'markdown' | 'pdf') {
  // ... existing auth checks ...

  // NEW: Verify all movements expanded and confirmed
  if (adventure.state === 'ready') {
    const movements = (adventure.movements as Movement[]) || []

    // Check all movements have expansions
    const allExpanded = movements.every((m) => m.expansion)
    if (!allExpanded) {
      const unexpandedCount = movements.filter((m) => !m.expansion).length
      return {
        success: false,
        error: `Cannot export: ${unexpandedCount} movement${unexpandedCount > 1 ? 's' : ''} not expanded. Please expand all scenes before exporting.`,
      }
    }

    // Check all expansions are confirmed
    const allConfirmed = movements.every((m) => m.expansion?.confirmed)
    if (!allConfirmed) {
      const unconfirmedCount = movements.filter((m) => !m.expansion?.confirmed).length
      return {
        success: false,
        error: `Cannot export: ${unconfirmedCount} expanded movement${unconfirmedCount > 1 ? 's' : ''} not confirmed. Please confirm all expansions before exporting.`,
      }
    }
  }

  // ... proceed with export ...
}
```

### Updated Analytics Events

**File**: `lib/analytics/analytics.ts`

```typescript
export const ANALYTICS_EVENTS = {
  // ... existing events ...

  // Expansion stage confirmation
  EXPANSION_CONFIRMED: 'expansion_confirmed',
  EXPANSION_UNCONFIRMED: 'expansion_unconfirmed',
  EXPANSION_ALL_CONFIRMED: 'expansion_all_confirmed',

  // Export blocking
  EXPORT_BLOCKED_UNEXPANDED: 'export_blocked_unexpanded',
  EXPORT_BLOCKED_UNCONFIRMED: 'export_blocked_unconfirmed',
} as const
```

---

## UI/UX Design

### Component 1: Expansion Confirmation Badge

**File**: `features/focus-mode/components/ExpansionConfirmationBadge.tsx`

```typescript
'use client'

import { CheckCircle, Circle, Sparkles, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExpansionConfirmationBadgeProps {
  expanded: boolean // Has expansion data
  confirmed: boolean // Expansion is confirmed
  onConfirm: () => void
  onUnconfirm: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function ExpansionConfirmationBadge({
  expanded,
  confirmed,
  onConfirm,
  onUnconfirm,
  disabled = false,
  isLoading = false,
}: ExpansionConfirmationBadgeProps) {
  // Not yet expanded
  if (!expanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-2 bg-gray-200 text-gray-700">
              <Sparkles className="h-3 w-3" />
              Not Expanded
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Click "Expand Movement" in AI Chat to generate full content
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Expanded and confirmed
  if (confirmed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-3 w-3" />
              Expansion Confirmed
              {!disabled && !isLoading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnconfirm()
                  }}
                  className="ml-1 hover:text-red-200 transition-colors"
                  aria-label="Unconfirm expansion"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {disabled
                ? 'Expansion is confirmed and locked'
                : 'Click X to unconfirm and allow regeneration'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Expanded but not confirmed
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
            }}
            disabled={disabled || isLoading}
            className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Circle className="h-3 w-3" />
            {isLoading ? 'Confirming...' : 'Confirm Expansion'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Confirm this expanded content is ready for your game session
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Component 2: Expansion Progress Indicator

**File**: `app/adventures/[id]/page.tsx` (update existing)

```typescript
// Add to adventure detail page (ready state only)

{adventure.state === 'ready' && adventure.movements && adventure.movements.length > 0 && (
  <div className="mb-4">
    <Card className={allExpandedAndConfirmed ? 'border-green-500 bg-green-50' : 'border-yellow-500'}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {allExpandedAndConfirmed ? (
                <span className="text-green-700">
                  ✓ All movements expanded and confirmed! Ready to export.
                </span>
              ) : !allExpanded ? (
                <span className="text-yellow-700">
                  {expandedCount}/{totalCount} movements expanded
                </span>
              ) : (
                <span className="text-yellow-700">
                  {confirmedCount}/{expandedCount} expanded movements confirmed
                </span>
              )}
            </p>
            {!allExpandedAndConfirmed && (
              <p className="text-xs text-muted-foreground mt-1">
                {!allExpanded
                  ? 'Expand all movements in Edit Details mode, then confirm each one'
                  : 'Confirm all expanded movements before exporting'}
              </p>
            )}
          </div>
          <Badge variant={allExpandedAndConfirmed ? 'default' : 'secondary'}>
            {confirmedCount}/{totalCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  </div>
)}

// Update Export button
{adventure.state === 'ready' && (
  <Button
    variant="outline"
    onClick={() => setExportDialogOpen(true)}
    disabled={!allExpandedAndConfirmed}
    title={
      !allExpandedAndConfirmed
        ? `Expand and confirm all movements before exporting (${confirmedCount}/${totalCount} ready)`
        : undefined
    }
  >
    <Download className="h-4 w-4 mr-2" />
    Export
  </Button>
)}
```

### Component 3: Focus Mode Integration

**File**: `components/features/focus-mode.tsx` (update existing)

```typescript
// Add confirmation handlers for expansion

const handleConfirmExpansion = useCallback(
  async (movementId: string) => {
    setConfirmingMovementId(movementId)
    try {
      const { confirmExpansion } = await import('@/app/actions/scenes')
      const result = await confirmExpansion(adventureId, movementId)

      if (result.success) {
        toast.success(
          result.allConfirmed
            ? `All ${result.totalCount} expansions confirmed! You can now export.`
            : `Expansion confirmed! ${result.confirmedCount}/${result.totalCount} confirmed`,
        )
        onRefreshAdventure?.()
      } else {
        toast.error(result.error || 'Failed to confirm expansion')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to confirm expansion',
      )
    } finally {
      setConfirmingMovementId(null)
    }
  },
  [adventureId, onRefreshAdventure],
)

const handleUnconfirmExpansion = useCallback(
  async (movementId: string) => {
    setConfirmingMovementId(movementId)
    try {
      const { unconfirmExpansion } = await import('@/app/actions/scenes')
      const result = await unconfirmExpansion(adventureId, movementId)

      if (result.success) {
        toast.success('Expansion unconfirmed - regeneration unlocked')
        onRefreshAdventure?.()
      } else {
        toast.error(result.error || 'Failed to unconfirm expansion')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unconfirm expansion',
      )
    } finally {
      setConfirmingMovementId(null)
    }
  },
  [adventureId, onRefreshAdventure],
)

// Update movement card rendering (ready state only)
{adventureState === 'ready' && (
  <ExpansionConfirmationBadge
    expanded={!!movement.expansion}
    confirmed={movement.expansion?.confirmed ?? false}
    onConfirm={() => handleConfirmExpansion(movement.id)}
    onUnconfirm={() => handleUnconfirmExpansion(movement.id)}
    disabled={confirmingMovementId === movement.id}
    isLoading={confirmingMovementId === movement.id}
  />
)}
```

---

## Workflow Diagrams

### Complete User Journey: Scaffold → Expansion → Export

```
┌──────────────────────────────────────────────────────────────┐
│ PHASE 1: SCAFFOLD (state = draft)                            │
├──────────────────────────────────────────────────────────────┤
│ 1. Generate adventure (3-5 movements)                       │
│ 2. Review each movement in Focus Mode                       │
│ 3. Regenerate unsatisfactory movements (10 limit)           │
│ 4. Confirm each movement individually                       │
│    ├── Movement 1: [Confirmed ✓]                            │
│    ├── Movement 2: [Confirmed ✓]                            │
│    └── Movement 3: [Confirmed ✓]                            │
│ 5. Progress: "3/3 scenes confirmed"                         │
│ 6. "Mark as Ready" enabled                                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
                   [Mark as Ready]
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 2: EXPANSION (state = ready)                           │
├──────────────────────────────────────────────────────────────┤
│ 1. Enter Focus Mode                                         │
│ 2. Expand Movement 1:                                       │
│    ├── Click "Expand Movement" in AI Chat                  │
│    ├── AI generates 6 components (~10-15 sec)              │
│    ├── Review expanded content                             │
│    ├── (Optional) Refine with custom instructions          │
│    └── Click "Confirm Expansion" badge                     │
│ 3. Repeat for Movement 2, 3, etc.                          │
│ 4. Progress updates:                                        │
│    ├── "1/3 movements expanded and confirmed"              │
│    ├── "2/3 movements expanded and confirmed"              │
│    └── "3/3 movements expanded and confirmed" [GREEN]      │
│ 5. "Export" button enabled                                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
                        [Export]
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 3: EXPORT                                              │
├──────────────────────────────────────────────────────────────┤
│ ✓ All movements scaffold-confirmed                          │
│ ✓ All movements expanded                                    │
│ ✓ All expansions confirmed                                  │
│ → Download Markdown file                                    │
│ → Adventure ready for game session                          │
└──────────────────────────────────────────────────────────────┘
```

### State Transition Diagram

```
┌─────────┐
│  draft  │ Scaffold phase
└────┬────┘
     │
     │ All scaffold scenes confirmed
     │ + User clicks "Mark as Ready"
     ↓
┌─────────┐
│  ready  │ Expansion phase
└────┬────┘
     │
     │ All expansions confirmed
     │ + User clicks "Export"
     ↓
┌──────────┐
│ exported │ (Conceptual - no state change)
└──────────┘

State Properties:
├── draft
│   ├── Can generate scaffold
│   ├── Can confirm scaffold scenes
│   ├── Cannot expand movements
│   └── Cannot export
│
└── ready
    ├── Cannot modify scaffold
    ├── Can expand movements
    ├── Can confirm expansions
    └── Can export (if all confirmed)
```

---

## Testing Strategy

### Integration Tests

**File**: `__tests__/integration/actions/expansion-confirmation.test.ts`

Test coverage:

1. ✅ Confirm expansion successfully
2. ✅ Cannot confirm non-expanded movement
3. ✅ Unconfirm expansion successfully
4. ✅ Confirmed expansion blocks regeneration
5. ✅ Export validation requires all expanded and confirmed
6. ✅ Progress calculation (X/Y confirmed)
7. ✅ Analytics tracking
8. ✅ Authorization checks

### E2E Tests

**File**: `__tests__/e2e/expansion-confirmation.spec.ts`

Test scenarios:

1. ✅ Full workflow: generate → scaffold confirm → expand → expansion confirm → export
2. ✅ Expansion confirmation persists across page refresh
3. ✅ Unconfirm expansion removes confirmation
4. ✅ Progress indicator updates in real-time
5. ✅ Export blocked if any movement not expanded
6. ✅ Export blocked if any expansion not confirmed
7. ✅ Confirmed expansion cannot be regenerated

---

## Implementation Plan

### Phase 1: Backend (Server Actions + Database)

**Priority**: HIGH
**Estimated Time**: 2-3 hours

Tasks:

1. Create database migration `00020_add_expansion_confirmation.sql`
2. Update TypeScript types (Movement, Scene, SceneExpansion interfaces)
3. Implement `confirmExpansion()` server action
4. Implement `unconfirmExpansion()` server action
5. Update `exportAdventure()` validation logic
6. Add analytics events
7. Write integration tests (TDD)

**Success Criteria:**

- All integration tests passing
- Export blocked for unconfirmed expansions
- Analytics tracking confirmed events

### Phase 2: Frontend Components

**Priority**: HIGH
**Estimated Time**: 3-4 hours

Tasks:

1. Create `ExpansionConfirmationBadge.tsx` component
2. Update adventure detail page with progress indicator
3. Update Focus Mode with confirmation handlers
4. Add confirmation state management
5. Add toast notifications
6. Write component tests

**Success Criteria:**

- Badge shows correct status (Not Expanded | Expanded | Confirmed)
- Progress indicator updates in real-time
- Export button disabled until all confirmed

### Phase 3: E2E Tests

**Priority**: MEDIUM
**Estimated Time**: 2 hours

Tasks:

1. Write E2E test for full expansion workflow
2. Test confirmation persistence
3. Test unconfirmation flow
4. Test export blocking
5. Verify mobile responsiveness

**Success Criteria:**

- All E2E tests passing
- Screenshots captured for documentation

### Phase 4: Documentation

**Priority**: LOW
**Estimated Time**: 1 hour

Tasks:

1. Update user documentation
2. Add architecture decision record (ADR)
3. Update TESTING_STRATEGY.md
4. Create PR with full context

---

## Edge Cases & Error Handling

### Edge Case 1: Regenerate After Confirmation

**Scenario**: User confirms expanded Movement 1, then wants to regenerate it

**Solution Options:**

- **Option A (Recommended)**: Automatically unconfirm on regeneration attempt
  - Show dialog: "This will unconfirm the expansion. Continue?"
  - If yes: unconfirm, then regenerate
- **Option B**: Block regeneration until manually unconfirmed
  - Disable "Expand Movement" / "Refine with AI" buttons
  - Show tooltip: "Unconfirm expansion to regenerate"

**Recommendation**: Option A (matches scaffold behavior)

### Edge Case 2: Manual Edits

**Scenario**: User manually edits expanded content. Should it auto-confirm?

**Solution**: No auto-confirm. Manual edits do NOT auto-confirm expansion.

- User must explicitly click "Confirm Expansion" after manual edits
- This ensures intentional approval, not accidental

### Edge Case 3: Hit Regeneration Limit

**Scenario**: User hits 20/20 regeneration limit with only 2/3 expansions confirmed

**Solution**: Allow confirmation and manual editing, just no more LLM calls

- Show message: "Regeneration limit reached (20/20). Manual editing still available."
- Confirmation still works (doesn't require regenerations)
- Export still available once all confirmed

### Edge Case 4: Mixed Expansion State

**Scenario**: Movement 1 fully expanded, Movement 2 scaffold-only, Movement 3 partially expanded (only NPCs)

**Solution**: Strict validation

- `expansion` field must be complete (has all required components)
- If expansion is incomplete, treat as "Not Expanded"
- User must complete or regenerate expansion

### Edge Case 5: Return to Scaffold

**Scenario**: User wants to go back to scaffold stage after starting expansion

**Solution**: Add "Return to Scaffold" action

- Changes state: `ready` → `draft`
- Warns: "This will delete all expansion data. Continue?"
- If yes: clear all `expansion` fields, reset regeneration counters
- Allows user to fix scaffold before re-expanding

---

## Analytics & Metrics

### Events to Track

```typescript
// Expansion confirmation events
EXPANSION_CONFIRMED: {
  userId: string
  adventureId: string
  movementId: string
  expandedCount: number      // How many movements have expansions
  confirmedCount: number     // How many expansions are confirmed
  totalCount: number         // Total movements in adventure
  allConfirmed: boolean      // Are all expansions confirmed?
  timeToConfirm?: number     // Seconds from expansion to confirmation
}

EXPANSION_UNCONFIRMED: {
  // Same fields as above
}

EXPANSION_ALL_CONFIRMED: {
  userId: string
  adventureId: string
  totalMovements: number
  timeSinceReady: number     // Seconds from "Mark as Ready" to all confirmed
  totalRegenerations: number // How many regenerations were used
}

EXPORT_BLOCKED_UNEXPANDED: {
  userId: string
  adventureId: string
  unexpandedCount: number
}

EXPORT_BLOCKED_UNCONFIRMED: {
  userId: string
  adventureId: string
  unconfirmedCount: number
}
```

### Success Metrics

**User Engagement:**

- % of adventures that reach expansion stage
- % of expansions that get confirmed
- Average time from "Mark as Ready" to all expansions confirmed
- % of users who export after all confirmed

**Quality Indicators:**

- Average regenerations per movement during expansion
- % of expansions confirmed without regeneration
- User retention: Do users who confirm expansions return for more adventures?

**Error Prevention:**

- Export attempts blocked (should be HIGH - means feature is working)
- Unconfirm events (indicates users changing their minds - good!)

---

## Future Enhancements

### Enhancement 1: Partial Expansion Confirmation

Allow confirming individual expansion components (e.g., confirm NPCs but regenerate adversaries)

### Enhancement 2: Expansion Templates

Save confirmed expansions as templates for reuse in other adventures

### Enhancement 3: Comparison View

Show side-by-side: Original scaffold vs Expanded content vs Regenerated content

### Enhancement 4: Collaborative Confirmation

Allow multiple users to review and confirm different movements (for co-GMs)

### Enhancement 5: AI-Assisted Validation

LLM reviews expansion for completeness/consistency before allowing confirmation

---

## Open Questions

1. **Should confirmation apply to archived adventures?**
   - Current thought: No, archived adventures are "done"

2. **Should we version expansions?**
   - Keep history of regenerated expansions?
   - Current thought: No, too complex for MVP

3. **Should confirmation unlock achievement/badge?**
   - E.g., "Perfectionist: Confirmed all expansions on first try"
   - Current thought: Nice-to-have, not critical

4. **Should we limit unconfirm actions?**
   - E.g., can only unconfirm X times
   - Current thought: No, trust users to make good decisions

---

## Dependencies

### Required Before Implementation

- ✅ Issue #9 (Scaffold confirmation) must be complete
- ✅ Six-component expansion system must be stable
- ✅ Focus Mode AI Chat panel must be functional

### Blocks These Features

- Export improvements (can't export partial content)
- Adventure templates (need consistent state)
- Multiplayer/collaboration features

---

## Success Criteria

**This feature is successful if:**

1. ✅ Users report increased confidence in their exported adventures
2. ✅ Support tickets decrease for "incomplete adventure" issues
3. ✅ Export completion rate increases (fewer abandoned adventures)
4. ✅ User testing shows consistent mental model between scaffold and expansion
5. ✅ 90%+ test coverage for confirmation logic
6. ✅ Zero high-severity bugs in production for 30 days post-launch

**Metrics to Watch:**

- Export attempts blocked: Should be HIGH (feature working as intended)
- Time to export: May increase slightly (more steps), but quality improves
- User retention: Should increase (better quality = more satisfied GMs)

---

## Appendix: Code Snippets

### Example: Full Confirmation Flow

```typescript
// User flow in Focus Mode (ready state)

// 1. User clicks "Expand Movement"
await expandMovement(adventureId, movementId)
// Movement now has expansion data

// 2. User reviews content, makes manual edits
await updateMovement(adventureId, movementId, { content: '...' })
// Expansion still unconfirmed

// 3. User clicks "Confirm Expansion" badge
const result = await confirmExpansion(adventureId, movementId)
// result.confirmedCount: 1
// result.totalCount: 3
// result.allConfirmed: false

// 4. Repeat for other movements...

// 5. All confirmed
// result.allConfirmed: true
// Export button now enabled

// 6. User clicks Export
await exportAdventure(adventureId, 'markdown')
// Success! Adventure is complete
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Status**: Ready for Review
**Estimated Implementation**: 8-10 hours total
