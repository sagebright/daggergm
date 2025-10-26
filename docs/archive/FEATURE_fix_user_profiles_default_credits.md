# Feature: Fix user_profiles Default Credits

**Status**: Not Started
**Priority**: 🟡 High
**Phase**: 1 - Fix Business Model
**Estimated Time**: 20 minutes
**Dependencies**: None

---

## Overview

Update `user_profiles` table to have `credits DEFAULT 0` instead of `DEFAULT 1`. Per SYSTEM_OVERVIEW.md, MVP has no free credits - all users start with 0 credits and must purchase.

---

## Acceptance Criteria

- [ ] Migration changes `credits` column default from 1 to 0
- [ ] New users created after migration have 0 credits
- [ ] Existing users' credit balances unchanged (keep their existing values)
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Integration test verifies new users get 0 credits
- [ ] TypeScript types regenerated (no type changes expected)

---

## Technical Specification

### Database Migration

**File**: `supabase/migrations/00007_fix_user_profiles_default_credits.sql`

```sql
-- Change default value for credits column from 1 to 0
-- This only affects NEW users created after migration
-- Existing users keep their current credit balance

ALTER TABLE user_profiles
  ALTER COLUMN credits SET DEFAULT 0;

-- Add comment explaining the change
COMMENT ON COLUMN user_profiles.credits IS 'Credit balance (starts at 0, must purchase credits to generate adventures)';
```

**Note**: We do NOT update existing rows. If you want to reset existing users to 0 credits:

```sql
-- OPTIONAL: Reset all existing users to 0 credits (use with caution!)
-- UPDATE user_profiles SET credits = 0 WHERE credits = 1;
```

This is left as a **manual decision** - do not include in automated migration without product owner approval.

---

## Testing Requirements

### Integration Test

**File**: `tests/integration/user-profiles.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestSupabaseClient, cleanupTestData } from '../helpers/testDb'

describe('User Profiles - Default Credits', () => {
  let supabase: ReturnType<typeof createTestSupabaseClient>

  beforeEach(async () => {
    supabase = createTestSupabaseClient()
    await cleanupTestData(supabase)
  })

  it('should create new user with 0 credits by default', async () => {
    // Create a test user via auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'testuser@example.com',
      password: 'testpassword123',
    })

    expect(authError).toBeNull()
    expect(authData.user).not.toBeNull()

    // User profile should be auto-created by trigger with 0 credits
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', authData.user!.id)
      .single()

    expect(profileError).toBeNull()
    expect(profile!.credits).toBe(0)
  })

  it('should allow manually inserting user profile with 0 credits', async () => {
    // This test verifies the DEFAULT works for direct inserts
    const testUserId = crypto.randomUUID()

    // Create user in auth.users first (using service role)
    // Then insert profile without specifying credits
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'directinsert@example.com',
        // credits intentionally omitted - should use DEFAULT 0
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.credits).toBe(0)
  })

  it('should allow creating user with purchased credits', async () => {
    const testUserId = crypto.randomUUID()

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'paiduser@example.com',
        credits: 5, // Explicitly set credits
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.credits).toBe(5)
  })
})
```

---

## Implementation Steps

1. **Create migration file**
   - Add SQL to change DEFAULT value
   - Add comment documenting behavior

2. **Run migration locally**
   - `npm run db:migrate`
   - Verify no errors

3. **Check existing data**
   - Query: `SELECT credits, COUNT(*) FROM user_profiles GROUP BY credits;`
   - Document how many users have 1 credit (for product decision)

4. **Regenerate types** (no changes expected)
   - `npm run db:types`

5. **Write integration test**
   - Create `tests/integration/user-profiles.test.ts`
   - Test default value for new users

6. **Run tests**
   - `npm run test:coverage`
   - Ensure all pass

7. **Document decision on existing users**
   - Update migration file with comment about manual reset option
   - Get product owner approval before resetting

8. **Commit changes**
   - Message: "fix: change user_profiles credits default from 1 to 0"

---

## Verification Checklist

- [ ] Migration file created
- [ ] Migration runs without errors
- [ ] New users get 0 credits (verified in test)
- [ ] Existing users' credits unchanged
- [ ] Integration test passes
- [ ] Types regenerated
- [ ] No TypeScript errors
- [ ] Linting passes

---

## Product Decision Required

**Question**: Should we reset existing users' credits from 1 to 0?

**Options**:

1. **Keep existing credits** (recommended)
   - Users who signed up before this fix keep their 1 free credit
   - Minimal disruption
   - Cost: ~1 adventure per existing user

2. **Reset all to 0**
   - Consistent with "no free credits" policy
   - May frustrate early adopters
   - SQL: `UPDATE user_profiles SET credits = 0 WHERE credits = 1;`

**Recommendation**: Keep existing credits for early adopters as a "thank you" for testing.

---

## Rollback Plan

If issues arise:

```sql
-- Rollback to DEFAULT 1
ALTER TABLE user_profiles
  ALTER COLUMN credits SET DEFAULT 1;
```

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:31-47](../IMPLEMENTATION_GAP_ANALYSIS.md#L31-L47)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:135-139](../SYSTEM_OVERVIEW.md#L135-L139)
- **Current Schema**: [supabase/migrations/00001_initial_schema.sql:7-14](../../supabase/migrations/00001_initial_schema.sql#L7-L14)

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-24
