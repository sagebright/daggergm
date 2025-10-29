# Table Rename Migration - Blast Radius Analysis

**Migration**: [00016_rename_tables_to_daggerheart_prefix.sql](../supabase/migrations/00016_rename_tables_to_daggerheart_prefix.sql)

**Objective**: Rename DaggerGM tables to use `daggerheart_` prefix for visual grouping in shared database

## Tables Being Renamed

| Old Name        | New Name                    | Rows  | Dependencies                                           |
| --------------- | --------------------------- | ----- | ------------------------------------------------------ |
| `user_profiles` | `daggerheart_user_profiles` | 1,268 | Foreign keys from auth.users, referenced by functions  |
| `adventures`    | `daggerheart_adventures`    | 0     | Foreign key to auth.users, referenced by RPC functions |
| `game_content`  | `daggerheart_game_content`  | 0     | Referenced by search_game_content() function           |
| `llm_cache`     | `daggerheart_llm_cache`     | 0     | No dependencies                                        |
| `purchases`     | `daggerheart_purchases`     | 0     | Foreign key to auth.users                              |

## What the Migration Does

### ✅ Automatically Handled by PostgreSQL

- **Indexes**: All indexes automatically rename (e.g., `idx_adventures_user_id` → `idx_daggerheart_adventures_user_id`)
- **Triggers**: `update_user_profiles_updated_at` → `update_daggerheart_user_profiles_updated_at`
- **RLS Policies**: All policies follow the table rename
- **Constraints**: Primary keys, foreign keys, check constraints all update automatically
- **Data**: All 1,268 rows in user_profiles preserved (no data loss)

### 🔧 Updated in Migration

**Functions** (8 total updated):

1. `handle_new_user()` - References user_profiles in INSERT
2. `consume_adventure_credit()` - References user_profiles and adventures
3. `add_user_credits()` - References user_profiles
4. `consume_credit()` - References user_profiles (for guest check)
5. `refund_credit()` - No changes needed (uses user_credits table)
6. `increment_scaffold_regenerations()` - References adventures
7. `increment_expansion_regenerations()` - References adventures
8. `search_game_content()` - References game_content

## Code Changes Required

### 🔴 CRITICAL: TypeScript Type Regeneration

**File**: `src/types/supabase.ts`

**Action Required**:

```bash
# After migration runs, regenerate types:
npx supabase gen types typescript --project-id ogvbbfzfljglfanceest > src/types/supabase.ts
```

This will update all type definitions from:

```typescript
Database['public']['Tables']['user_profiles']
Database['public']['Tables']['adventures']
// etc.
```

To:

```typescript
Database['public']['Tables']['daggerheart_user_profiles']
Database['public']['Tables']['daggerheart_adventures']
// etc.
```

### 🟡 Test Files (13 files)

All test files reference table names in SQL queries or Supabase client calls:

**Unit Tests**:

- `__tests__/unit/app/auth/callback/route.test.ts`
- `__tests__/unit/app/actions/adventures-validation.test.ts`
- `__tests__/unit/app/actions/adventures-full.test.ts`
- `__tests__/unit/app/actions/credits.test.ts`
- `__tests__/unit/app/api/health/route.test.ts`
- `__tests__/unit/middleware.test.ts`
- `__tests__/unit/lib/llm/openai-provider.test.ts`
- `__tests__/unit/lib/credits/credit-manager.test.ts`

**Integration Tests**:

- `__tests__/integration/scene-expansion-structure.test.ts`
- `__tests__/integration/schema/user-profiles-default-credits.test.ts`
- `__tests__/integration/guest-restrictions.test.ts`
- `__tests__/integration/actions/adventures-with-credits.test.ts`
- `__tests__/actions/adventures.test.ts`

**Impact**: Tests will likely fail after migration if they reference old table names directly. However, if tests use TypeScript types (recommended), they'll break at compile time, making them easy to find.

### 🟢 Documentation (47 files)

These files contain table names in examples/documentation. Updates are optional but recommended for accuracy:

**Key Documentation**:

- `CLAUDE.md` - Main development guide
- `README.md` - Project overview
- `docs/SYSTEM_OVERVIEW.md` - System architecture
- `docs/architecture/TESTING_STRATEGY.md`
- `docs/architecture/SERVER_STATE.md`

**Skills/Commands** (may have SQL examples):

- `.claude/skills/tenant-security.md`
- `.claude/skills/vitest-patterns.md`
- `.claude/commands/test-integration.md`

**Archived Features** (low priority):

- `docs/archive/*.md` (30+ files)

## Migration Execution Plan

### Pre-Migration Checklist

- [ ] **Backup verification**: Confirm Supabase has point-in-time recovery enabled
- [ ] **User notification**: No active users expected (0 adventures currently)
- [ ] **CI/CD pause**: Consider pausing deployments during migration

### Execution Steps

1. **Run Migration**:

   ```bash
   # Apply to remote database
   npx supabase db push
   # OR use Supabase MCP tool
   ```

2. **Verify Migration**:

   ```sql
   -- Check tables renamed
   SELECT tablename FROM pg_tables WHERE schemaname = 'public'
   AND tablename LIKE 'daggerheart_%' ORDER BY tablename;

   -- Verify RLS policies
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename LIKE 'daggerheart_%';

   -- Test a function
   SELECT handle_new_user();
   ```

3. **Regenerate Types**:

   ```bash
   npx supabase gen types typescript --project-id ogvbbfzfljglfanceest > src/types/supabase.ts
   ```

4. **Fix TypeScript Errors**:

   ```bash
   npx tsc --noEmit
   # Fix any type errors in application code
   ```

5. **Update Tests**:
   - Run: `npm test`
   - Update any hardcoded table references in test SQL
   - Ensure all tests pass

6. **Update Documentation** (optional):
   - Search/replace old table names in docs
   - Update examples in CLAUDE.md

### Rollback Plan

If migration fails:

```sql
-- Rollback by renaming tables back
ALTER TABLE daggerheart_user_profiles RENAME TO user_profiles;
ALTER TABLE daggerheart_adventures RENAME TO adventures;
ALTER TABLE daggerheart_game_content RENAME TO game_content;
ALTER TABLE daggerheart_llm_cache RENAME TO llm_cache;
ALTER TABLE daggerheart_purchases RENAME TO purchases;

-- Re-run function updates from migration 00002, 00003, 00005, 00013
```

## Risk Assessment

| Risk            | Likelihood | Impact   | Mitigation                                   |
| --------------- | ---------- | -------- | -------------------------------------------- |
| Data loss       | Very Low   | Critical | PostgreSQL RENAME is atomic, no data touched |
| Function breaks | Low        | High     | All functions updated in migration           |
| Type errors     | High       | Medium   | Regenerate types immediately after migration |
| Test failures   | High       | Low      | Tests will fail fast, easy to fix            |
| Downtime        | None       | N/A      | No application deployed yet                  |

## Post-Migration Verification

Run these queries to verify everything worked:

```sql
-- 1. Verify all tables renamed
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'adventures', 'game_content', 'llm_cache', 'purchases');
-- Expected: 0

-- 2. Verify new tables exist
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'daggerheart_%'
AND tablename NOT IN (
  'daggerheart_adversaries', 'daggerheart_environments', 'daggerheart_weapons',
  'daggerheart_armor', 'daggerheart_items', 'daggerheart_consumables',
  'daggerheart_ancestries', 'daggerheart_classes', 'daggerheart_subclasses',
  'daggerheart_domains', 'daggerheart_abilities', 'daggerheart_communities',
  'daggerheart_frames'
)
ORDER BY tablename;
-- Expected: 5 tables (user_profiles, adventures, game_content, llm_cache, purchases)

-- 3. Verify RLS policies
SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE 'daggerheart_%';
-- Expected: 18+ policies

-- 4. Verify data preserved
SELECT COUNT(*) FROM daggerheart_user_profiles;
-- Expected: 1,268 (same as before)

-- 5. Test a function
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
-- Expected: handle_new_user
```

## Timeline Estimate

- **Migration execution**: ~30 seconds (rename is instant, function updates are fast)
- **Type regeneration**: ~5 seconds
- **TypeScript compilation check**: ~10 seconds
- **Test updates**: 30-60 minutes (manual updates to 13 test files)
- **Documentation updates**: 1-2 hours (optional, low priority)

**Total downtime**: 0 minutes (no application deployed)
**Total developer time**: 2-3 hours (mostly test updates)

---

**Created**: 2025-10-28
**Migration File**: [supabase/migrations/00016_rename_tables_to_daggerheart_prefix.sql](../supabase/migrations/00016_rename_tables_to_daggerheart_prefix.sql)
