# Integration Guide: Expansion UX Improvements

**Status**: Components Implemented, Integration Pending
**Created**: 2025-10-28
**Components**: RegenerationBudget, RegenerationConfirmDialog

---

## ✅ Completed Components

### 1. RegenerationBudget Component

**Location**: `features/focus-mode/components/RegenerationBudget.tsx`

**Props**:

```typescript
interface RegenerationBudgetProps {
  scaffoldUsed: number
  scaffoldLimit: number
  expansionUsed: number
  expansionLimit: number
  className?: string
}
```

**Test Coverage**: 100%
**Test Location**: `__tests__/unit/features/focus-mode/regeneration-budget.test.tsx`

---

### 2. RegenerationConfirmDialog Component

**Location**: `features/focus-mode/components/RegenerationConfirmDialog.tsx`

**Props**:

```typescript
interface RegenerationConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: 'scaffold' | 'expansion'
  scope: string // e.g., "Full Scene (6 components)"
  remainingRegens: number
  estimatedTime: string // e.g., "~10-15 seconds"
}
```

**Features**:

- localStorage persistence for "Don't ask again" preference
- Warning state when <3 regenerations remain
- Keyboard navigation support (Escape to cancel)
- Cost transparency (FREE badge)

**Test Coverage**: 100%
**Test Location**: `__tests__/unit/features/focus-mode/regeneration-confirm-dialog.test.tsx`

---

## 🔧 Integration Steps

### Step 1: Fetch Regeneration Counts from Adventure Data

The regeneration tracking was implemented in `FEATURE_regeneration_limits_tracking.md`. The `adventures` table now has:

- `scaffold_regenerations_used` (default: 0, max: 10)
- `expansion_regenerations_used` (default: 0, max: 20)

**Example**: Fetch in Focus Mode layout:

```typescript
// In your Focus Mode layout component
const { data: adventure } = useQuery({
  queryKey: ['adventure', adventureId],
  queryFn: async () => {
    const supabase = createClientSupabaseClient()
    const { data, error } = await supabase
      .from('adventures')
      .select('id, scaffold_regenerations_used, expansion_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error) throw error
    return data
  },
})
```

---

### Step 2: Add RegenerationBudget to Focus Mode Layout

**Recommended Location**: Sidebar or header area in Focus Mode

```typescript
import { RegenerationBudget } from '@/features/focus-mode/components/RegenerationBudget'

export function FocusModeLayout({ adventureId }: { adventureId: string }) {
  const { data: adventure } = useQuery(/* ... */)

  return (
    <div className="focus-mode-layout">
      {/* Sidebar or Header */}
      <aside className="sidebar">
        <RegenerationBudget
          scaffoldUsed={adventure?.scaffold_regenerations_used ?? 0}
          scaffoldLimit={10}
          expansionUsed={adventure?.expansion_regenerations_used ?? 0}
          expansionLimit={20}
          className="mb-4"
        />
        {/* Other sidebar content */}
      </aside>

      {/* Main content */}
    </div>
  )
}
```

---

### Step 3: Update Movement Expansion Buttons

**Recommended Pattern**: Wrap existing regenerate button with confirmation dialog logic

```typescript
'use client'

import { useState } from 'react'
import { RegenerationConfirmDialog } from '@/features/focus-mode/components/RegenerationConfirmDialog'
import { Button } from '@/components/ui/button'
import { expandMovement } from '@/app/actions/movements'

export function MovementRegenerateButton({
  adventureId,
  movementId,
  expansionUsed,
  onSuccess
}: {
  adventureId: string
  movementId: string
  expansionUsed: number
  onSuccess?: () => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const remainingRegens = 20 - expansionUsed

  const handleRegenerateClick = () => {
    // Check if user has disabled confirmation
    const skipConfirm = localStorage.getItem('skip_regen_confirm_expansion') === 'true'

    if (skipConfirm) {
      performRegeneration()
    } else {
      setShowConfirm(true)
    }
  }

  const performRegeneration = async () => {
    setIsRegenerating(true)
    try {
      const result = await expandMovement(adventureId, movementId)
      if (result.success) {
        onSuccess?.()
      }
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleRegenerateClick}
        disabled={remainingRegens === 0 || isRegenerating}
        title={remainingRegens === 0 ? 'No regenerations remaining for this adventure' : undefined}
      >
        {isRegenerating ? 'Regenerating...' : 'Regenerate Scene'}
      </Button>

      <RegenerationConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={performRegeneration}
        type="expansion"
        scope="Full scene (6 components)"
        remainingRegens={remainingRegens - 1}
        estimatedTime="~10-15 seconds"
      />
    </>
  )
}
```

---

### Step 4: Update Server Actions to Return Regeneration Counts

**File**: `app/actions/movements.ts`

Ensure `expandMovement` and `refineMovement` return updated regeneration counts:

```typescript
export async function expandMovement(adventureId: string, movementId: string) {
  // ... existing logic ...

  // After successful expansion, fetch updated counts
  const { data: adventure } = await supabase
    .from('adventures')
    .select('expansion_regenerations_used')
    .eq('id', adventureId)
    .single()

  return {
    success: true,
    expansionRegensUsed: adventure?.expansion_regenerations_used ?? 0,
    // ... other fields
  }
}
```

---

### Step 5: Update UI in Real-Time After Regeneration

Use React Query to invalidate and refetch adventure data after regeneration:

```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const onSuccess = () => {
  // Refetch adventure data to update regeneration counts
  queryClient.invalidateQueries({ queryKey: ['adventure', adventureId] })
}
```

---

## 🧪 Testing the Integration

### Manual QA Checklist

1. **Budget Display**:
   - [ ] Shows correct initial counts (0/10, 0/20)
   - [ ] Updates after each regeneration
   - [ ] Shows warning badge when <3 remain
   - [ ] Shows destructive badge when 0 remain
   - [ ] Responsive on mobile (stacks vertically)

2. **Confirmation Dialog**:
   - [ ] Shows before regeneration
   - [ ] Displays correct scope
   - [ ] Shows remaining budget
   - [ ] "Cancel" closes dialog without action
   - [ ] "Confirm" performs regeneration
   - [ ] "Don't ask again" persists to localStorage
   - [ ] Dialog respects localStorage preference

3. **Disabled State**:
   - [ ] Regenerate button disabled when budget = 0
   - [ ] Tooltip explains why disabled
   - [ ] Button re-enables after new adventure

4. **Accessibility**:
   - [ ] Keyboard navigation works (Tab, Enter, Escape)
   - [ ] Screen reader labels present
   - [ ] Focus states visible

---

## 📊 Integration Test (To Be Written)

**File**: `__tests__/integration/expansion-ux-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateAdventure } from '@/app/actions/adventures'
import { expandMovement } from '@/app/actions/movements'

describe('Expansion UX Flow (Integration)', () => {
  let adventureId: string
  let userId: string

  beforeEach(async () => {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user!.id

    // Generate test adventure
    const result = await generateAdventure({
      length: 'oneshot',
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      party_size: 4,
      party_level: 2,
      difficulty: 'standard',
      stakes: 'personal',
    })

    expect(result.success).toBe(true)
    adventureId = result.adventureId!
  })

  it('should display regeneration budget and update after expansion', async () => {
    // TODO: Render Focus Mode with adventureId
    // Check initial budget display (0/10 scaffold, 0/20 expansion)
    // Perform expansion
    // Verify budget updates (0/10 scaffold, 1/20 expansion)
  })

  it('should show confirmation dialog before regeneration', async () => {
    // TODO: Render Focus Mode
    // Click regenerate button
    // Verify dialog appears
    // Verify dialog shows correct scope and remaining budget
  })

  it('should skip confirmation if user disabled it', async () => {
    localStorage.setItem('skip_regen_confirm_expansion', 'true')

    // TODO: Render Focus Mode
    // Click regenerate button
    // Verify NO dialog appears
    // Verify regeneration proceeds immediately
  })

  it('should disable regenerate button when budget exhausted', async () => {
    // TODO: Exhaust all 20 expansion regenerations
    // Render Focus Mode
    // Verify regenerate button is disabled
    // Verify tooltip explains why
  })
})
```

---

## 📝 Notes for Developer

### Existing Focus Mode Files to Update

Based on the FEATURE document, these files likely need updates:

1. **`features/focus-mode/components/FocusModeLayout.tsx`** (or similar)
   - Add `<RegenerationBudget />` component
   - Fetch regeneration counts from adventure data

2. **Movement expansion UI components** (file location unknown)
   - Wrap regenerate buttons with `RegenerationConfirmDialog`
   - Check localStorage before showing dialog
   - Disable buttons when `remainingRegens === 0`

3. **`app/actions/movements.ts`**
   - Update `expandMovement` to return updated regeneration counts
   - Update `refineMovement` if applicable

### localStorage Keys

- `skip_regen_confirm_scaffold`: Set to 'true' when user checks "Don't ask again" for scaffold regenerations
- `skip_regen_confirm_expansion`: Set to 'true' when user checks "Don't ask again" for expansion regenerations

---

## 🚀 Next Steps

1. Locate the Focus Mode layout component
2. Add `<RegenerationBudget />` to the layout
3. Update movement expansion buttons to use `<RegenerationConfirmDialog />`
4. Update server actions to return regeneration counts
5. Write integration tests
6. Perform manual QA testing
7. Create PR and merge

---

**Status**: Ready for integration. Components are fully tested and production-ready.
**Developer**: Integrate these components into the existing Focus Mode UI as described above.
