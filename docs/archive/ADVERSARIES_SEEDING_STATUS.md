# Adversaries Seeding Status

## Current Progress

- **Completed**: 2/80 adversaries inserted (ZOMBIE PACK, WEAPONMASTER)
- **Remaining**: 78 adversaries
- **Excluded**: 49 tier-4 adversaries (database constraint allows only tiers 1-3)
- **Total Valid**: 80 adversaries (tier 1-3)

## Root Causes Identified

### 1. Environment Variable Issue (FIXED ✅)

- `.env.local` was pointing to `localhost:54321` (local Supabase)
- Fixed by copying `.env.test.local` content to `.env.local`
- Both now point to remote: `https://ogvbbfzfljglfanceest.supabase.co`

### 2. SQL Type Mismatches (FIXED ✅)

- `motives_tactics`: Database expects `text[]` not `jsonb`
- `features`: Database expects `jsonb[]` (array of jsonb) not `jsonb`
- Fixed in SQL generation script: `scripts/get-batch-sql.ts`

### 3. Tier Constraint (DOCUMENTED ✅)

- Database has check constraint: `daggerheart_adversaries_tier_check`
- Only allows tiers 1-3
- 49 adversaries in source data have tier=4 and must be excluded

### 4. Supabase JS Client Authentication (UNRESOLVED ❌)

- Service role key `sb_secret__S7e4agBgzTqpf07mm9mTA_u9-paxgz` is correct
- Works via MCP `execute_sql` tool ✅
- Fails via Supabase JS client with "Invalid API key" ❌
- Fails via direct REST API calls ❌
- **Likely cause**: This key format may only work for MCP, not for programmatic SDK access

## Working Solution

**Only reliable method**: Supabase MCP `execute_sql` tool

Successfully tested with:

```typescript
mcp__supabase__execute_sql({
  project_id: 'ogvbbfzfljglfanceest',
  query: 'INSERT INTO daggerheart_adversaries ...',
})
```

## Prepared Files

All SQL is ready in properly formatted files:

- **All adversaries**: `/tmp/all_adversaries.sql` (129 statements, includes tier 4)
- **Valid only (tier 1-3)**: `/tmp/adversaries_tier1-3.sql` (80 statements)
- **Batched by 10**: `/tmp/batch_{1..13}_clean.sql`

## Next Steps

### Option A: Manual Execution via MCP (Most Reliable)

Execute remaining 78 statements one by one using `mcp__supabase__execute_sql`

**Pros**: Guaranteed to work (already tested)
**Cons**: Tedious (78 manual executions)

### Option B: Get Correct Service Role Key

The key in our env files might not be the full/correct JWT for programmatic access.

1. Visit: https://supabase.com/dashboard/project/ogvbbfzfljglfanceest/settings/api
2. Copy the full "service_role" key (should be ~200 characters, JWT format)
3. Update both `.env.local` and `.env.test.local`
4. Run: `npx tsx scripts/seed-adversaries-fixed.ts`

### Option C: Direct PostgreSQL Connection

Use `psql` with database password:

```bash
psql "postgresql://postgres.[PROJECT]:[DB_PASSWORD]@db.ogvbbfzfljglfanceest.supabase.co:5432/postgres" \
  -f /tmp/adversaries_tier1-3.sql
```

**Note**: DB password is different from service role key

## Embeddings Issue (Next After Adversaries)

The embeddings generation script also fails with same authentication issue.

**Script**: `scripts/generate-embeddings.ts`
**Error**: Same "Invalid API key" or fetch errors
**Solution**: Will need same fix (either correct key or MCP-based approach)

## Files Created for Automation Attempts

- `scripts/seed-adversaries-fixed.ts` - Uses Supabase client (fails with auth)
- `scripts/execute-sql-from-file.ts` - Uses REST API (fails - no query RPC)
- `scripts/test-single-adversary.ts` - Test script (fails with auth)
- `scripts/get-batch-sql.ts` - SQL generator (✅ WORKS - creates valid SQL)

## Recommendation

**For immediate completion**: Use MCP `execute_sql` for remaining 78 adversaries

**For long-term fix**: Get correct service role JWT from Supabase dashboard to enable automated seeding scripts

---

**Created**: 2025-10-27
**Last Updated**: 2025-10-27
