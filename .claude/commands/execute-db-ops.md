# Execute Database Operations

**Purpose**: Systematically execute database operations including schema changes, RLS policies, migrations, and data fixes for DaggerGM.

## Operation: $ARGUMENTS

---

## 🚨 CRITICAL: Safety-First Database Operations

This command uses **mandatory checkpoints** for all database operations.

### Workflow Pattern

```
ANALYZE → PLAN → ✋ CHECKPOINT → EXECUTE → VALIDATE → ✋ CHECKPOINT → FINALIZE
```

---

## 📋 PHASE 0: Pre-Flight Checks (MANDATORY)

### Actions:

1. **Read the operation spec**: `$ARGUMENTS`
2. **Identify target database**: Local Supabase / Production
3. **Verify database access**: Supabase connection
4. **Create backup strategy**: Supabase snapshots / Git-tracked migrations
5. **Check current database state**:
   - Remote Supabase credentials: Check `.env.test.local` exists
   - Schema version: Use Supabase MCP tools to list migrations
   - Table info: Supabase Dashboard (https://supabase.com/dashboard)

### Safety Checklist:

```bash
# Verify Supabase credentials configured
test -f .env.test.local && grep "NEXT_PUBLIC_SUPABASE_URL" .env.test.local || echo "⚠️  Missing .env.test.local"

# Check current schema (use MCP tools or Supabase Dashboard)
# Use Supabase MCP: list_tables, list_migrations

# View in Supabase Dashboard
# https://supabase.com/dashboard/project/[your-project-id]

# List current migrations
ls -la supabase/migrations/
```

### ✋ CHECKPOINT 0

**STOP HERE. Report to user:**

- Target database: Local / Production
- Operation type: [Schema / RLS / Migration / Data Fix]
- Risk level: [Low / Medium / High / Critical]
- Backup strategy: [Snapshot / Git-tracked migration]
- Rollback plan: [Summary]

**Wait for explicit user approval.**

---

## 📋 PHASE 1: Analysis & Planning

### DaggerGM-Specific Patterns:

```sql
-- RLS Policy for user isolation (CRITICAL SECURITY)
CREATE POLICY "Users can only access their own adventures"
  ON adventures
  FOR ALL
  USING (auth.uid() = user_id);

-- Guest token pattern (24-hour expiry)
CREATE POLICY "Guest tokens for temporary access"
  ON adventures
  FOR SELECT
  USING (
    guest_token_id = current_setting('request.jwt.claims', true)::json->>'guest_token_id'
    AND guest_token_expires_at > now()
  );

-- Check for missing user_id (SECURITY VIOLATION)
SELECT
  'adventures' as table_name,
  count(*) as total_rows,
  count(*) FILTER (WHERE user_id IS NULL) as null_user_rows
FROM adventures;

-- Verify RLS enabled on all business tables
SELECT
  schemaname,
  tablename,
  c.relrowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies
   WHERE schemaname = t.schemaname
   AND tablename = t.tablename) as policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('adventures', 'frames', 'credit_transactions', 'user_profiles')
ORDER BY tablename;
```

### Risk Assessment:

```
✅ RISK ANALYSIS CHECKLIST:
□ Breaking changes identified and documented
□ Impact on Server Actions assessed
□ RLS policies enforced correctly (no bypass)
□ Guest token handling verified
□ TypeScript type updates planned (npm run db:types)
□ Next.js build compatibility checked
□ Multi-tenant isolation verified (CRITICAL)
```

### ✋ CHECKPOINT 1

**STOP HERE. Report to user:**

- Affected tables: [list with row counts]
- Data quality issues found: [list]
- Execution plan: [TodoWrite summary]
- Risk assessment: [summary]

**Wait for user approval to proceed.**

---

## 📋 PHASE 2: Execution (Local Supabase First)

### Supabase Migration Workflow:

```bash
# 1. Create migration file
npx supabase migration new [migration_name]

# 2. Edit migration in supabase/migrations/
# Example: supabase/migrations/20251023_enable_rls_adventures.sql

# 3. Apply to local database
npx supabase db reset  # Resets and applies all migrations

# OR incremental:
npx supabase db push

# 4. Verify changes
npx supabase db diff

# 5. Update TypeScript types
npm run db:types

# 6. Test with Server Actions
npm test -- src/features/adventures
```

### Example Migration:

```sql
-- supabase/migrations/20251023_enable_rls_adventures.sql

-- Step 1: Ensure all rows have user_id (CRITICAL)
UPDATE adventures
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- Step 2: Make user_id NOT NULL
ALTER TABLE adventures
ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Enable RLS
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;

-- Step 4: User access policy
CREATE POLICY "Users access own adventures"
  ON adventures
  FOR ALL
  USING (auth.uid() = user_id);

-- Step 5: Guest token policy
CREATE POLICY "Guest token temporary access"
  ON adventures
  FOR SELECT
  USING (
    guest_token_id = current_setting('request.jwt.claims', true)::json->>'guest_token_id'
    AND guest_token_expires_at > now()
  );

-- Step 6: Service role full access (for admin operations)
CREATE POLICY "Service role full access"
  ON adventures
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Validation Checklist:

```
✅ LOCAL DATABASE VALIDATION:
□ All DDL statements executed successfully
□ No NULL user_id values remain
□ RLS policies enforcing user isolation correctly
□ Guest token handling working
□ TypeScript types regenerated (npm run db:types)
□ Server Actions tests passing (npm test)
□ Next.js dev server starts (npm run dev)
□ No authorization errors in Supabase logs
```

### ✋ CHECKPOINT 2

**STOP HERE. Report to user:**

- Local database status: ✅ Success / ❌ Failed
- Issues encountered: [list with resolutions]
- Test suite results: [pass/fail counts]
- Ready for production: Yes / No / With modifications

**If successful, wait for user approval to proceed to production.**
**If failed, return to Phase 1 for replanning.**

---

## 📋 PHASE 3: Production Execution (CRITICAL)

### Pre-Production Checklist:

```
⚠️ MANDATORY PRODUCTION CHECKLIST:
□ Local database operations 100% successful
□ All migrations committed to git
□ Full test suite passing (npm test)
□ E2E tests passing (npm run test:e2e)
□ Supabase project linked correctly
□ Team notified of deployment
□ Rollback migration prepared
```

### Production Deployment:

```bash
# Supabase automatically applies migrations from supabase/migrations/
# when you link to production project and push

# 1. Verify migrations are committed
git status
# Should show: supabase/migrations/[timestamp]_[name].sql committed

# 2. Push to GitHub (triggers CI/CD)
git push origin main

# 3. Monitor GitHub Actions
gh run watch

# 4. Supabase applies migrations automatically
# Monitor in Supabase Dashboard > Database > Migrations
```

### Rollback Strategy:

```bash
# If migration causes issues:

# 1. Create rollback migration immediately
npx supabase migration new rollback_[original_name]

# 2. Write reverse SQL
# Example: If you enabled RLS, disable it
# supabase/migrations/[timestamp]_rollback_enable_rls.sql

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "Users access own adventures" ON adventures;
DROP POLICY IF EXISTS "Guest token temporary access" ON adventures;
DROP POLICY IF EXISTS "Service role full access" ON adventures;

-- Disable RLS
ALTER TABLE adventures DISABLE ROW LEVEL SECURITY;

COMMIT;

# 3. Apply rollback locally first
npx supabase db reset
npm test

# 4. If tests pass, commit and push
git add supabase/migrations/
git commit -m "rollback: disable RLS on adventures table"
git push origin main
```

### Continuous Monitoring:

```bash
# Monitor Supabase logs for errors
# Check Supabase Dashboard > Logs

# Check for authorization errors in application
npm run dev
# Test user flows manually

# Monitor GitHub Actions
gh run list --limit 5
```

### ✋ CHECKPOINT 3

**STOP HERE. Report to user:**

- Production status: ✅ Success / ⚠️ Issues / ❌ Rolled back
- Migration applied: [timestamp and name]
- Test results: [CI/CD status]
- Issues: [any problems encountered]

**Monitor for 24 hours before marking as complete.**

---

## 📋 PHASE 4: Validation & Documentation

### Final Validation:

```sql
-- Verify RLS enabled
SELECT tablename, c.relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename = 'adventures';

-- Verify policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'adventures';

-- Test user isolation (use Supabase SQL Editor)
-- Login as user A, should only see their adventures
SELECT count(*) FROM adventures;

-- Test guest token access
-- Use guest token, should see only adventures with matching guest_token_id
```

### Documentation Updates:

```
REQUIRED DOCUMENTATION:
□ Update database schema docs
□ Document new RLS policies
□ Update Server Actions if patterns changed
□ Create migration runbook
□ Record lessons learned
```

### ✋ CHECKPOINT 4 (FINAL)

**STOP HERE. Report to user:**

**Operation Complete! Summary:**

- Operation type: [RLS / Migration / Schema Change]
- Database: Local / Production
- Tables affected: [count and names]
- Rows affected: [count]
- Success metrics: All met ✅
- Documentation: Updated ✅

**Post-Operation:**

- Continue monitoring for 24-48 hours
- Review rollback procedures remain ready

---

## 🎯 Operation-Specific Guidance

### For RLS Operations:

- **ALWAYS** fix NULL user_id values FIRST (security critical)
- Test with real user sessions (not just SQL)
- Verify guest token handling (24-hour expiry)
- Monitor for authorization errors
- Use Supabase Studio to test policies interactively

### For Schema Changes:

- Use Supabase migrations (git-tracked)
- Test with Server Actions immediately
- Update TypeScript types: `npm run db:types`
- Verify Next.js build: `npm run build`
- Check that App Router pages still work

### For Data Migrations:

- Batch updates (1000 rows at a time for large tables)
- Test rollback migration first
- Keep original data until validated
- Monitor performance impact

### For Credit System (100% coverage required):

- All credit operations must be transactional
- Test double-spend prevention
- Verify Stripe webhook integration
- Audit logging for all credit changes

---

## 📚 Related Documentation

- **Architecture**: [documentation/ARCHITECTURE.md](../../documentation/ARCHITECTURE.md)
- **Server Actions**: [documentation/SERVER_ACTIONS.md](../../documentation/SERVER_ACTIONS.md)
- **Testing Strategy**: [documentation/TESTING_STRATEGY.md](../../documentation/TESTING_STRATEGY.md)
- **RLS Verification**: [.claude/skills/tenant-security.md](../ skills/tenant-security.md)

---

**Version**: 1.0 (DaggerGM)
**Adapted From**: bachlezard execute-db-ops.md
**Usage**: `/execute-db-ops documentation/DATABASE/[operation].md`
**Next.js Specific**: Uses Supabase migrations, Server Actions, TypeScript strict mode
