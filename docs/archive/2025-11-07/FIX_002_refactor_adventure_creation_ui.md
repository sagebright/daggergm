# FIX-002: Refactor Adventure Creation UI to Single-Screen Form

## Status: PENDING

**Priority:** HIGH
**Created:** 2025-10-29
**Estimated Time:** 90 minutes

---

## Problem Statement

The current adventure creation flow uses a multi-step wizard with separate screens for each choice (length, motif). This creates unnecessary friction and makes it harder to see all options at once. Additionally, the flow is missing critical inputs (party size, party tier, number of scenes).

**Current State:** Multi-step wizard with 2 screens (length, motif)
**Desired State:** Single-screen form with all inputs visible (motif, party size, party tier, scenes)

---

## User Flow to Implement

### **Adventure Creation Form (Single Screen)**

```
Prerequisites:
- User is logged in
- User is on /adventures/new page
- User has at least 1 credit available

Current Single-Screen Form:
┌─────────────────────────────────────────────────┐
│ Create Your Adventure                           │
│ Credit Balance: 5 credits                       │
│                                                  │
│ Adventure Generation Cost: 1 credit             │
├─────────────────────────────────────────────────┤
│                                                  │
│ Primary Motif *                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ High Fantasy                          ▼     ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ Party Size *                                    │
│ ┌─────────────────────────────────────────────┐│
│ │ 4                                     ▼     ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ Party Tier *                                    │
│ ┌─────────────────────────────────────────────┐│
│ │ Tier 1 [Level 1]                     ▼     ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ Number of Scenes *                              │
│ ┌─────────────────────────────────────────────┐│
│ │ 3                                     ▼     ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│            [Generate Adventure]                 │
└─────────────────────────────────────────────────┘

User Flow:
1. User is on /dashboard
2. User clicks "Generate New Adventure" button
3. User is redirected to /adventures/new
4. User sees single-screen form with all inputs
5. User selects "Primary Motif" from dropdown
   - Options: High Fantasy, Low Fantasy, Sword & Sorcery, Grimdark, Weird
6. User selects "Party Size" from dropdown
   - Options: 1, 2, 3, 4, 5+
7. User selects "Party Tier" from dropdown
   - Options: Tier 1 [Level 1], Tier 2 [Levels 2-4], Tier 3 [Levels 5-7], Tier 4 [Levels 8-10]
8. User selects "Number of Scenes" from dropdown
   - Options: 3, 4, 5
9. User clicks "Generate Adventure" button
10. Form validates all fields are selected
11. Credit is consumed (consume_credit function called)
12. User sees loading state: "Generating your adventure..."
13. [Backend: LLM generates high-level scene descriptions]
14. User is redirected to /adventures/[id] (Scene Approval stage)

Expected Outcomes:
✓ All inputs visible on one screen
✓ Dropdowns replace multi-step wizard
✓ Form validates before submission
✓ Credit consumed only if validation passes
✓ Loading state shown during generation
✓ User redirected to scene approval after generation
```

---

## Acceptance Criteria

### Must Have:

- [ ] Remove multi-step wizard (`currentStep`, `ADVENTURE_STEPS` removed)
- [ ] Replace with single-screen form using shadcn/ui components
- [ ] Add "Primary Motif" dropdown with 5 options
- [ ] Add "Party Size" dropdown (1, 2, 3, 4, 5+)
- [ ] Add "Party Tier" dropdown (Tier 1-4 with level ranges)
- [ ] Add "Number of Scenes" dropdown (3, 4, 5)
- [ ] All fields are required and validated before submission
- [ ] Form submission calls `generateAdventure` Server Action
- [ ] Loading state shown during generation
- [ ] User redirected to `/adventures/[id]` after success
- [ ] Credit cost displayed prominently (1 credit)
- [ ] Credit balance shown for authenticated users

### Should Have:

- [ ] Form uses shadcn/ui Select components for dropdowns
- [ ] Form layout is responsive (mobile-friendly)
- [ ] Validation errors shown inline for empty fields
- [ ] "Generate Adventure" button disabled during generation
- [ ] Proper accessibility (labels, ARIA attributes)

### Nice to Have:

- [ ] Tooltip explaining what each tier level range means
- [ ] Visual preview of selected motif (icon/image)
- [ ] Save form state to localStorage (resume later)
- [ ] "Back to Dashboard" link in header

---

## Technical Implementation

### Files to Modify:

#### 1. **app/adventures/new/page.tsx** (Major Refactor)

**Remove:**

- `ADVENTURE_STEPS` constant
- `currentStep` state
- `handleSelection` function
- `handleBack` function
- Multi-step progress bar UI
- Step-by-step card rendering

**Add:**

- Form state: `motif`, `partySize`, `partyTier`, `numScenes`
- Form validation before submission
- shadcn/ui Select components for dropdowns
- Single-screen form layout

**Example Structure:**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { generateAdventure, type AdventureConfig } from '@/app/actions/adventures'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditBalance } from '@/components/features/credits/CreditBalance'
import { CreditCost } from '@/components/features/credits/CreditCost'

type FormData = {
  motif: string
  partySize: string
  partyTier: string
  numScenes: string
}

export default function NewAdventurePage() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    motif: '',
    partySize: '4', // Default to 4
    partyTier: 'tier1', // Default to Tier 1
    numScenes: '3', // Default to 3 scenes
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    if (!formData.motif || !formData.partySize || !formData.partyTier || !formData.numScenes) {
      toast.error('Please fill in all fields')
      return
    }

    setGenerating(true)

    try {
      toast.info('Generating your adventure...', { duration: 2000 })

      const adventureConfig: AdventureConfig = {
        length: 'oneshot', // Fixed for now
        primary_motif: formData.motif,
        frame: 'witherwild', // Default frame
        party_size: parseInt(formData.partySize),
        party_level: getTierLevel(formData.partyTier), // Helper function
        difficulty: 'standard',
        stakes: 'personal',
        num_scenes: parseInt(formData.numScenes), // NEW FIELD
      }

      const result = await generateAdventure(adventureConfig)

      if (result.success) {
        toast.success('Adventure created successfully!')
        router.replace(`/adventures/${result.adventureId}`)
        return
      } else {
        toast.error('error' in result ? result.error : 'Failed to generate adventure')
        setGenerating(false)
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  const getTierLevel = (tier: string): number => {
    switch (tier) {
      case 'tier1': return 1
      case 'tier2': return 3 // Mid-range of 2-4
      case 'tier3': return 6 // Mid-range of 5-7
      case 'tier4': return 9 // Mid-range of 8-10
      default: return 1
    }
  }

  if (generating) {
    return (
      <div className="container max-w-2xl mx-auto py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold">Generating Your Adventure</h2>
              <p className="text-muted-foreground">
                Our AI is crafting your perfect Daggerheart adventure...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create Your Adventure</h1>
        <CreditBalance variant="compact" />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Adventure Generation Cost</p>
              <p className="text-xs text-muted-foreground mt-1">
                Each adventure costs 1 credit to generate
              </p>
            </div>
            <CreditCost action="generate this adventure" cost={1} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adventure Details</CardTitle>
          <CardDescription>
            Configure your adventure settings below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Motif */}
            <div className="space-y-2">
              <Label htmlFor="motif">Primary Motif *</Label>
              <Select
                value={formData.motif}
                onValueChange={(value) => setFormData({ ...formData, motif: value })}
              >
                <SelectTrigger id="motif">
                  <SelectValue placeholder="Select a motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_fantasy">High Fantasy</SelectItem>
                  <SelectItem value="low_fantasy">Low Fantasy</SelectItem>
                  <SelectItem value="sword_sorcery">Sword & Sorcery</SelectItem>
                  <SelectItem value="grimdark">Grimdark</SelectItem>
                  <SelectItem value="weird">Weird</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Party Size */}
            <div className="space-y-2">
              <Label htmlFor="partySize">Party Size *</Label>
              <Select
                value={formData.partySize}
                onValueChange={(value) => setFormData({ ...formData, partySize: value })}
              >
                <SelectTrigger id="partySize">
                  <SelectValue placeholder="Select party size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Player</SelectItem>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="5">5+ Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Party Tier */}
            <div className="space-y-2">
              <Label htmlFor="partyTier">Party Tier *</Label>
              <Select
                value={formData.partyTier}
                onValueChange={(value) => setFormData({ ...formData, partyTier: value })}
              >
                <SelectTrigger id="partyTier">
                  <SelectValue placeholder="Select party tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Tier 1 [Level 1]</SelectItem>
                  <SelectItem value="tier2">Tier 2 [Levels 2-4]</SelectItem>
                  <SelectItem value="tier3">Tier 3 [Levels 5-7]</SelectItem>
                  <SelectItem value="tier4">Tier 4 [Levels 8-10]</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Scenes */}
            <div className="space-y-2">
              <Label htmlFor="numScenes">Number of Scenes *</Label>
              <Select
                value={formData.numScenes}
                onValueChange={(value) => setFormData({ ...formData, numScenes: value })}
              >
                <SelectTrigger id="numScenes">
                  <SelectValue placeholder="Select number of scenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Scenes</SelectItem>
                  <SelectItem value="4">4 Scenes</SelectItem>
                  <SelectItem value="5">5 Scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Adventure'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2. **app/actions/adventures.ts** (Update Type)

Update `AdventureConfig` type to include `num_scenes`:

```typescript
export type AdventureConfig = {
  length: string
  primary_motif: string
  frame: string
  party_size: number
  party_level: number
  difficulty: string
  stakes: string
  num_scenes?: number // NEW FIELD
  guestEmail?: string
}
```

---

## Dependencies

### Required:

- shadcn/ui Select component already installed
- No new dependencies needed

### May Need:

- Update `generateAdventure` Server Action to handle `num_scenes` parameter
- Update LLM prompt generation to use `num_scenes` value

---

## Testing Checklist

### Manual Testing:

- [ ] Form renders correctly with all dropdowns
- [ ] All dropdowns have correct options
- [ ] Default values are pre-selected
- [ ] Form validation prevents submission with empty fields
- [ ] Form submission shows loading state
- [ ] Credit is consumed on successful generation
- [ ] User redirected to adventure detail page after generation
- [ ] Form is responsive on mobile devices
- [ ] Keyboard navigation works for all dropdowns

### Unit Testing (Optional):

- [ ] Form validation logic tested
- [ ] Form submission calls correct Server Action
- [ ] Loading state toggles correctly

---

## Rollback Plan

If this refactor causes issues:

1. Revert commit: `git revert <commit-hash>`
2. Previous multi-step wizard will be restored
3. Investigate issues before re-attempting

---

## Related Files

- `app/adventures/new/page.tsx` - Main file to refactor
- `app/actions/adventures.ts` - Update type definition
- `components/ui/select.tsx` - shadcn/ui component (already exists)

---

## Notes

- This is a UI-only refactor - backend logic remains the same
- Guest user flow should still work (remove guest-specific code if no longer needed)
- Consider removing "Adventure Length" field if it's always "oneshot"
- Future enhancement: Add tooltip/help text for each field

---

## Definition of Done

- [ ] Multi-step wizard removed
- [ ] Single-screen form implemented with all 4 dropdowns
- [ ] Form validation works correctly
- [ ] Credit consumption works
- [ ] User redirected after successful generation
- [ ] Form is responsive and accessible
- [ ] Manual testing completed
- [ ] Code reviewed and merged to main branch
