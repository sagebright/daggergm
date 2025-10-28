# FEATURE: Expansion UX Improvements

**Status**: Not Started
**Priority**: P2 (High - User Experience)
**Estimated Time**: 2.5 hours
**Dependencies**: FEATURE_regeneration_limits_tracking.md (must be completed first)
**Business Impact**: Improves user confidence and transparency in Focus Mode workflow

---

## 📋 Problem Statement

Current expansion implementation (six-component scene expansion) works functionally but lacks user-friendly feedback:

- **No visual budget display**: Users don't know how many regenerations remain
- **No confirmation dialog**: Users can't review what will be regenerated before committing
- **No cost transparency**: Unclear whether regeneration is free or costs credits
- **No cancel option**: Users can't back out after clicking regenerate

This creates anxiety and friction in the Focus Mode workflow, where users should feel confident experimenting with different scene variations.

---

## 🎯 Acceptance Criteria

### Visual Regeneration Budget Display

- [ ] Display remaining scaffold regenerations (e.g., "10 scaffold regens remaining")
- [ ] Display remaining expansion regenerations (e.g., "15 expansion regens remaining")
- [ ] Update display in real-time after each regeneration
- [ ] Show warning state when <3 regenerations remain (yellow)
- [ ] Show critical state when 0 regenerations remain (red, disable button)
- [ ] Display in Focus Mode UI (prominent but not intrusive)
- [ ] Display in movement expansion UI
- [ ] Mobile-responsive layout (stack on small screens)

### Regeneration Confirmation Dialog

- [ ] Show confirmation dialog before any regeneration action
- [ ] Display what content will be regenerated (scope)
- [ ] Show remaining regeneration budget
- [ ] Show estimated time (e.g., "~10-15 seconds")
- [ ] Include "Cancel" and "Confirm" buttons
- [ ] Remember user preference (optional "Don't ask again" checkbox)
- [ ] Store preference in local storage per user
- [ ] Keyboard navigation support (Escape = cancel, Enter = confirm)

### Cost Transparency

- [ ] Clearly label regenerations as "FREE" (no credits consumed)
- [ ] Explain regeneration limit system in tooltip/info icon
- [ ] Link to help documentation about regeneration limits
- [ ] Show credit balance separately (distinguish from regenerations)

---

## 🏗️ Technical Implementation

### Task 2.1: Regeneration Budget Display Component

**File**: `features/focus-mode/components/RegenerationBudget.tsx` (new)

```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RegenerationBudgetProps {
  scaffoldUsed: number
  scaffoldLimit: number
  expansionUsed: number
  expansionLimit: number
  className?: string
}

export function RegenerationBudget({
  scaffoldUsed,
  scaffoldLimit,
  expansionUsed,
  expansionLimit,
  className,
}: RegenerationBudgetProps) {
  const scaffoldRemaining = scaffoldLimit - scaffoldUsed
  const expansionRemaining = expansionLimit - expansionUsed

  const scaffoldPercentage = (scaffoldUsed / scaffoldLimit) * 100
  const expansionPercentage = (expansionUsed / expansionLimit) * 100

  const getStatusColor = (remaining: number): 'default' | 'warning' | 'destructive' => {
    if (remaining === 0) return 'destructive'
    if (remaining <= 2) return 'warning'
    return 'default'
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Regeneration Budget</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Regenerations are <strong>FREE</strong> (no credits consumed). Each adventure has{' '}
                {scaffoldLimit} scaffold regenerations and {expansionLimit} expansion regenerations.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Scaffold Budget */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Scaffold Regenerations</span>
          <Badge variant={getStatusColor(scaffoldRemaining)}>
            {scaffoldRemaining}/{scaffoldLimit} remaining
          </Badge>
        </div>
        <Progress value={scaffoldPercentage} className="h-2" />
      </div>

      {/* Expansion Budget */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Expansion Regenerations</span>
          <Badge variant={getStatusColor(expansionRemaining)}>
            {expansionRemaining}/{expansionLimit} remaining
          </Badge>
        </div>
        <Progress value={expansionPercentage} className="h-2" />
      </div>
    </div>
  )
}
```

**Integration Points**:

- Add to Focus Mode layout (`features/focus-mode/components/FocusModeLayout.tsx`)
- Add to Movement expansion UI
- Fetch regeneration counts from adventure data (added in FEATURE_regeneration_limits_tracking.md)

---

### Task 2.2: Regeneration Confirmation Dialog

**File**: `features/focus-mode/components/RegenerationConfirmDialog.tsx` (new)

```typescript
'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface RegenerationConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: 'scaffold' | 'expansion'
  scope: string // e.g., "Full Scene (6 components)" or "Combat mechanics only"
  remainingRegens: number
  estimatedTime: string // e.g., "~10-15 seconds"
}

export function RegenerationConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  scope,
  remainingRegens,
  estimatedTime,
}: RegenerationConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false)

  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem(`skip_regen_confirm_${type}`, 'true')
    }
    onConfirm()
    onOpenChange(false)
  }

  const typeLabel = type === 'scaffold' ? 'Scaffold' : 'Expansion'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Regeneration</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              <strong>What will be regenerated:</strong>
              <p className="text-sm mt-1">{scope}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">FREE - No credits consumed</Badge>
              <Badge variant="secondary">Est. time: {estimatedTime}</Badge>
            </div>

            <div>
              <strong>Remaining {typeLabel} Regenerations:</strong>
              <p className="text-sm mt-1">
                {remainingRegens} regeneration{remainingRegens !== 1 ? 's' : ''} remaining after
                this action
              </p>
              {remainingRegens <= 2 && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Warning: Running low on regenerations for this adventure
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="dont-ask"
                checked={dontAskAgain}
                onCheckedChange={(checked) => setDontAskAgain(checked === true)}
              />
              <Label htmlFor="dont-ask" className="text-sm font-normal cursor-pointer">
                Don't ask again for {typeLabel.toLowerCase()} regenerations
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm Regeneration</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Usage Pattern** (example integration):

```typescript
'use client'

import { useState } from 'react'
import { RegenerationConfirmDialog } from './RegenerationConfirmDialog'
import { Button } from '@/components/ui/button'

export function MovementRegenerateButton({ adventureId, movementId, type, remainingRegens }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRegenerateClick = () => {
    // Check if user has disabled confirmation
    const skipConfirm = localStorage.getItem(`skip_regen_confirm_${type}`) === 'true'

    if (skipConfirm) {
      performRegeneration()
    } else {
      setShowConfirm(true)
    }
  }

  const performRegeneration = async () => {
    // Call server action to regenerate
    // ...
  }

  return (
    <>
      <Button onClick={handleRegenerateClick} disabled={remainingRegens === 0}>
        Regenerate {type === 'scaffold' ? 'Scaffold' : 'Scene'}
      </Button>

      <RegenerationConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={performRegeneration}
        type={type}
        scope={type === 'scaffold' ? 'Full adventure scaffold' : 'Full scene (6 components)'}
        remainingRegens={remainingRegens - 1}
        estimatedTime="~10-15 seconds"
      />
    </>
  )
}
```

---

### Task 2.3: Integration with Existing UI

**Files to Update**:

1. **`features/focus-mode/components/FocusModeLayout.tsx`**:
   - Add `<RegenerationBudget />` component to sidebar or header
   - Fetch regeneration counts from adventure data
   - Pass counts as props

2. **`app/actions/movements.ts`** (expandMovement & refineMovement):
   - Return updated regeneration counts in response
   - Allow UI to update in real-time

3. **Movement expansion buttons** (wherever regenerate buttons exist):
   - Wrap with `RegenerationConfirmDialog` logic
   - Disable buttons when remainingRegens === 0
   - Show tooltip explaining why disabled

---

## 🧪 Testing Requirements

### Test File: `__tests__/unit/features/focus-mode/regeneration-budget.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegenerationBudget } from '@/features/focus-mode/components/RegenerationBudget'

describe('RegenerationBudget', () => {
  it('should render both scaffold and expansion budgets', () => {
    render(
      <RegenerationBudget
        scaffoldUsed={3}
        scaffoldLimit={10}
        expansionUsed={5}
        expansionLimit={20}
      />,
    )

    expect(screen.getByText(/7\/10 remaining/i)).toBeInTheDocument()
    expect(screen.getByText(/15\/20 remaining/i)).toBeInTheDocument()
  })

  it('should show warning badge when <3 regenerations remain', () => {
    const { container } = render(
      <RegenerationBudget scaffoldUsed={8} scaffoldLimit={10} expansionUsed={5} expansionLimit={20} />,
    )

    // Check for warning variant badge
    const badges = container.querySelectorAll('[data-variant="warning"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should show destructive badge when 0 regenerations remain', () => {
    const { container } = render(
      <RegenerationBudget
        scaffoldUsed={10}
        scaffoldLimit={10}
        expansionUsed={5}
        expansionLimit={20}
      />,
    )

    const badges = container.querySelectorAll('[data-variant="destructive"]')
    expect(badges.length).toBeGreaterThan(0)
    expect(screen.getByText(/0\/10 remaining/i)).toBeInTheDocument()
  })

  it('should calculate progress percentages correctly', () => {
    const { container } = render(
      <RegenerationBudget scaffoldUsed={5} scaffoldLimit={10} expansionUsed={10} expansionLimit={20} />,
    )

    // Scaffold: 5/10 = 50%
    // Expansion: 10/20 = 50%
    const progressBars = container.querySelectorAll('[role="progressbar"]')
    expect(progressBars).toHaveLength(2)
  })

  it('should show info tooltip with explanation', async () => {
    const { container } = render(
      <RegenerationBudget scaffoldUsed={3} scaffoldLimit={10} expansionUsed={5} expansionLimit={20} />,
    )

    const infoIcon = container.querySelector('[data-testid="info-icon"]')
    expect(infoIcon).toBeInTheDocument()
  })
})
```

### Test File: `__tests__/unit/features/focus-mode/regeneration-confirm-dialog.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegenerationConfirmDialog } from '@/features/focus-mode/components/RegenerationConfirmDialog'

describe('RegenerationConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render dialog with correct information', () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    expect(screen.getByText(/Confirm Regeneration/i)).toBeInTheDocument()
    expect(screen.getByText(/Full adventure scaffold/i)).toBeInTheDocument()
    expect(screen.getByText(/7 regenerations remaining/i)).toBeInTheDocument()
    expect(screen.getByText(/FREE - No credits consumed/i)).toBeInTheDocument()
  })

  it('should show warning when <3 regenerations remain', () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="expansion"
        scope="Full scene (6 components)"
        remainingRegens={2}
        estimatedTime="~15-20 seconds"
      />,
    )

    expect(screen.getByText(/⚠️ Warning: Running low on regenerations/i)).toBeInTheDocument()
  })

  it('should call onConfirm when confirmed', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    const confirmButton = screen.getByText(/Confirm Regeneration/i)
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should save preference to localStorage when "Don\'t ask again" is checked', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    const checkbox = screen.getByLabelText(/Don't ask again/i)
    fireEvent.click(checkbox)

    const confirmButton = screen.getByText(/Confirm Regeneration/i)
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(localStorage.getItem('skip_regen_confirm_scaffold')).toBe('true')
    })
  })

  it('should close dialog when cancelled', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="expansion"
        scope="Combat mechanics only"
        remainingRegens={15}
        estimatedTime="~5-10 seconds"
      />,
    )

    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnConfirm).not.toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should handle keyboard navigation (Escape to cancel)', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
```

### Test File: `__tests__/integration/expansion-ux-flow.test.ts`

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

**Coverage Target**: 90% (standard for UX features)

---

## 📖 Implementation Guide

### Phase 1: Create RegenerationBudget Component (30 minutes)

1. Create `features/focus-mode/components/RegenerationBudget.tsx`
2. Implement component with shadcn/ui components (Badge, Progress, Tooltip)
3. Add responsive styles (stack on mobile)
4. Write unit tests (`__tests__/unit/features/focus-mode/regeneration-budget.test.tsx`)
5. Run tests: `npm run test:watch`

**Verification**:

```bash
npm run test -- regeneration-budget.test.tsx
# Should pass all 5 test cases
```

---

### Phase 2: Create RegenerationConfirmDialog Component (45 minutes)

1. Create `features/focus-mode/components/RegenerationConfirmDialog.tsx`
2. Implement AlertDialog with checkbox for "Don't ask again"
3. Add localStorage persistence logic
4. Write unit tests (`__tests__/unit/features/focus-mode/regeneration-confirm-dialog.test.tsx`)
5. Test keyboard navigation (Escape = cancel)

**Verification**:

```bash
npm run test -- regeneration-confirm-dialog.test.tsx
# Should pass all 6 test cases
```

---

### Phase 3: Integrate with Focus Mode UI (45 minutes)

1. Update `features/focus-mode/components/FocusModeLayout.tsx`:
   - Add `<RegenerationBudget />` to sidebar/header
   - Fetch regeneration counts from adventure data
   - Pass as props to budget display

2. Update movement expansion buttons:
   - Wrap with `RegenerationConfirmDialog` logic
   - Check localStorage before showing dialog
   - Disable when `remainingRegens === 0`

3. Update `app/actions/movements.ts`:
   - Return updated regeneration counts in response
   - Ensure UI can update reactively

**Verification**:

```bash
npm run dev
# Navigate to Focus Mode
# Verify budget display appears
# Click regenerate → should show confirmation dialog
```

---

### Phase 4: Write Integration Tests (30 minutes)

1. Create `__tests__/integration/expansion-ux-flow.test.ts`
2. Test full user flow:
   - Generate adventure
   - View regeneration budget
   - Trigger confirmation dialog
   - Perform regeneration
   - Verify budget updates

**Verification**:

```bash
npm run test -- expansion-ux-flow.test.ts
# Should pass all 4 test cases
```

---

### Phase 5: Verify Coverage & Quality Gates (15 minutes)

```bash
npm run test:coverage
# Verify ≥90% coverage for new components

npm run lint
# Should have 0 errors/warnings

npm run build
# Should succeed
```

---

### Phase 6: Manual QA (15 minutes)

**Test Cases**:

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

## ✅ Definition of Done

- [ ] `RegenerationBudget` component implemented with all visual states
- [ ] `RegenerationConfirmDialog` component implemented with localStorage persistence
- [ ] Components integrated into Focus Mode UI
- [ ] Regenerate buttons respect budget limits (disable when 0)
- [ ] Unit tests written for both components (100% coverage)
- [ ] Integration test covers full user flow
- [ ] Manual QA checklist completed
- [ ] Test coverage ≥90%
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Production build succeeds
- [ ] PR created and merged to main

---

## 🔄 Rollback Plan

If issues arise in production:

1. **Immediate rollback** (revert commit):

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Component-level disable** (if partial rollback needed):
   - Remove `<RegenerationBudget />` from FocusModeLayout
   - Remove confirmation dialog logic from regenerate buttons
   - System reverts to previous UX (no budget display)

3. **Data integrity**: No database changes in this feature, so rollback is safe

---

## 📚 Related Documentation

- [NEXT_STEPS.md](../NEXT_STEPS.md) - Roadmap overview (Priority 2)
- [FEATURE_regeneration_limits_tracking.md](./FEATURE_regeneration_limits_tracking.md) - Dependency (must be completed first)
- [FOCUS_MODE.md](../../documentation/FOCUS_MODE.md) - Focus Mode architecture
- [TESTING_STRATEGY.md](../../documentation/TESTING_STRATEGY.md) - Testing patterns

---

**Created**: 2025-10-28
**Depends On**: FEATURE_regeneration_limits_tracking.md (P1)
**Blocks**: Phase 3 features (theme, dark mode)
**Estimated Completion**: 2.5 hours (one development session)
