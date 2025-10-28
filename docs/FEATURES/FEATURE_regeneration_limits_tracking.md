# Feature: Regeneration Limits Tracking

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: Priority 1 - Fix Credit Consumption Model
**Estimated Time**: 6-7 hours
**Dependencies**: None
**Blocks**: Focus Mode usability, Business model integrity

---

## Overview

Implement regeneration limit tracking to prevent infinite free content generation. Currently, users can regenerate content infinitely because there's no tracking or enforcement of limits. The business model specifies:

- **Initial generation**: 1 credit (already implemented correctly)
- **Scaffold regenerations**: FREE but limited to 10 per adventure
- **Expansion regenerations**: FREE but limited to 20 per adventure

This feature adds database tracking, removes incorrect credit consumption, and enforces limits.

---

## Problem Statement

### Current Behavior (BROKEN)

1. `expandMovement()` and `refineMovement()` consume credits (WRONG)
2. No regeneration counters tracked in database
3. Users can regenerate infinitely
4. Business model broken - users get unlimited free content

### Impact

- 🔴 **CRITICAL** - Business model undermined
- 🔴 **BLOCKER** - Focus Mode too expensive to use
- 🔴 **REVENUE LOSS** - Users can generate unlimited content with 1 credit

---

## Acceptance Criteria

### Database

- [ ] `adventures` table has `scaffold_regenerations_used` column (INT, DEFAULT 0)
- [ ] `adventures` table has `expansion_regenerations_used` column (INT, DEFAULT 0)
- [ ] Migration runs successfully on test database
- [ ] Indexes created for performance

### Server Actions

- [ ] `expandMovement()` does NOT consume credits
- [ ] `refineMovement()` does NOT consume credits
- [ ] `regenerateScaffold()` does NOT consume credits (if exists)
- [ ] All regeneration actions check limits before executing
- [ ] All regeneration actions increment appropriate counter
- [ ] Clear error messages when limits exceeded

### Business Logic

- [ ] `RegenerationLimitChecker` class created
- [ ] Scaffold limit: 10 regenerations max per adventure
- [ ] Expansion limit: 20 regenerations max per adventure
- [ ] Atomic counter increments (no race conditions)

### Testing

- [ ] Integration tests for limit enforcement (100% coverage)
- [ ] Unit tests for `RegenerationLimitChecker`
- [ ] Race condition tests (concurrent regenerations)
- [ ] Edge case: exactly at limit
- [ ] Edge case: attempt after limit exceeded

### UI (Minimal)

- [ ] Regeneration counters visible in Focus Mode
- [ ] Display format: "X/10 scaffold regens used" or "X/20 expansion regens used"
- [ ] Error toast when limit exceeded

---

## Technical Specification

### Phase 1: Database Migration

**File**: `supabase/migrations/XXXXX_add_regeneration_tracking.sql`

```sql
-- Add regeneration tracking columns to adventures table
ALTER TABLE adventures
ADD COLUMN scaffold_regenerations_used INT DEFAULT 0 CHECK (scaffold_regenerations_used >= 0),
ADD COLUMN expansion_regenerations_used INT DEFAULT 0 CHECK (expansion_regenerations_used >= 0);

-- Add index for performance
CREATE INDEX idx_adventures_regenerations
ON adventures(scaffold_regenerations_used, expansion_regenerations_used);

-- Add comment for documentation
COMMENT ON COLUMN adventures.scaffold_regenerations_used IS 'Number of scaffold regenerations used (max 10 per business model)';
COMMENT ON COLUMN adventures.expansion_regenerations_used IS 'Number of expansion regenerations used (max 20 per business model)';
```

### Phase 2: Regeneration Limit Checker

**File**: `lib/regeneration/limit-checker.ts` (NEW)

```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'

export const SCAFFOLD_REGENERATION_LIMIT = 10
export const EXPANSION_REGENERATION_LIMIT = 20

export class RegenerationLimitError extends Error {
  constructor(
    public limitType: 'scaffold' | 'expansion',
    public used: number,
    public limit: number,
  ) {
    super(`${limitType} regeneration limit exceeded: ${used}/${limit} used`)
    this.name = 'RegenerationLimitError'
  }
}

export class RegenerationLimitChecker {
  /**
   * Check if scaffold regeneration limit has been reached
   * @throws RegenerationLimitError if limit exceeded
   */
  async checkScaffoldLimit(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('adventures')
      .select('scaffold_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error || !data) {
      throw new Error('Failed to check scaffold regeneration limit')
    }

    if (data.scaffold_regenerations_used >= SCAFFOLD_REGENERATION_LIMIT) {
      throw new RegenerationLimitError(
        'scaffold',
        data.scaffold_regenerations_used,
        SCAFFOLD_REGENERATION_LIMIT,
      )
    }
  }

  /**
   * Check if expansion regeneration limit has been reached
   * @throws RegenerationLimitError if limit exceeded
   */
  async checkExpansionLimit(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('adventures')
      .select('expansion_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error || !data) {
      throw new Error('Failed to check expansion regeneration limit')
    }

    if (data.expansion_regenerations_used >= EXPANSION_REGENERATION_LIMIT) {
      throw new RegenerationLimitError(
        'expansion',
        data.expansion_regenerations_used,
        EXPANSION_REGENERATION_LIMIT,
      )
    }
  }

  /**
   * Increment scaffold regeneration counter (atomic)
   */
  async incrementScaffoldCount(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { error } = await supabase.rpc('increment_scaffold_regenerations', {
      adventure_id: adventureId,
    })

    if (error) {
      throw new Error('Failed to increment scaffold regeneration count')
    }
  }

  /**
   * Increment expansion regeneration counter (atomic)
   */
  async incrementExpansionCount(adventureId: string): Promise<void> {
    const supabase = await createServiceRoleClient()

    const { error } = await supabase.rpc('increment_expansion_regenerations', {
      adventure_id: adventureId,
    })

    if (error) {
      throw new Error('Failed to increment expansion regeneration count')
    }
  }

  /**
   * Get current regeneration counts for an adventure
   */
  async getRegenerationCounts(adventureId: string): Promise<{
    scaffold: number
    expansion: number
    scaffoldRemaining: number
    expansionRemaining: number
  }> {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('adventures')
      .select('scaffold_regenerations_used, expansion_regenerations_used')
      .eq('id', adventureId)
      .single()

    if (error || !data) {
      throw new Error('Failed to get regeneration counts')
    }

    return {
      scaffold: data.scaffold_regenerations_used,
      expansion: data.expansion_regenerations_used,
      scaffoldRemaining: SCAFFOLD_REGENERATION_LIMIT - data.scaffold_regenerations_used,
      expansionRemaining: EXPANSION_REGENERATION_LIMIT - data.expansion_regenerations_used,
    }
  }
}
```

**File**: `supabase/migrations/XXXXX_add_regeneration_rpc_functions.sql`

```sql
-- Atomic increment function for scaffold regenerations
CREATE OR REPLACE FUNCTION increment_scaffold_regenerations(adventure_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE adventures
  SET scaffold_regenerations_used = scaffold_regenerations_used + 1
  WHERE id = adventure_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic increment function for expansion regenerations
CREATE OR REPLACE FUNCTION increment_expansion_regenerations(adventure_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE adventures
  SET expansion_regenerations_used = expansion_regenerations_used + 1
  WHERE id = adventure_id;
END;
$$ LANGUAGE plpgsql;
```

### Phase 3: Update Server Actions

**File**: `app/actions/movements.ts`

**Changes to `expandMovement()` (lines 75-86):**

```typescript
// REMOVE THIS:
// try {
//   await creditManager.consumeCredit(userId, 'expansion', {
//     adventureId,
//     movementId,
//   })
// } catch (error) {
//   if (error instanceof InsufficientCreditsError) {
//     return { success: false, error: 'Insufficient credits to expand movement' }
//   }
//   throw error
// }

// ADD THIS:
import { RegenerationLimitChecker, RegenerationLimitError } from '@/lib/regeneration/limit-checker'

const limitChecker = new RegenerationLimitChecker()

// Check expansion regeneration limit
try {
  await limitChecker.checkExpansionLimit(adventureId)
} catch (error) {
  if (error instanceof RegenerationLimitError) {
    return {
      success: false,
      error: `Expansion regeneration limit reached (${error.used}/${error.limit}). You've used all your free regenerations for this adventure.`,
    }
  }
  throw error
}

// ... perform expansion ...

// Increment expansion counter after successful expansion
await limitChecker.incrementExpansionCount(adventureId)
```

**Changes to `refineMovement()` (lines 240-252):**

```typescript
// REMOVE THIS:
// try {
//   await creditManager.consumeCredit(userId, 'expansion', {
//     adventureId,
//     movementId,
//     refinementType: 'refine',
//   })
// }

// ADD THIS:
const limitChecker = new RegenerationLimitChecker()

// Check expansion regeneration limit (refinement counts as expansion)
try {
  await limitChecker.checkExpansionLimit(adventureId)
} catch (error) {
  if (error instanceof RegenerationLimitError) {
    return {
      success: false,
      error: `Expansion regeneration limit reached (${error.used}/${error.limit}). You've used all your free regenerations for this adventure.`,
    }
  }
  throw error
}

// ... perform refinement ...

// Increment expansion counter after successful refinement
await limitChecker.incrementExpansionCount(adventureId)
```

**File**: `app/actions/adventures.ts` (if scaffold regeneration exists)

Similar changes for `regenerateScaffold()` function using `checkScaffoldLimit()` and `incrementScaffoldCount()`.

### Phase 4: UI Component

**File**: `features/focus-mode/components/RegenerationCounter.tsx` (NEW)

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { getRegenerationCounts } from '@/app/actions/regeneration'

interface RegenerationCounterProps {
  adventureId: string
  stage: 'scaffold' | 'expansion'
}

export function RegenerationCounter({ adventureId, stage }: RegenerationCounterProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['regeneration-counts', adventureId],
    queryFn: () => getRegenerationCounts(adventureId),
    staleTime: 30 * 1000, // 30 seconds
  })

  if (isLoading || !data) {
    return null
  }

  const isScaffold = stage === 'scaffold'
  const used = isScaffold ? data.scaffold : data.expansion
  const remaining = isScaffold ? data.scaffoldRemaining : data.expansionRemaining
  const limit = isScaffold ? 10 : 20
  const isNearLimit = remaining <= 3
  const isAtLimit = remaining === 0

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isAtLimit ? 'destructive' : isNearLimit ? 'warning' : 'secondary'}>
        {used}/{limit} regenerations used
      </Badge>
      {remaining > 0 && (
        <span className="text-sm text-muted-foreground">{remaining} remaining</span>
      )}
      {isAtLimit && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You've reached your regeneration limit for this adventure. All {limit} regenerations
            have been used.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

**File**: `app/actions/regeneration.ts` (NEW)

```typescript
'use server'

import { RegenerationLimitChecker } from '@/lib/regeneration/limit-checker'

export async function getRegenerationCounts(adventureId: string) {
  const checker = new RegenerationLimitChecker()
  return await checker.getRegenerationCounts(adventureId)
}
```

---

## Testing Requirements

### Integration Tests

**File**: `__tests__/integration/regeneration-limits.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { RegenerationLimitChecker, RegenerationLimitError } from '@/lib/regeneration/limit-checker'

describe('Regeneration Limits (Integration - CRITICAL)', () => {
  let supabase: ReturnType<typeof createClient>
  let testAdventureId: string

  beforeEach(async () => {
    // Create test adventure with 0 regenerations used
    const { data } = await supabase
      .from('adventures')
      .insert({
        title: 'Test Adventure',
        scaffold_regenerations_used: 0,
        expansion_regenerations_used: 0,
      })
      .select('id')
      .single()

    testAdventureId = data.id
  })

  afterEach(async () => {
    // Clean up
    await supabase.from('adventures').delete().eq('id', testAdventureId)
  })

  describe('Scaffold Regeneration Limits', () => {
    it('should allow regeneration when under limit', async () => {
      const checker = new RegenerationLimitChecker()

      // Should not throw
      await expect(checker.checkScaffoldLimit(testAdventureId)).resolves.not.toThrow()
    })

    it('should block regeneration when at limit (10)', async () => {
      // Set to limit
      await supabase
        .from('adventures')
        .update({ scaffold_regenerations_used: 10 })
        .eq('id', testAdventureId)

      const checker = new RegenerationLimitChecker()

      await expect(checker.checkScaffoldLimit(testAdventureId)).rejects.toThrow(
        RegenerationLimitError,
      )
    })

    it('should increment scaffold counter atomically', async () => {
      const checker = new RegenerationLimitChecker()

      await checker.incrementScaffoldCount(testAdventureId)

      const { data } = await supabase
        .from('adventures')
        .select('scaffold_regenerations_used')
        .eq('id', testAdventureId)
        .single()

      expect(data.scaffold_regenerations_used).toBe(1)
    })

    it('should handle concurrent increments correctly (race condition)', async () => {
      const checker = new RegenerationLimitChecker()

      // Simulate 5 concurrent increments
      await Promise.all([
        checker.incrementScaffoldCount(testAdventureId),
        checker.incrementScaffoldCount(testAdventureId),
        checker.incrementScaffoldCount(testAdventureId),
        checker.incrementScaffoldCount(testAdventureId),
        checker.incrementScaffoldCount(testAdventureId),
      ])

      const { data } = await supabase
        .from('adventures')
        .select('scaffold_regenerations_used')
        .eq('id', testAdventureId)
        .single()

      // Should be exactly 5, not less (proves atomicity)
      expect(data.scaffold_regenerations_used).toBe(5)
    })
  })

  describe('Expansion Regeneration Limits', () => {
    it('should allow regeneration when under limit', async () => {
      const checker = new RegenerationLimitChecker()

      await expect(checker.checkExpansionLimit(testAdventureId)).resolves.not.toThrow()
    })

    it('should block regeneration when at limit (20)', async () => {
      await supabase
        .from('adventures')
        .update({ expansion_regenerations_used: 20 })
        .eq('id', testAdventureId)

      const checker = new RegenerationLimitChecker()

      await expect(checker.checkExpansionLimit(testAdventureId)).rejects.toThrow(
        RegenerationLimitError,
      )
    })

    it('should increment expansion counter atomically', async () => {
      const checker = new RegenerationLimitChecker()

      await checker.incrementExpansionCount(testAdventureId)

      const { data } = await supabase
        .from('adventures')
        .select('expansion_regenerations_used')
        .eq('id', testAdventureId)
        .single()

      expect(data.expansion_regenerations_used).toBe(1)
    })
  })

  describe('getRegenerationCounts', () => {
    it('should return correct counts and remaining', async () => {
      await supabase
        .from('adventures')
        .update({
          scaffold_regenerations_used: 3,
          expansion_regenerations_used: 15,
        })
        .eq('id', testAdventureId)

      const checker = new RegenerationLimitChecker()
      const counts = await checker.getRegenerationCounts(testAdventureId)

      expect(counts.scaffold).toBe(3)
      expect(counts.expansion).toBe(15)
      expect(counts.scaffoldRemaining).toBe(7)
      expect(counts.expansionRemaining).toBe(5)
    })
  })
})
```

### Unit Tests

**File**: `__tests__/unit/lib/regeneration/limit-checker.test.ts` (NEW)

```typescript
import { describe, it, expect, vi } from 'vitest'
import {
  RegenerationLimitError,
  SCAFFOLD_REGENERATION_LIMIT,
  EXPANSION_REGENERATION_LIMIT,
} from '@/lib/regeneration/limit-checker'

describe('RegenerationLimitError', () => {
  it('should create error with correct properties', () => {
    const error = new RegenerationLimitError('scaffold', 10, SCAFFOLD_REGENERATION_LIMIT)

    expect(error.name).toBe('RegenerationLimitError')
    expect(error.limitType).toBe('scaffold')
    expect(error.used).toBe(10)
    expect(error.limit).toBe(SCAFFOLD_REGENERATION_LIMIT)
    expect(error.message).toContain('scaffold')
    expect(error.message).toContain('10')
  })
})

describe('Constants', () => {
  it('should have correct scaffold limit', () => {
    expect(SCAFFOLD_REGENERATION_LIMIT).toBe(10)
  })

  it('should have correct expansion limit', () => {
    expect(EXPANSION_REGENERATION_LIMIT).toBe(20)
  })
})
```

---

## Implementation Steps

### Step 1: Database Migration (30 minutes)

1. Create migration file: `npx supabase migration new add_regeneration_tracking`
2. Add columns and indexes (SQL from Phase 1)
3. Create RPC functions (SQL from Phase 2)
4. Test migration: `npx supabase db reset` (on test database)
5. Verify columns exist: `npx supabase db diff`

### Step 2: Regeneration Limit Checker (2 hours)

1. Create `lib/regeneration/limit-checker.ts`
2. Implement `RegenerationLimitChecker` class
3. Write unit tests for constants and error class
4. Run tests: `npm run test:watch`

### Step 3: Update Server Actions (1.5 hours)

1. Update `app/actions/movements.ts`:
   - Remove credit consumption from `expandMovement()`
   - Remove credit consumption from `refineMovement()`
   - Add limit checks and counter increments
2. Update `app/actions/adventures.ts` (if scaffold regeneration exists)
3. Run type check: `npx tsc --noEmit`

### Step 4: Integration Tests (2 hours)

1. Create `__tests__/integration/regeneration-limits.test.ts`
2. Write all test cases (see Testing Requirements)
3. Run tests: `npm test -- __tests__/integration/regeneration-limits.test.ts`
4. Verify 100% coverage: `npm run test:coverage`

### Step 5: UI Component (1 hour)

1. Create `features/focus-mode/components/RegenerationCounter.tsx`
2. Create `app/actions/regeneration.ts`
3. Integrate counter into Focus Mode UI
4. Test manually in dev: `npm run dev`

### Step 6: Validation (30 minutes)

1. Run full test suite: `npm test`
2. Run linting: `npm run lint`
3. Run type check: `npx tsc --noEmit`
4. Build: `npm run build`
5. Manual QA: Test regeneration limits in UI

---

## Verification Checklist

### Database

- [ ] Migration runs without errors
- [ ] Columns have correct types and defaults
- [ ] Indexes created successfully
- [ ] RPC functions work correctly

### Code Quality

- [ ] All tests pass (592+ tests)
- [ ] Coverage ≥90% overall, 100% for regeneration code
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Production build succeeds

### Functionality

- [ ] expandMovement() does not consume credits
- [ ] refineMovement() does not consume credits
- [ ] Scaffold limit enforced (10 max)
- [ ] Expansion limit enforced (20 max)
- [ ] Clear error messages when limit exceeded
- [ ] Counters increment correctly
- [ ] No race conditions in concurrent requests

### User Experience

- [ ] Regeneration counter visible in Focus Mode
- [ ] Counter updates after each regeneration
- [ ] Warning shown when approaching limit
- [ ] Clear error when limit exceeded
- [ ] No confusion about remaining regenerations

---

## Rollback Plan

If issues arise:

1. **Code Issues**: Revert commit

   ```bash
   git revert HEAD
   ```

2. **Database Issues**: Rollback migration

   ```bash
   npx supabase db reset
   # Or manually:
   ALTER TABLE adventures DROP COLUMN scaffold_regenerations_used;
   ALTER TABLE adventures DROP COLUMN expansion_regenerations_used;
   ```

3. **Partial Deployment**: Feature flag (future enhancement)

---

## Success Metrics

### Business Model Health

- ✅ Expansions/refinements consume 0 credits (was consuming 1 each)
- ✅ Scaffold regenerations limited to 10 per adventure
- ✅ Expansion regenerations limited to 20 per adventure
- ✅ No infinite free content generation

### User Experience

- ✅ Users understand regeneration budget
- ✅ Clear feedback on remaining regenerations
- ✅ Focus Mode usable without fear of credit loss

### Technical Quality

- ✅ 100% test coverage for regeneration code
- ✅ No race conditions
- ✅ Atomic counter increments
- ✅ All quality gates pass

---

## Notes

### Design Decisions

**Q: Why separate scaffold and expansion counters?**
A: Different limits (10 vs 20) and different stages of workflow.

**Q: Why use RPC functions for increments?**
A: Ensures atomicity and prevents race conditions in concurrent requests.

**Q: Why check limit before incrementing?**
A: Better UX - fail fast with clear error before doing expensive LLM generation.

**Q: Why 100% test coverage requirement?**
A: Security-critical business logic that directly affects revenue.

### Future Enhancements (Not in Scope)

- Purchase additional regenerations (requires Stripe integration)
- Different limits per user tier (requires subscription system)
- Regeneration history/audit log
- Analytics on regeneration usage patterns

---

**Created**: 2025-10-28
**Last Updated**: 2025-10-28
**Execute with**: `/execute-feature docs/FEATURES/FEATURE_regeneration_limits_tracking.md`
