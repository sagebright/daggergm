# SETUP Commands Infrastructure

**Purpose**: Add missing command templates from reference repositories to DaggerGM and clean up outdated commands.

**Execute with**: `/execute-ops documentation/SETUP_commands.md`

---

## 🎯 **OPERATION OVERVIEW**

**Operation Type**: Commands Infrastructure Enhancement
**Risk Level**: Low (documentation files only)
**Duration**: 1-2 hours
**Reversible**: Yes (git revert)

---

## 📋 **OBJECTIVES**

### Add Commands:

1. **execute-db-ops.md** - Database operations (migrations, RLS, schema)
2. **execute-refactor.md** - File size reduction with checkpoints
3. **execute-ops.md** - General operations (git, config, dependencies)

### Remove Commands:

1. **execute-prp_daggergm.md** - Outdated workflow
2. **generate-prp_daggergm.md** - Outdated workflow

### Enhance Commands:

1. Update command descriptions in CLAUDE.md
2. Add command reference section

---

## ✅ **SUCCESS CRITERIA**

- [ ] 3 new commands added to `.claude/commands/`
- [ ] 2 outdated commands removed (or archived)
- [ ] All commands adapted for DaggerGM (Supabase, Next.js, no Docker)
- [ ] CLAUDE.md updated with new commands
- [ ] Command README.md created

---

## 📝 **PHASE 1: ADD EXECUTE-DB-OPS.MD**

### File: `.claude/commands/execute-db-ops.md`

### Source:

Based on `/Users/jmfk/Repos/bachlezard/.claude/commands/execute-db-ops.md`

### Key Adaptations:

1. **Database**: PostgreSQL via Supabase CLI (not direct psql)
2. **Environment**: Supabase local (not Docker PostgreSQL)
3. **Patterns**: Server Actions impact (not Express routes)
4. **RLS**: Supabase RLS policies (auth.getUser() patterns)

### Core Structure:

```markdown
# Execute Database Operations

**Purpose**: Systematically execute database operations including schema changes, RLS policies, migrations, and data fixes for DaggerGM.

**Operation File**: `$ARGUMENTS`

---

## 🚨 CRITICAL: Safety-First Database Operations

This command uses **mandatory checkpoints** for all database operations.

### Workflow Pattern
```

ANALYZE → PLAN → ✋ CHECKPOINT → EXECUTE → VALIDATE → ✋ CHECKPOINT → FINALIZE

````

---

## 📋 PHASE 0: Pre-Flight Checks (MANDATORY)

### Actions:
1. **Read the operation spec**: `$ARGUMENTS`
2. **Identify target database**: Local Supabase / Staging / Production
3. **Verify database access**: Supabase connection
4. **Create backup strategy**: Supabase snapshots
5. **Check current database state**:
   - Schema version: `npx supabase db diff`
   - Active connections: `npx supabase db status`
   - Table info: Supabase Studio

### Safety Checklist:

```bash
# Verify Supabase connection
npx supabase status

# Check current schema
npx supabase db diff

# View in Supabase Studio
open http://127.0.0.1:54323
````

### ✋ CHECKPOINT 0

**STOP HERE. Report to user:**

- Target database: Local / Staging / Production
- Operation type: [Schema / RLS / Migration / Data Fix]
- Risk level: [Low / Medium / High / Critical]
- Backup strategy: [Snapshot / Git-tracked migration]
- Rollback plan: [Summary]

**Wait for explicit user approval.**

---

## 📋 PHASE 1: Analysis & Planning

### DaggerGM-Specific Patterns:

```sql
-- RLS Policy for user isolation
CREATE POLICY "Users can only access their own adventures"
  ON adventures
  FOR ALL
  USING (auth.uid() = user_id);

-- Check for missing user_id (security violation)
SELECT
  'adventures' as table_name,
  count(*) as total_rows,
  count(*) FILTER (WHERE user_id IS NULL) as null_user_rows
FROM adventures;

-- Verify RLS enabled
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
ORDER BY tablename;
```

---

## 📋 PHASE 2: Execution (Local Supabase First)

### Supabase Migration Workflow:

```bash
# 1. Create migration file
npx supabase migration new [migration_name]

# 2. Edit migration in supabase/migrations/
# Example: supabase/migrations/20250123_enable_rls_adventures.sql

# 3. Apply to local database
npx supabase db reset  # Resets and applies all migrations

# OR incremental:
npx supabase db push

# 4. Verify changes
npx supabase db diff

# 5. Test with Server Actions
npm test -- src/features/adventures
```

### Example Migration:

```sql
-- supabase/migrations/20250123_enable_rls_adventures.sql

-- Step 1: Ensure all rows have user_id
UPDATE adventures
SET user_id = created_by
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- Step 2: Enable RLS
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
CREATE POLICY "Users access own adventures"
  ON adventures
  FOR ALL
  USING (auth.uid() = user_id);

-- Step 4: Super admin policy (if needed)
CREATE POLICY "Service role full access"
  ON adventures
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 📋 PHASE 3: Production Execution (CRITICAL)

### Pre-Production Checklist:

```bash
# 1. Verify local testing complete
npm test
npm run test:e2e

# 2. Verify migration files committed
git status
# Should show: supabase/migrations/[timestamp]_[name].sql

# 3. Push to staging (if available)
# Test migration on staging Supabase project

# 4. Production deployment
# Supabase automatically applies migrations from supabase/migrations/
# when linked to production project
```

### Rollback Strategy:

```bash
# If migration causes issues:

# 1. Identify problem migration
npx supabase migration list

# 2. Create rollback migration
npx supabase migration new rollback_[original_name]

# 3. Write reverse SQL
# Example: If you enabled RLS, disable it
ALTER TABLE adventures DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own adventures" ON adventures;

# 4. Apply rollback
npx supabase db push
```

---

## 🎯 Operation-Specific Guidance

### For RLS Operations:

- Fix NULL user_id values FIRST (critical)
- Test with real user sessions
- Verify guest token handling
- Monitor for authorization errors
- Use Supabase Studio to test policies

### For Schema Changes:

- Use Supabase migrations (git-tracked)
- Test with Server Actions immediately
- Update TypeScript types: `npm run db:types`
- Verify Next.js build still works

### For Data Migrations:

- Batch updates (1000 rows at a time)
- Test rollback migration first
- Keep original data until validated
- Monitor performance impact

---

**Version**: 1.0 (DaggerGM)
**Adapted From**: bachlezard execute-db-ops.md
**Usage**: `/execute-db-ops documentation/DATABASE/[operation].md`

````

### Validation:

```bash
test -f .claude/commands/execute-db-ops.md && echo "✅ Command 1 added"
````

---

## 📝 **PHASE 2: ADD EXECUTE-REFACTOR.MD**

### File: `.claude/commands/execute-refactor.md`

### Source:

Based on `/Users/jmfk/Repos/bachlezard/.claude/commands/execute-refactor.md`

### Key Adaptations:

1. **File Limit**: 300 lines (not 500)
2. **Framework**: Next.js App Router (not React standalone)
3. **Patterns**: Server Components vs Client Components
4. **Testing**: Vitest (not Jest)

### Key Changes in Content:

````markdown
# Execute Refactor - File Size Reduction

**Purpose**: Refactor large files (>300 lines) into smaller, focused modules using checkpoint-driven approach.

**Target**: `$ARGUMENTS`

---

## 🎯 DaggerGM File Size Limit: 300 Lines

Files exceeding 300 lines MUST be refactored into smaller modules.

---

## 📋 PHASE 0: Setup & Analysis

### Trigger Points:

1. File >300 lines (MANDATORY refactor)
2. Multiple responsibilities (Server + Client logic)
3. > 5 dependencies

### Next.js-Specific Refactoring:

```typescript
// ❌ BEFORE: Large file mixing concerns (450 lines)
'use client'
export default function AdventurePage() {
  // 150 lines of state management
  // 100 lines of UI components
  // 100 lines of API calls
  // 100 lines of utilities
}

// ✅ AFTER: Separated by concern

// app/adventures/[id]/page.tsx (50 lines) - Server Component
export default async function AdventurePage({ params }) {
  const adventure = await getAdventure(params.id)
  return <AdventureClient adventure={adventure} />
}

// features/adventures/AdventureClient.tsx (100 lines) - Client Component
'use client'
export function AdventureClient({ adventure }) {
  // State and interactivity only
}

// features/adventures/actions.ts (80 lines) - Server Actions
'use server'
export async function updateAdventure(id, data) {
  // Database operations
}

// features/adventures/hooks/useAdventureState.ts (70 lines)
export function useAdventureState(adventure) {
  // Complex state logic
}
```
````

---

## 📋 PHASE 1-4: Extraction Pattern

### Phase 1: Extract Server Actions

- Move all `'use server'` functions to separate file
- Target: `features/[feature]/actions.ts`

### Phase 2: Extract Client Components

- Separate `'use client'` components
- Target: `features/[feature]/components/`

### Phase 3: Extract Custom Hooks

- Move Zustand stores to `stores/`
- Move React hooks to `hooks/`

### Phase 4: Extract Utilities

- Pure functions to `lib/utils/`
- Type definitions to `types/`

---

**Version**: 1.0 (DaggerGM)
**Adapted From**: bachlezard execute-refactor.md
**Target**: 300 lines (not 500)
**Usage**: `/execute-refactor documentation/REFACTOR/[file].md`

````

### Validation:

```bash
test -f .claude/commands/execute-refactor.md && echo "✅ Command 2 added"
````

---

## 📝 **PHASE 3: ADD EXECUTE-OPS.MD**

### File: `.claude/commands/execute-ops.md`

### Source:

Copy from `/Users/jmfk/Repos/template/.claude/commands/execute-ops.md`

### Key Adaptations:

1. **Package Manager**: npm (not yarn)
2. **Git Platform**: GitHub (verify gh CLI)
3. **Deployment**: Vercel (mention if applicable)
4. **Database**: Supabase migrations

### Minimal Changes Needed:

- Update variable placeholders for DaggerGM
- Verify npm command patterns
- Add Supabase-specific operations section

### Validation:

```bash
test -f .claude/commands/execute-ops.md && echo "✅ Command 3 added"
```

---

## 📝 **PHASE 4: REMOVE OUTDATED COMMANDS**

### Archive (don't delete):

```bash
# Create archive directory
mkdir -p .claude/commands/archive

# Move outdated commands
mv .claude/commands/execute-prp_daggergm.md .claude/commands/archive/
mv .claude/commands/generate-prp_daggergm.md .claude/commands/archive/

# Document archival
echo "Archived $(date): PRP workflow commands (outdated)" >> .claude/commands/archive/README.md
```

### Validation:

```bash
test -f .claude/commands/archive/execute-prp_daggergm.md && echo "✅ Commands archived"
```

---

## 📝 **PHASE 5: CREATE COMMANDS README**

### File: `.claude/commands/README.md`

```markdown
# DaggerGM Slash Commands

Executable commands for systematic development workflows.

## Development Commands

- **`/execute-feature`** - Implement features with TDD workflow
  - Usage: `/execute-feature documentation/FEATURE_[name].md`
  - Pattern: RED → GREEN → REFACTOR
  - Validates: Tests, lint, coverage

- **`/test-integration`** - Write integration tests with TDD
  - Usage: `/test-integration [feature-name]`
  - Pattern: Integration-first (80/15/5)
  - Validates: Real database, no DB mocking

- **`/setup-testing`** - Initialize testing infrastructure
  - Usage: `/setup-testing`
  - Sets up: Vitest, Supabase local, MSW
  - One-time setup

## Database Commands

- **`/execute-db-ops`** - Database operations (NEW)
  - Usage: `/execute-db-ops documentation/DATABASE/[operation].md`
  - Operations: Migrations, RLS, schema changes
  - Safety: Mandatory checkpoints, rollback plans

## Code Quality Commands

- **`/execute-refactor`** - Refactor large files (NEW)
  - Usage: `/execute-refactor documentation/REFACTOR/[file].md`
  - Trigger: Files >300 lines
  - Pattern: Checkpoint-driven extraction

- **`/execute-code-review`** - Comprehensive code reviews
  - Usage: `/execute-code-review [PR-URL|branch-name]`
  - Validates: Security, quality, tests, CLAUDE.md compliance

- **`/execute-fixes`** - Bug fixes and stability
  - Usage: `/execute-fixes documentation/FIXES/[issue].md`
  - Pattern: Systematic issue resolution

## Operations Commands

- **`/execute-ops`** - General operations (NEW)
  - Usage: `/execute-ops documentation/OPS/[operation].md`
  - Operations: Git, config, dependencies, infrastructure
  - Safety: 3-phase checkpoints

## Archived Commands

The following commands are archived (outdated workflow):

- `execute-prp_daggergm.md`
- `generate-prp_daggergm.md`

See `.claude/commands/archive/` for historical reference.

## Command Patterns

All commands follow this structure:

1. **Pre-flight checks** - Validate environment, read specs
2. **Planning phase** - TodoWrite breakdown, risk assessment
3. **Execution phase** - Systematic implementation
4. **Validation phase** - Tests, lint, coverage
5. **Documentation** - Update NEXT_STEPS, lessons learned

## Integration with CLAUDE.md

Commands are referenced in CLAUDE.md under "Slash Commands (Automation)".
```

### Validation:

```bash
test -f .claude/commands/README.md && echo "✅ Commands README created"
```

---

## 📝 **PHASE 6: UPDATE CLAUDE.MD**

### Update Slash Commands section:

```markdown
### 🤖 Slash Commands (Automation)

**Development:**

- `/execute-feature` → Implement feature with TDD workflow
- `/test-integration` → Write integration tests (80/15/5)
- `/setup-testing` → Initialize test infrastructure

**Database:**

- `/execute-db-ops` → Database operations (migrations, RLS, schema)

**Code Quality:**

- `/execute-refactor` → Refactor files >300 lines with checkpoints
- `/execute-code-review` → Comprehensive code review
- `/execute-fixes` → Bug fixes and stability improvements

**Operations:**

- `/execute-ops` → General operations (git, config, dependencies)
```

### Validation:

```bash
grep -q "execute-db-ops" CLAUDE.md && echo "✅ CLAUDE.md updated"
```

---

## ✅ **FINAL VALIDATION**

### Comprehensive Validation Suite:

```bash
# 1. Count command files (should be 7 active + archive)
ls -1 .claude/commands/*.md | wc -l
# Expected: 8 (7 commands + README)

# 2. Verify new commands exist
test -f .claude/commands/execute-db-ops.md && echo "✅ DB ops added"
test -f .claude/commands/execute-refactor.md && echo "✅ Refactor added"
test -f .claude/commands/execute-ops.md && echo "✅ Ops added"

# 3. Verify old commands archived
test -f .claude/commands/archive/execute-prp_daggergm.md && echo "✅ PRP archived"

# 4. Verify README exists
test -f .claude/commands/README.md && echo "✅ README exists"

# 5. Verify CLAUDE.md updated
grep -q "execute-db-ops" CLAUDE.md && echo "✅ CLAUDE.md references new commands"
```

---

## 🎯 **SUCCESS METRICS**

After completion:

- ✅ 3 new commands added (db-ops, refactor, ops)
- ✅ 2 outdated commands archived
- ✅ Commands README created
- ✅ CLAUDE.md updated with command reference
- ✅ All commands adapted for DaggerGM (Supabase, Next.js, no Docker)

---

## 📚 **NEXT STEPS**

After commands are added:

1. **Test Commands**: Create sample operation documents
2. **Team Training**: Document command usage
3. **Create Templates**: Add example operation docs in `documentation/`
4. **CI Integration**: Add command validations to GitHub Actions

---

**Version**: 1.0
**Created**: 2025-10-23
**Execution Command**: `/execute-ops documentation/SETUP_commands.md`
**Estimated Duration**: 1-2 hours
**Reversible**: Yes (git revert)
