# Feature: Free Expansion/Refinement with Regeneration Limits

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Fix Business Model
**Estimated Time**: 1 hour
**Dependencies**: FEATURE_regeneration_tracking_database.md

---

## Overview

Remove credit consumption from movement expansion and refinement. Instead, enforce regeneration limits (10 at Scaffold, 20 at Expansion). This aligns with SYSTEM_OVERVIEW.md's specification that regenerations are FREE but LIMITED.

---

## Acceptance Criteria

- [ ] `expandMovement()` does NOT consume credits
- [ ] `refineMovementContent()` does NOT consume credits
- [ ] Both functions check and enforce regeneration limits
- [ ] Regeneration counters increment after successful LLM calls
- [ ] Clear error messages when limits reached
- [ ] Integration tests verify limit enforcement
- [ ] All existing tests pass (with credit assertions updated)

---

## Technical Specification

### Code Changes

#### 1. Update `app/actions/movements.ts` - `expandMovement()`

**Remove credit consumption** (lines 75-86):

```typescript
// DELETE:
// Consume credit for expansion
try {
  await creditManager.consumeCredit(userId, 'expansion', {
    adventureId,
    movementId,
  })
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    return { success: false, error: 'Insufficient credits to expand movement' }
  }
  throw error
}
```

**Add regeneration limit check** (before LLM call):

```typescript
// Check expansion regeneration limit (20 max)
const { data: adventure } = await supabase
  .from('adventures')
  .select('expansion_regenerations_used')
  .eq('id', adventureId)
  .single()

if (!adventure) {
  return { success: false, error: 'Adventure not found' }
}

const EXPANSION_LIMIT = 20
if (adventure.expansion_regenerations_used >= EXPANSION_LIMIT) {
  return {
    success: false,
    error: `Expansion regeneration limit reached (${EXPANSION_LIMIT} maximum). Consider locking components you're satisfied with.`,
  }
}
```

**Increment counter after successful expansion** (after line 158):

```typescript
// Increment expansion regeneration counter
await supabase
  .from('adventures')
  .update({
    expansion_regenerations_used: adventure.expansion_regenerations_used + 1,
  })
  .eq('id', adventureId)
```

**Remove refund logic** (lines 169-181):

```typescript
// DELETE entire catch block refund section:
} catch (error) {
  // Refund credit if expansion failed after consumption
  if (userId) {
    try {
      await creditManager.refundCredit(userId, 'expansion', {
        adventureId,
        movementId,
        reason: 'Expansion failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch (refundError) {
      console.error('Failed to refund credit:', refundError)
    }
  }
```

**Replace with**:

```typescript
} catch (error) {
  // No refund needed since expansion is free
```

#### 2. Update `app/actions/movements.ts` - `refineMovementContent()`

**Remove credit consumption** (lines 240-252):

```typescript
// DELETE:
// Consume credit for refinement
try {
  await creditManager.consumeCredit(userId, 'expansion', {
    adventureId,
    movementId,
    refinementType: 'refine',
  })
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    return { success: false, error: 'Insufficient credits to refine content' }
  }
  throw error
}
```

**Add regeneration limit check** (before fetching adventure):

```typescript
// Check expansion regeneration limit (20 max)
// Note: Refinement counts toward expansion limit
const { data: adventureCheck } = await supabase
  .from('adventures')
  .select('expansion_regenerations_used')
  .eq('id', adventureId)
  .single()

if (!adventureCheck) {
  return { success: false, error: 'Adventure not found' }
}

const EXPANSION_LIMIT = 20
if (adventureCheck.expansion_regenerations_used >= EXPANSION_LIMIT) {
  return {
    success: false,
    error: `Refinement limit reached (${EXPANSION_LIMIT} maximum). Consider manual editing instead.`,
  }
}
```

**Increment counter after successful refinement** (after line 298):

```typescript
// Increment expansion regeneration counter
await supabase
  .from('adventures')
  .update({
    expansion_regenerations_used: adventureCheck.expansion_regenerations_used + 1,
  })
  .eq('id', adventureId)
```

**Remove refund logic** (lines 305-319):

```typescript
// DELETE refund section in catch block
```

---

## Testing Requirements

### Integration Tests

**File**: `tests/integration/regeneration-limits.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { expandMovement, refineMovementContent } from '@/app/actions/movements'
import { createTestSupabaseClient, cleanupTestData } from '../helpers/testDb'

describe('Regeneration Limits', () => {
  let supabase: ReturnType<typeof createTestSupabaseClient>
  let testUserId: string
  let adventureId: string
  let movementId: string

  beforeEach(async () => {
    supabase = createTestSupabaseClient()
    await cleanupTestData(supabase)

    // Create test user, adventure, and movement
    // ... setup code
  })

  describe('Expansion Regeneration Limits', () => {
    it('should allow expansion when under limit', async () => {
      // Set regeneration count to 19 (one below limit)
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 19 })
        .eq('id', adventureId)

      const result = await expandMovement(adventureId, movementId)

      expect(result.success).toBe(true)
    })

    it('should block expansion when at limit', async () => {
      // Set regeneration count to 20 (at limit)
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 20 })
        .eq('id', adventureId)

      const result = await expandMovement(adventureId, movementId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('limit reached')
      expect(result.error).toContain('20')
    })

    it('should increment counter after successful expansion', async () => {
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 5 })
        .eq('id', adventureId)

      await expandMovement(adventureId, movementId)

      const { data } = await supabase
        .from('adventures')
        .select('expansion_regenerations_used')
        .eq('id', adventureId)
        .single()

      expect(data!.expansion_regenerations_used).toBe(6)
    })

    it('should NOT consume credits for expansion', async () => {
      const { data: before } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', testUserId)
        .single()

      await expandMovement(adventureId, movementId)

      const { data: after } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', testUserId)
        .single()

      expect(after!.credits).toBe(before!.credits)
    })
  })

  describe('Refinement Regeneration Limits', () => {
    it('should allow refinement when under limit', async () => {
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 19 })
        .eq('id', adventureId)

      const result = await refineMovementContent(adventureId, movementId, 'Make it more dramatic')

      expect(result.success).toBe(true)
    })

    it('should block refinement when at limit', async () => {
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 20 })
        .eq('id', adventureId)

      const result = await refineMovementContent(adventureId, movementId, 'Make it more dramatic')

      expect(result.success).toBe(false)
      expect(result.error).toContain('limit reached')
    })

    it('should increment counter after successful refinement', async () => {
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 10 })
        .eq('id', adventureId)

      await refineMovementContent(adventureId, movementId, 'Make it more dramatic')

      const { data } = await supabase
        .from('adventures')
        .select('expansion_regenerations_used')
        .eq('id', adventureId)
        .single()

      expect(data!.expansion_regenerations_used).toBe(11)
    })

    it('should NOT consume credits for refinement', async () => {
      const { data: before } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', testUserId)
        .single()

      await refineMovementContent(adventureId, movementId, 'Make it more dramatic')

      const { data: after } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', testUserId)
        .single()

      expect(after!.credits).toBe(before!.credits)
    })
  })
})
```

### Update Existing Tests

**Files to update**:

- `tests/integration/adventures.test.ts` (if exists)
- Any tests that assert credit consumption on expansion

Remove or update assertions that expect credits to be consumed during expansion/refinement.

---

## Implementation Steps

1. **Verify dependency complete**
   - Ensure `FEATURE_regeneration_tracking_database.md` is implemented
   - Verify columns exist in database

2. **Update `expandMovement()` function**
   - Remove credit consumption
   - Add regeneration limit check
   - Increment counter after success
   - Remove refund logic

3. **Update `refineMovementContent()` function**
   - Remove credit consumption
   - Add regeneration limit check
   - Increment counter after success
   - Remove refund logic

4. **Write integration tests**
   - Create `tests/integration/regeneration-limits.test.ts`
   - Test limit enforcement
   - Test counter increment
   - Test no credit consumption

5. **Update existing tests**
   - Remove credit consumption assertions
   - Update any mocks related to credit checks

6. **Run all tests**
   - `npm run test:coverage`
   - Ensure ≥90% coverage maintained

7. **Manual verification**
   - Test expansion multiple times
   - Verify counter increments
   - Verify error at 20th regeneration

8. **Commit changes**
   - Message: "feat: make expansion/refinement free with 20 regeneration limit"

---

## Verification Checklist

- [ ] `expandMovement()` does not call `creditManager.consumeCredit()`
- [ ] `refineMovementContent()` does not call `creditManager.consumeCredit()`
- [ ] Both functions check `expansion_regenerations_used` before LLM call
- [ ] Both functions increment counter after success
- [ ] Error message includes limit value (20)
- [ ] Integration tests pass
- [ ] No credit consumption assertions fail
- [ ] TypeScript compiles without errors
- [ ] Linting passes

---

## Edge Cases

### Failed LLM Calls

**Question**: Should failed expansions count toward limit?

**Decision**: NO - only successful LLM calls increment counter. This is why we increment AFTER the LLM call succeeds, not before.

### Concurrent Requests

**Risk**: Two expansions at the same time might both pass limit check.

**Mitigation**: Database CHECK constraint prevents negative credits. Race condition could allow 21st regeneration, but this is acceptable risk for MVP. Future: Use row-level locking.

---

## Constants

Consider extracting limits to constants file:

**File**: `lib/constants/regeneration.ts`

```typescript
export const REGENERATION_LIMITS = {
  SCAFFOLD: 10,
  EXPANSION: 20,
} as const
```

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:53-86](../IMPLEMENTATION_GAP_ANALYSIS.md#L53-L86)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:141-146](../SYSTEM_OVERVIEW.md#L141-L146)
- **Current Implementation**: [app/actions/movements.ts](../../app/actions/movements.ts)

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-24
