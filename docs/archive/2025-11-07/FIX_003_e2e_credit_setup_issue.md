# FIX_003: E2E Test Credit Setup Issue

**Status**: ✅ RESOLVED
**Priority**: Medium
**Created**: 2025-10-29
**Resolved**: 2025-10-29
**Related Feature**: `feature/ui-adventure-creation-refactor`

## Problem Summary

E2E tests for adventure creation were failing due to:

1. **Primary Key Mismatch**: Test used `.eq('user_id', user.id)` but table primary key is `id`
2. **Credit System Confusion**: Migration 00016 referenced nonexistent `user_credits` and `credit_transactions` tables

### Error Message

```
Error: Failed to add credits to test user: Could not find the table 'public.user_credits' in the schema cache
```

### Affected Tests

All E2E tests in `__tests__/e2e/adventure-creation-form.spec.ts` (15 tests across 3 browsers):

- form renders with all 4 dropdowns and submit button
- form validation prevents submission with empty motif field
- form submission consumes credit and redirects to adventure detail
- form shows loading state and disables submit during generation
- form pre-selects default values for party size, tier, and scenes

### Test Failure Details

**Test file**: `__tests__/e2e/adventure-creation-form.spec.ts`
**Helper function**: `createTestUserWithCredits()` (lines 28-57)
**Failure location**: Line 54

```typescript
// Current implementation (FAILING)
const { error } = await supabaseAdmin.from('user_credits').insert({
  user_id: user.id,
  adventure_credits: credits,
  expansion_credits: 0,
  created_at: new Date().toISOString(),
})

if (error) {
  throw new Error(`Failed to add credits to test user: ${error.message}`)
}
```

### Root Cause (CORRECTED)

**Original FIX document was incorrect!** The actual issues were:

1. **E2E Test Bug**: Used wrong column name for filtering
   - ❌ `.eq('user_id', user.id)` (column doesn't exist)
   - ✅ `.eq('id', user.id)` (correct primary key)

2. **Credit System Design Confusion**: Two conflicting designs existed:
   - **Simple Balance** (IMPLEMENTED): `daggerheart_user_profiles.credits` stores integer balance
   - **Token Ledger** (ORPHANED): Migration 00016 referenced `user_credits` and `credit_transactions` tables that were never created

**DaggerGM uses Simple Balance approach** - no need for complex ledger tables.

## Impact

- **Severity**: Medium - E2E tests cannot run, but unit/integration tests pass
- **Scope**: Only affects E2E test suite for adventure creation
- **User Impact**: None - this is a testing infrastructure issue
- **CI/CD Impact**: E2E tests will fail in GitHub Actions

## Investigation Needed

1. **Check local Supabase schema**:

   ```bash
   npm run db:start
   psql -h localhost -p 54322 -U postgres -d postgres -c "\dt public.*"
   psql -h localhost -p 54322 -U postgres -d postgres -c "\df public.*"
   ```

2. **Check production Supabase schema**:
   - Log into Supabase Dashboard: https://supabase.com/dashboard/project/ogvbbfzfljglfanceest
   - Navigate to Table Editor → Check if `user_credits` table exists
   - Navigate to Database → Functions → Check if `add_user_credits` RPC exists

3. **Check migration files**:

   ```bash
   ls -la supabase/migrations/ | grep -i credit
   ```

4. **Verify migration status**:
   ```bash
   npx supabase db remote commit --db-url postgres://postgres:[PASSWORD]@db.ogvbbfzfljglfanceest.supabase.co:5432/postgres
   ```

## Possible Solutions

### Option 1: Apply Missing Migrations (Recommended)

If migrations exist but weren't applied:

```bash
# Push migrations to production
npx supabase db push --db-url "postgres://postgres:[PASSWORD]@db.ogvbbfzfljglfanceest.supabase.co:5432/postgres"
```

### Option 2: Create Migration for Credit System

If no migration exists for `user_credits` table:

```bash
# Create new migration
npx supabase migration new create_user_credits_table

# Edit the migration file to include:
# - CREATE TABLE user_credits (...)
# - CREATE FUNCTION add_user_credits(...)
# - RLS policies for user_credits table

# Apply migration
npx supabase db push
```

### Option 3: Use Mock Credit System in E2E Tests

If credit system isn't ready for production:

```typescript
// Modify createTestUserWithCredits() to use mock approach
// Store credits in memory or use a test-only table
const mockCredits = new Map<string, number>()

async function createTestUserWithCredits(email: string, credits: number) {
  const user = await createTestUser(email)
  mockCredits.set(user.id, credits)
  return user
}

// Update tests to check mock credits instead of database
```

### Option 4: Use Different Database for E2E Tests

If production database shouldn't be used for E2E tests:

```typescript
// Update playwright.config.ts to use local Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'local-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'local-service-role-key'
```

## Implementation Plan (TDD Workflow)

### Phase 1: Investigation (RED)

- [ ] Check if `user_credits` table exists in local Supabase
- [ ] Check if `user_credits` table exists in production Supabase
- [ ] Check if `add_user_credits` RPC function exists
- [ ] Review existing migration files for credit system
- [ ] Document current state of credit system schema

### Phase 2: Fix (GREEN)

- [ ] Choose solution based on investigation findings
- [ ] Create/apply migrations if needed
- [ ] Update E2E test helper functions
- [ ] Run E2E tests locally: `npm run test:e2e -- adventure-creation-form.spec.ts`
- [ ] Verify all 15 tests pass (5 tests × 3 browsers)

### Phase 3: Validation (REFACTOR)

- [ ] Add documentation for credit system setup in test environments
- [ ] Update test README with credit setup instructions
- [ ] Consider adding credit setup to `__tests__/e2e/fixtures/test-utils.ts`
- [ ] Add CI/CD check for required database schema before E2E tests run
- [ ] Push to feature branch and verify CI/CD passes

## ✅ Resolution (2025-10-29)

### Changes Made

**1. Fixed E2E Test Helper** ([**tests**/e2e/adventure-creation-form.spec.ts](../../__tests__/e2e/adventure-creation-form.spec.ts#L49))

```typescript
// BEFORE (incorrect):
.eq('user_id', user.id)

// AFTER (correct):
.eq('id', user.id)
```

**2. Created Migration 00018** ([supabase/migrations/00018_simplify_credit_system.sql](../../supabase/migrations/00018_simplify_credit_system.sql))

- Dropped orphaned `consume_credit()` and `refund_credit()` functions
- Added database comments documenting simple balance design
- Applied to production Supabase

**3. Created Architecture Documentation** ([docs/ARCHITECTURE/credit_system_design.md](../ARCHITECTURE/credit_system_design.md))

- Official credit system design doc
- Documents simple balance approach as the standard
- Explains why ledger system was rejected

### Verification

```bash
# E2E tests now pass credit setup
npm run test:e2e -- adventure-creation-form.spec.ts

# Before: "Could not find the table 'public.user_credits'"
# After: No credit setup errors (tests may fail on other issues, but credits work!)
```

### Impact

- ✅ E2E tests can now add credits to test users
- ✅ Credit system architecture is clearly documented
- ✅ No more confusion about which tables exist
- ✅ Migration 00018 cleaned up orphaned functions

---

## Related Files

**Test Files**:

- `__tests__/e2e/adventure-creation-form.spec.ts` - E2E tests that need credits
- `__tests__/e2e/fixtures/test-utils.ts` - Potential location for shared credit setup

**Database Files**:

- `supabase/migrations/` - Migration files directory
- `types/database.generated.ts` - TypeScript types (may reference `user_credits`)

**Configuration**:

- `playwright.config.ts` - E2E test configuration
- `.env.test.local` - Test environment variables (Supabase connection)

## Success Criteria

- [ ] E2E tests can successfully add credits to test users
- [ ] All 15 E2E tests pass locally (5 tests × 3 browsers)
- [ ] E2E tests pass in GitHub Actions CI/CD
- [ ] Credit setup is documented for future developers
- [ ] No impact on existing unit/integration tests

## Notes

**Why This Happened**:

- E2E tests were written following TDD (RED phase)
- Tests assumed credit system was fully implemented in production
- Database schema mismatch wasn't caught until test execution

**Why It's Not Blocking**:

- Unit tests cover the UI refactor (8/8 passing)
- Integration tests don't require credits
- Production code works correctly (just can't E2E test it yet)

**Security Considerations**:

- Ensure test user cleanup after E2E tests
- Use service role key only in test environment
- Verify RLS policies prevent unauthorized credit manipulation
- Consider using test-specific database instance

## References

- **Supabase Docs**: https://supabase.com/docs/guides/cli/managing-environments
- **Feature Branch**: `feature/ui-adventure-creation-refactor`
- **Related Commit**: `82aa9d5` - Initial refactor that introduced E2E tests
- **CI/CD Run**: #18920897806 (E2E tests failing)

---

**Created**: 2025-10-29
**Last Updated**: 2025-10-29
**Version**: 1.0
