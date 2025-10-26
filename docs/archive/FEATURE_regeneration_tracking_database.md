# Feature: Regeneration Tracking Database Schema

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Fix Business Model
**Estimated Time**: 30 minutes
**Dependencies**: None

---

## Overview

Add database columns to track regeneration usage per adventure. This enables enforcement of the 10 scaffold / 20 expansion regeneration limits specified in SYSTEM_OVERVIEW.md.

---

## Acceptance Criteria

- [ ] Migration adds `scaffold_regenerations_used` column to `adventures` table
- [ ] Migration adds `expansion_regenerations_used` column to `adventures` table
- [ ] Both columns default to 0
- [ ] Both columns have CHECK constraint `>= 0`
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] TypeScript types regenerated from schema
- [ ] Integration test verifies columns exist and defaults work

---

## Technical Specification

### Database Migration

**File**: `supabase/migrations/00006_add_regeneration_tracking.sql`

```sql
-- Add regeneration tracking columns to adventures table
ALTER TABLE adventures
  ADD COLUMN IF NOT EXISTS scaffold_regenerations_used INT DEFAULT 0 CHECK (scaffold_regenerations_used >= 0),
  ADD COLUMN IF NOT EXISTS expansion_regenerations_used INT DEFAULT 0 CHECK (expansion_regenerations_used >= 0);

-- Add comment for documentation
COMMENT ON COLUMN adventures.scaffold_regenerations_used IS 'Count of regenerations used during Scaffold stage (max 10)';
COMMENT ON COLUMN adventures.expansion_regenerations_used IS 'Count of regenerations used during Expansion stage (max 20)';
```

### TypeScript Types

After migration, regenerate types:

```bash
npm run db:types
```

Expected addition to `Database['public']['Tables']['adventures']`:

```typescript
scaffold_regenerations_used: number
expansion_regenerations_used: number
```

---

## Testing Requirements

### Integration Test

**File**: `tests/integration/regeneration-tracking.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestSupabaseClient, cleanupTestData } from '../helpers/testDb'

describe('Regeneration Tracking Schema', () => {
  let supabase: ReturnType<typeof createTestSupabaseClient>
  let testUserId: string

  beforeEach(async () => {
    supabase = createTestSupabaseClient()
    await cleanupTestData(supabase)
    // Create test user and get ID
    testUserId = '...' // from test setup
  })

  it('should have scaffold_regenerations_used column with default 0', async () => {
    const { data, error } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.scaffold_regenerations_used).toBe(0)
  })

  it('should have expansion_regenerations_used column with default 0', async () => {
    const { data, error } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.expansion_regenerations_used).toBe(0)
  })

  it('should enforce non-negative constraint on scaffold_regenerations_used', async () => {
    const { data } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    const { error } = await supabase
      .from('adventures')
      .update({ scaffold_regenerations_used: -1 })
      .eq('id', data!.id)

    expect(error).not.toBeNull()
    expect(error?.message).toContain('constraint')
  })

  it('should allow incrementing regeneration counters', async () => {
    const { data: adventure } = await supabase
      .from('adventures')
      .insert({
        user_id: testUserId,
        title: 'Test Adventure',
        frame: 'witherwild',
        focus: 'mystery',
        config: {},
        movements: [],
      })
      .select()
      .single()

    const { error } = await supabase
      .from('adventures')
      .update({
        scaffold_regenerations_used: 5,
        expansion_regenerations_used: 12,
      })
      .eq('id', adventure!.id)

    expect(error).toBeNull()

    const { data: updated } = await supabase
      .from('adventures')
      .select()
      .eq('id', adventure!.id)
      .single()

    expect(updated!.scaffold_regenerations_used).toBe(5)
    expect(updated!.expansion_regenerations_used).toBe(12)
  })
})
```

---

## Implementation Steps

1. **Create migration file** with SQL above
2. **Run migration locally**: `npm run db:migrate`
3. **Regenerate TypeScript types**: `npm run db:types`
4. **Verify types updated** in `types/database.generated.ts`
5. **Write integration test** as specified above
6. **Run tests**: `npm run test:coverage`
7. **Commit changes** with message: "feat: add regeneration tracking columns to adventures table"

---

## Verification Checklist

- [ ] Migration file created at correct path
- [ ] Migration runs without errors locally
- [ ] Types regenerated and include new columns
- [ ] Integration test written and passes
- [ ] Test coverage ≥ 90% maintained
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:282-287](../IMPLEMENTATION_GAP_ANALYSIS.md#L282-L287)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:141-146](../SYSTEM_OVERVIEW.md#L141-L146)
- **Existing Migrations**: [supabase/migrations/](../../supabase/migrations/)

---

## Rollback Plan

If issues arise:

```sql
-- Rollback migration
ALTER TABLE adventures
  DROP COLUMN IF EXISTS scaffold_regenerations_used,
  DROP COLUMN IF EXISTS expansion_regenerations_used;
```

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-24
