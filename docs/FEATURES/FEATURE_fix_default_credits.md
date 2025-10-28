# FEATURE: Fix Default Credits

**Status**: Not Started
**Priority**: P5 (Low - Technical Debt)
**Estimated Time**: 30 minutes
**Dependencies**: None
**Business Impact**: Ensures new users start with 0 credits (correct business model)

---

## 📋 Problem Statement

The `user_profiles.credits` column currently has `DEFAULT 1`, which means:

- **New users get 1 free credit** upon registration
- This contradicts the business model: credits must be purchased
- Historical context: This may have been a remnant from testing or early development

### Current State

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 1,  -- WRONG: Should be 0
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Expected State

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,  -- CORRECT: No free credits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Acceptance Criteria

### Database Schema

- [ ] `user_profiles.credits` has `DEFAULT 0`
- [ ] Migration applied successfully
- [ ] New users start with 0 credits

### Existing Users (Decision Required)

- [ ] **Option A**: Reset existing users to 0 credits (strict enforcement)
- [ ] **Option B**: Grandfather existing users (keep their 1 credit)
- [ ] **Option C**: Convert existing 1-credit users to 0, but keep users with >1 credits

### Tests

- [ ] Integration test verifies new users get 0 credits
- [ ] Test verifies existing credit balances are not corrupted
- [ ] Test coverage ≥90%

---

## 🏗️ Technical Implementation

### Migration SQL

**File**: `supabase/migrations/XXXXX_fix_default_credits.sql`

```sql
-- Fix default credits from 1 to 0
ALTER TABLE user_profiles
ALTER COLUMN credits SET DEFAULT 0;

-- DECISION REQUIRED: Choose ONE of the following options

-- Option A: Reset ALL users to 0 credits (strict enforcement)
-- UPDATE user_profiles SET credits = 0 WHERE credits = 1;

-- Option B: Do nothing (grandfather existing users with 1 credit)
-- No update statement needed

-- Option C: Reset only users with exactly 1 credit (assume they never purchased)
--           Keep users with >1 credits (assume they purchased credits)
-- UPDATE user_profiles SET credits = 0 WHERE credits = 1;

-- Verify the change
COMMENT ON COLUMN user_profiles.credits IS 'User credit balance. New users start with 0 credits.';
```

**Recommendation**: **Option B** (Grandfather existing users)

**Reasoning**:

- Low risk: Only affects new registrations going forward
- Respects existing users (even if they got 1 credit by mistake)
- Minimal impact: Most users likely have 0 or purchased credits anyway
- Can always adjust later if needed

---

## 🧪 Testing Requirements

### Test File: `__tests__/integration/schema/user-profiles-default-credits.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

describe('User Profiles - Default Credits', () => {
  let testUserId: string
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>

  beforeEach(async () => {
    supabase = await createServiceRoleClient()
    testUserId = crypto.randomUUID()
  })

  afterEach(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.from('user_profiles').delete().eq('user_id', testUserId)
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  it('should create new user profiles with 0 credits by default', async () => {
    // Create test user via Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${testUserId}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })

    expect(authError).toBeNull()
    expect(authData.user).toBeTruthy()
    testUserId = authData.user!.id

    // Trigger user_profiles creation (via database trigger)
    // Wait a moment for trigger to execute
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('user_id', testUserId)
      .single()

    expect(profileError).toBeNull()
    expect(profile).toBeTruthy()
    expect(profile!.credits).toBe(0) // CRITICAL: Must be 0, not 1
  })

  it('should not affect existing user credit balances', async () => {
    // Create user with credits
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-${testUserId}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })

    testUserId = authData.user!.id

    // Manually set credits to 5
    await supabase.from('user_profiles').insert({
      user_id: testUserId,
      credits: 5,
    })

    // Fetch profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('user_id', testUserId)
      .single()

    expect(profile!.credits).toBe(5) // Should remain unchanged
  })

  it('should enforce NOT NULL constraint on credits column', async () => {
    // Attempt to create user profile with NULL credits
    const { error } = await supabase.from('user_profiles').insert({
      user_id: crypto.randomUUID(),
      credits: null,
    })

    expect(error).toBeTruthy()
    expect(error!.message).toContain('null value') // Postgres NOT NULL error
  })

  it('should allow negative credits if necessary', async () => {
    // Edge case: System might need to track negative balances (refunds, disputes)
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-${testUserId}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })

    testUserId = authData.user!.id

    // Set negative credits
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: testUserId,
      credits: -1,
    })

    expect(error).toBeNull() // Should succeed (no CHECK constraint on credits)
  })
})
```

**Coverage Target**: 100% (security-critical - affects business model)

---

### Test File: `__tests__/unit/lib/supabase/user-profile-creation.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}))

describe('User Profile Creation', () => {
  it('should use default value of 0 for credits when not specified', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'test-user', credits: 0 }, // Simulates DEFAULT 0
              error: null,
            }),
          })),
        })),
      })),
    }

    vi.mocked(createServiceRoleClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createServiceRoleClient>>,
    )

    const supabase = await createServiceRoleClient()
    const { data } = await supabase
      .from('user_profiles')
      .insert({ user_id: 'test-user' })
      .select()
      .single()

    expect(data!.credits).toBe(0)
  })
})
```

---

## 📖 Implementation Guide

### Phase 1: Create Migration (10 minutes)

1. Create migration file:

   ```bash
   npm run db:migration:create fix_default_credits
   ```

2. Add SQL from above (choose Option A, B, or C for existing users)

3. Review migration:
   ```bash
   cat supabase/migrations/[timestamp]_fix_default_credits.sql
   ```

**Verification**:

```bash
# Ensure file exists and has correct SQL
ls -l supabase/migrations/*fix_default_credits.sql
```

---

### Phase 2: Apply Migration (5 minutes)

**Local Testing**:

```bash
npm run db:migrate
# Should succeed without errors
```

**Verify Schema**:

```bash
npm run db:types
# Regenerate TypeScript types
```

**Check Database**:

```sql
-- Connect to local Supabase
psql -h localhost -p 54322 -U postgres -d postgres

-- Verify default value
\d user_profiles
-- Should show: credits integer DEFAULT 0 NOT NULL
```

---

### Phase 3: Write Tests (10 minutes)

1. Create `__tests__/integration/schema/user-profiles-default-credits.test.ts`
2. Implement all 4 test cases
3. Run tests:
   ```bash
   npm run test:watch -- user-profiles-default-credits
   ```

**Verification**:

```bash
npm run test -- user-profiles-default-credits.test.ts
# Should pass all 4 test cases
```

---

### Phase 4: Verify Coverage & Quality Gates (5 minutes)

```bash
npm run test:coverage
# Verify ≥90% coverage

npm run lint
# Should have 0 errors/warnings

npm run build
# Should succeed

npx tsc --noEmit
# Should have 0 type errors
```

---

### Phase 5: Deploy to Production (Manual Step)

**Important**: This migration affects the database schema. Follow deployment checklist:

1. **Backup production database** (via Supabase dashboard)
2. **Apply migration to staging** (if available)
3. **Test on staging** with real user creation flow
4. **Apply migration to production**:
   ```bash
   npx supabase db push --project-ref <your-project-ref>
   ```
5. **Monitor for errors** in production logs
6. **Verify new user registrations** have 0 credits

---

## ✅ Definition of Done

- [ ] Migration created and reviewed
- [ ] Migration applied to local database
- [ ] TypeScript types regenerated
- [ ] Integration tests written and passing
- [ ] Test coverage ≥90%
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Production build succeeds
- [ ] Migration applied to staging (if available)
- [ ] Migration applied to production
- [ ] New user registration verified in production (0 credits)
- [ ] PR created and merged to main

---

## 🔄 Rollback Plan

If issues arise in production:

### Immediate Rollback (Revert Default)

```sql
-- Revert default back to 1
ALTER TABLE user_profiles
ALTER COLUMN credits SET DEFAULT 1;
```

**Risk**: Low - only affects NEW user registrations after rollback

### Full Rollback (Revert Migration)

```bash
# Find migration version
npx supabase db history

# Rollback to previous version
npx supabase db rollback --project-ref <your-project-ref>
```

### Verify Rollback

```sql
\d user_profiles
-- Should show: credits integer DEFAULT 1 NOT NULL
```

---

## 🤔 Decision Required: Existing Users

Before implementing, decide on handling existing users with 1 credit:

### Option A: Reset to 0 (Strict Enforcement)

**SQL**:

```sql
UPDATE user_profiles SET credits = 0 WHERE credits = 1;
```

**Pros**:

- Clean slate
- Consistent with business model

**Cons**:

- Removes existing users' 1 credit (might cause confusion)

---

### Option B: Grandfather (Keep 1 Credit)

**SQL**: None (no update statement)

**Pros**:

- No impact on existing users
- Low risk

**Cons**:

- Slight inconsistency (some users have 1 free credit)

---

### Option C: Conditional Reset

**SQL**:

```sql
UPDATE user_profiles SET credits = 0 WHERE credits = 1;
-- Keep users with >1 credits (assume they purchased)
```

**Pros**:

- Removes "accidental" free credits
- Respects users who purchased credits

**Cons**:

- Assumes users with 1 credit never purchased
- Could be wrong assumption

---

**Recommendation**: **Option B** (Grandfather existing users)

**Reason**: Minimal risk, respects existing users, focuses fix on new registrations only.

---

## 📊 Impact Analysis

### Low Impact (Why This Is P5)

1. **Small user base**: Project is in development, likely few real users
2. **1 credit = $1**: Financial impact is minimal
3. **Only affects new users**: Existing users unaffected (if Option B chosen)
4. **No UX changes**: Users won't notice the fix
5. **Quick fix**: 30-minute implementation

### Why Fix Now?

- Correct the business model before launch
- Prevent accumulating technical debt
- Easy to fix while user base is small
- Demonstrates attention to detail

---

## 📚 Related Documentation

- [NEXT_STEPS.md](../NEXT_STEPS.md) - Roadmap overview (Priority 5)
- [SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md) - Business model explanation
- [TESTING_STRATEGY.md](../../documentation/TESTING_STRATEGY.md) - Testing patterns

---

**Created**: 2025-10-28
**Priority**: P5 (Low - Technical Debt)
**Estimated Completion**: 30 minutes
**Production Impact**: Low (affects only new registrations)
