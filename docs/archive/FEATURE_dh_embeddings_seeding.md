# Feature: Daggerheart Content - Phase 4 (Embeddings & Final Integration)

**Status**: Ready to Start
**Priority**: 🔴 Critical
**Phase**: 1 - Content Foundation
**Estimated Time**: 2-3 hours
**Dependencies**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md) ✅, [FEATURE_dh_parsers_phase2.md](FEATURE_dh_parsers_phase2.md) ✅, [FEATURE_dh_parsers_phase3.md](FEATURE_dh_parsers_phase3.md) ✅ (all parsers complete)

---

## Phase 2 & 3 Learnings Applied

**Key learnings from Phase 2 & 3 implementations**:

### 1. Data Quality Standards

Phase 2 achieved **100% accuracy (309/309 entries)**:

- 189/189 abilities ✅
- 60/60 items ✅
- 60/60 consumables ✅

**Quality bar for embeddings**: Zero tolerance for inaccurate data. Generate embeddings only after validation confirms 100% accuracy.

### 2. Systematic Validation Before Embedding Generation

**4-step methodology** (must complete BEFORE generating embeddings):

1. **Hallucination check**: Verify ALL DB records exist in source files
2. **Content type check**: Verify ALL records are in correct table
3. **Sample accuracy**: Randomly verify 10% for data field accuracy
4. **Report updates**: Document and fix any corrections

**Rationale**: Embeddings are expensive (~$0.10 for 771 entries). Generate only once, after data is perfect.

### 3. Apostrophe Normalization

**Challenge**: Source filenames vs markdown headers vs database entries

- Filenames: `A Soldiers Bond.md` (no apostrophes)
- Headers: `# A SOLDIER'S BOND` (curly apostrophes ')
- Database: Stored as extracted from headers

**Impact on embeddings**: No impact - embeddings use `searchable_text` or `description` fields, not filenames

### 4. searchable_text Field Strategy

**Phase 2 pattern**: Include ALL relevant text for semantic search

```typescript
// For items
const searchable_text = `${name} ${description}`.trim()

// For abilities
const searchable_text = `${name} ${description}`.trim()

// For environments (Phase 3)
const featuresText = features.map((f) => `${f.name} ${f.desc}`).join(' ')
const searchable_text = `${name} ${description} ${impulses?.join(' ') || ''} ${featuresText}`.trim()
```

**Why comprehensive text matters**: Enables semantic queries like "underground insect creature" → finds "Acid Burrower"

### 5. Insert vs Upsert for Re-runs

**Learned from Phase 2**: Tables without unique constraints require special handling

**Embedding generation strategy**:

- Check for existing embeddings: `.is('embedding', null)`
- Only generate for rows missing embeddings
- Use `.update()` to set embedding (safer than upsert for tables without constraints)
- Makes re-runs safe and idempotent

### 6. Error Tracking in Long-Running Scripts

**Pattern from Phase 2**:

```typescript
let count = 0
let errorCount = 0

for (const row of rows) {
  try {
    // Generate embedding
    count++
  } catch (err) {
    errorCount++
    console.error(`\n  ❌ Failed for ${row.name}:`, err)
  }
}

console.log(`\n  ✅ Generated ${count} embeddings`)
if (errorCount > 0) {
  console.log(`  ⚠️  ${errorCount} errors encountered`)
}
```

This pattern is CRITICAL for embedding generation where individual failures shouldn't block entire process.

### 7. Cost Management

**Phase 1 data volume**: ~377 entries (weapons, classes, armor, adversaries)
**Phase 2 data volume**: 309 entries (abilities, items, consumables)
**Phase 3 actual volume**: 74 entries (18 ancestries, 18 subclasses, 19 environments, 9 domains, 9 communities, 1 frame)
**Total for embeddings**: ~760 entries

**Cost calculation** (text-embedding-3-small):

- Average text length: ~300 tokens
- 760 entries × 300 tokens = 228,000 tokens
- Cost: $0.00002 per 1K tokens = **~$0.0046** (under 1 cent!)
- Phase 2 estimate was conservative at $0.10

**Takeaway**: Embedding cost is negligible. Focus on data quality, not cost optimization.

### 8. Phase 3 Learnings: Database Constraints

**Challenge**: Database tier constraint blocked Tier 4 environments

- Schema had: `CHECK (tier BETWEEN 1 AND 3)`
- Actual data: 4 environments at Tier 4

**Solution**: Updated constraint via SQL:

```sql
ALTER TABLE daggerheart_environments
DROP CONSTRAINT daggerheart_environments_tier_check;

ALTER TABLE daggerheart_environments
ADD CONSTRAINT daggerheart_environments_tier_check CHECK (tier BETWEEN 1 AND 4);
```

**Impact on embeddings**: No impact - but validates importance of testing seeding with actual data before generating embeddings.

### 9. Phase 3 Learnings: Subclass Parent Class Inference

**Challenge**: Markdown files don't explicitly declare parent classes

- Subclass files only have name + description
- No structured field for parent class

**Solution**: Create comprehensive mapping in parser:

```typescript
function inferParentClass(subclassName: string): string {
  const mappings: Record<string, string> = {
    TROUBADOUR: 'Bard',
    WORDSMITH: 'Bard',
    'WARDEN OF RENEWAL': 'Druid',
    // ... all 18 subclasses mapped
  }
  return mappings[subclassName.toUpperCase()] || 'Unknown'
}
```

**Result**: Perfect distribution - 18 subclasses across 9 classes (exactly 2 per class)

**Impact on embeddings**: Ensures subclass embeddings can be filtered by parent class for class-specific queries.

### 10. Phase 3 Learnings: Simpler Content Types

**Observation**: Not all content types need complex parsing

- **Domains**: Just name + description
- **Communities**: Name + description + optional community_moves
- **Frames**: Only 1 entry (The Witherwild)

**Takeaway**: Parser complexity should match content structure. Simple parsers are faster to implement and test.

---

## Overview

**Final phase** of Daggerheart Content Database implementation:

1. **Generate vector embeddings** for semantic search (~771 entries)
2. **Create unified seeding script** that runs all phases
3. **Verify full database** with comprehensive tests
4. **Regenerate TypeScript types** from schema
5. **Update package.json** with seeding scripts
6. **Final validation** - all 27 integration tests pass

This phase brings together all previous work and makes the content database production-ready.

---

## Acceptance Criteria

- [ ] Vector embeddings generated for all searchable content
- [ ] Unified seeding script (`npm run seed:daggerheart`) works end-to-end
- [ ] All 27 integration tests pass (from original test file)
- [ ] TypeScript types regenerated and committed
- [ ] ~760 total entries verified across all 13 tables (377 Phase 1 + 309 Phase 2 + 74 Phase 3)
- [ ] Package.json scripts added for seeding & embeddings
- [ ] Documentation updated with completion status
- [ ] No TypeScript errors, linting passes, coverage ≥90%

---

## Technical Specification

### 1. Embedding Generation Script

**File**: `scripts/generate-embeddings.ts`

Vector embeddings enable semantic search (e.g., "underground insect creature" → finds "Acid Burrower").

```typescript
/* eslint-disable no-console */
import { OpenAI } from 'openai'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function generateEmbeddings() {
  console.log('🔮 Generating vector embeddings...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Tables with embedding columns
  const tables = [
    'daggerheart_adversaries', // ~130 entries
    'daggerheart_environments', // ~20 entries
    'daggerheart_weapons', // ~194 entries
    'daggerheart_armor', // ~36 entries
    'daggerheart_items', // ~62 entries
    'daggerheart_consumables', // ~62 entries
    'daggerheart_frames', // ~3 entries
  ]

  for (const table of tables) {
    await generateForTable(supabase, table)
  }

  console.log('\n✅ Embedding generation complete!')
  console.log('Total cost estimate: ~$0.10 for 771 entries')
}

async function generateForTable(supabase: SupabaseClient, tableName: string) {
  console.log(`📊 Generating embeddings for ${tableName}...`)

  // Phase 2 learning: Only process rows without embeddings (idempotent)
  const { data: rows } = await supabase
    .from(tableName)
    .select('id, name, searchable_text, description')
    .is('embedding', null)

  if (!rows || rows.length === 0) {
    console.log(`  ℹ️  No rows to process (all embeddings exist)\n`)
    return
  }

  console.log(`  Found ${rows.length} rows without embeddings`)

  let count = 0
  let errorCount = 0 // Phase 2 learning: Track errors
  const batchSize = 100 // Process in batches to avoid rate limits

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    for (const row of batch) {
      try {
        // Phase 2 learning: Use searchable_text (includes ALL relevant content)
        const textToEmbed = row.searchable_text || `${row.name} ${row.description || ''}`

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small', // 1536 dimensions
          input: textToEmbed.substring(0, 8000), // Truncate if too long
        })

        const embedding = response.data[0].embedding

        // Phase 2 learning: Use update() not upsert() for tables without unique constraints
        await supabase.from(tableName).update({ embedding }).eq('id', row.id)

        count++
        process.stdout.write(`\r  ✓ Generated ${count}/${rows.length} embeddings`)

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (err) {
        errorCount++ // Phase 2 learning: Count errors
        console.error(`\n  ❌ Failed for ${row.name}:`, err)
      }
    }
  }

  console.log(`\n  ✅ Generated ${count} embeddings for ${tableName}`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  generateEmbeddings()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}

export { generateEmbeddings }
```

---

### 2. Unified Seeding Script

**File**: `scripts/seed-daggerheart-content.ts`

Runs all phases in sequence.

```typescript
/* eslint-disable no-console */
import { seedAdversaries } from './seed-adversaries-mvp'
import { seedPhase1 } from './seeders/phase1'
import { seedPhase2 } from './seeders/phase2'
import { seedPhase3 } from './seeders/phase3'

async function seedAllContent() {
  console.log('🌱 Starting Daggerheart Content Database seeding...\n')
  console.log('This will seed ~771 entries across 13 tables\n')

  const startTime = Date.now()

  try {
    // Phase 0: Adversaries (from MVP script)
    console.log('=== PHASE 0: Adversaries (~130 entries) ===\n')
    await seedAdversaries()

    // Phase 1: Weapons, Classes, Armor (~241 entries)
    console.log('\n=== PHASE 1: Weapons, Classes, Armor (~241 entries) ===\n')
    await seedPhase1()

    // Phase 2: Abilities, Items, Consumables (~315 entries)
    console.log('\n=== PHASE 2: Abilities, Items, Consumables (~315 entries) ===\n')
    await seedPhase2()

    // Phase 3: Remaining 6 types (~85 entries)
    console.log('\n=== PHASE 3: Final 6 content types (~85 entries) ===\n')
    await seedPhase3()

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('✅ SEEDING COMPLETE!')
    console.log('='.repeat(60))
    console.log(`Time elapsed: ${elapsed}s`)
    console.log('Total entries: ~771 across 13 tables')
    console.log('\nNext steps:')
    console.log('1. Generate embeddings: npm run embeddings:generate')
    console.log('2. Regenerate types: npm run db:types')
    console.log('3. Run tests: npm test')
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    throw error
  }
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedAllContent()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export { seedAllContent }
```

---

### 3. Package.json Scripts

Add these scripts for easy execution:

```json
{
  "scripts": {
    "seed:daggerheart": "tsx scripts/seed-daggerheart-content.ts",
    "embeddings:generate": "tsx scripts/generate-embeddings.ts",
    "seed:full": "npm run seed:daggerheart && npm run embeddings:generate && npm run db:types"
  }
}
```

---

### 4. Semantic Search Helper Functions

**File**: `lib/supabase/search-content.ts`

Helper functions for semantic search once embeddings are generated.

```typescript
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function searchAdversaries(query: string, limit = 5) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Generate embedding for query
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const queryEmbedding = response.data[0].embedding

  // Semantic search using vector similarity
  const { data, error } = await supabase.rpc('match_adversaries', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) throw error
  return data
}

// Similar functions for other content types...
```

---

### 5. Database Search Functions (SQL)

These need to be added as migrations for semantic search:

```sql
-- Create function for adversary semantic search
CREATE OR REPLACE FUNCTION match_adversaries(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  tier int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    daggerheart_adversaries.id,
    daggerheart_adversaries.name,
    daggerheart_adversaries.description,
    daggerheart_adversaries.tier,
    1 - (daggerheart_adversaries.embedding <=> query_embedding) as similarity
  FROM daggerheart_adversaries
  WHERE daggerheart_adversaries.embedding IS NOT NULL
    AND 1 - (daggerheart_adversaries.embedding <=> query_embedding) > match_threshold
  ORDER BY daggerheart_adversaries.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create similar functions for other content types with embeddings
```

---

## Testing Requirements

**File**: Run the original comprehensive test file created in Phase 1 (TDD RED):

```bash
npm test -- __tests__/integration/daggerheart-content.test.ts
```

All **27 tests** should now pass:

- ✅ Adversaries table populated
- ✅ Weapons table populated
- ✅ Classes table populated
- ✅ Armor table populated
- ✅ Items table populated
- ✅ Consumables table populated
- ✅ Ancestries table populated
- ✅ Subclasses table populated
- ✅ Domains table populated
- ✅ Abilities table populated
- ✅ Communities table populated
- ✅ Environments table populated
- ✅ Frames table populated
- ✅ Embeddings generated for searchable content
- ✅ Overall database integrity (~900+ total entries)

---

## Implementation Steps

### Step 1: Create Embedding Script (1 hour)

```bash
touch scripts/generate-embeddings.ts
# Implement embedding generation (code above)
```

### Step 2: Create Unified Seeding Script (30 min)

```bash
touch scripts/seed-daggerheart-content.ts
# Import and call all phase seeders
```

### Step 3: Add Package Scripts (5 min)

Edit `package.json` and add the 3 scripts listed above.

### Step 4: Run Full Seed (10 min)

```bash
npm run seed:daggerheart
```

Expected output:

```
🌱 Starting Daggerheart Content Database seeding...

=== PHASE 0: Adversaries (~130 entries) ===
✓ Seeded 129/129 adversaries
✅ Seeded 129 adversaries

=== PHASE 1: Weapons, Classes, Armor (~241 entries) ===
✓ Seeded 194/194 weapons
✓ Seeded 11/11 classes
✓ Seeded 36/36 armor
✅ Phase 1 complete

=== PHASE 2: Abilities, Items, Consumables (~315 entries) ===
✓ Seeded 191/191 abilities
✓ Seeded 62/62 items
✓ Seeded 62/62 consumables
✅ Phase 2 complete

=== PHASE 3: Final 6 content types (~85 entries) ===
✓ Seeded 20/20 ancestries
✓ Seeded 20/20 subclasses
✓ Seeded 20/20 environments
✓ Seeded 11/11 domains
✓ Seeded 11/11 communities
✓ Seeded 3/3 frames
✅ Phase 3 complete

============================================================
✅ SEEDING COMPLETE!
============================================================
Time elapsed: 127.3s
Total entries: ~771 across 13 tables
```

### Step 5: Generate Embeddings (45 min)

```bash
npm run embeddings:generate
```

**Cost estimate**: ~$0.005 for 771 entries using text-embedding-3-small (Phase 2 learning: Cost is negligible)

### Step 6: Regenerate Types (5 min)

```bash
npm run db:types
```

This updates `src/types/database.ts` with all 13 new tables.

### Step 7: Run Integration Tests (10 min)

```bash
npm test -- __tests__/integration/daggerheart-content.test.ts
```

**Expected**: All 27 tests pass ✅

**Phase 2 learning**: If tests fail, use systematic validation:

1. Check for hallucinations (DB records not in source)
2. Check for misclassifications (records in wrong table)
3. Sample 10% for data accuracy
4. Fix issues BEFORE regenerating embeddings

### Step 8: Final Validation (20 min)

```bash
npm run lint:fix          # Should pass
npx tsc --noEmit          # Should pass
npm run test:coverage     # Should be ≥90%
npm run build             # Should succeed
```

---

## Verification Checklist

- [ ] Embedding script created and tested
- [ ] Unified seeding script created
- [ ] Package.json scripts added
- [ ] Full seed executed successfully (~771 entries)
- [ ] Embeddings generated for all searchable content
- [ ] TypeScript types regenerated
- [ ] All 27 integration tests pass
- [ ] Database totals verified (Phase 1 learning: allow 5-10% variance):
  - [ ] ~130 adversaries (≥120)
  - [ ] ~194 weapons (≥185)
  - [ ] ~191 abilities (≥180)
  - [ ] ~62 items (≥58)
  - [ ] ~62 consumables (≥58)
  - [ ] ~36 armor (≥32)
  - [ ] ~20 ancestries (≥18)
  - [ ] ~20 subclasses (≥18)
  - [ ] ~20 environments (≥18)
  - [ ] ~11 classes (≥9)
  - [ ] ~11 domains (≥9)
  - [ ] ~11 communities (≥9)
  - [ ] ~3 frames (≥3)
- [ ] Linting passes
- [ ] TypeScript compiles
- [ ] Coverage ≥90%
- [ ] Production build succeeds

---

## Success Criteria

Phase 4 (and entire feature) is complete when:

- ✅ All ~771 entries seeded successfully
- ✅ Vector embeddings generated for semantic search
- ✅ All 27 integration tests pass (TDD GREEN ✅)
- ✅ TypeScript types current
- ✅ Documentation updated
- ✅ Production-ready for use in adventure generation

---

## Post-Completion Tasks

### 1. Update Status Document

Edit [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md):

```markdown
**Status**: ✅ Complete
**Completed**: 2025-10-XX

All 4 phases complete:

- ✅ Phase 1: Weapons/Classes/Armor
- ✅ Phase 2: Abilities/Items/Consumables
- ✅ Phase 3: Remaining 6 types
- ✅ Phase 4: Embeddings & Integration

Total: ~771 entries across 13 tables
```

### 2. Archive FEATURE Documents

Move completed FEATURE docs to archive:

```bash
git mv docs/FEATURES/FEATURE_daggerheart_content_database.md docs/archive/
git mv docs/FEATURES/FEATURE_dh_parsers_phase1.md docs/archive/
git mv docs/FEATURES/FEATURE_dh_parsers_phase2.md docs/archive/
git mv docs/FEATURES/FEATURE_dh_parsers_phase3.md docs/archive/
git mv docs/FEATURES/FEATURE_dh_embeddings_seeding.md docs/archive/
```

### 3. Update FEATURES/README.md

Mark Content Database as complete.

### 4. Create Usage Documentation

Document how to use semantic search in generation pipeline (future work).

---

## Troubleshooting

### Embedding Generation Fails

**Issue**: Rate limit errors from OpenAI

**Solution**:

- Increase delay between requests (line with `setTimeout`)
- Reduce batch size from 100 to 50 or 25
- Use exponential backoff retry logic:
  ```typescript
  const maxRetries = 3
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create(...)
      break // Success
    } catch (err) {
      if (attempt === maxRetries - 1) throw err
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
    }
  }
  ```

### Seeding Takes Too Long

**Issue**: Full seed takes >10 minutes

**Solution**:

- Run phases in parallel (if no dependencies)
- Use batch inserts instead of individual upserts
- Increase database connection pool size
- **Phase 1 timing**: Full seed took ~2-3 minutes for 235 entries

### Tests Fail After Seeding

**Issue**: Integration tests fail unexpectedly

**Phase 2 Learning**: Use systematic 4-step validation process

**Solution**:

1. **Hallucination check**: Create verification script to compare DB to source files
   ```bash
   npx tsx scripts/verify-[content-type].ts
   ```
2. **Content type check**: Create content validation script
   ```bash
   npx tsx scripts/verify-[content-type]-content.ts
   ```
3. **Sample accuracy**: Create sample verification script (10% random sample)
   ```bash
   npx tsx scripts/sample-verify-[content-type].ts
   ```
4. **Fix data issues**: Re-run seeding after fixing parser bugs
5. **Only then**: Generate embeddings (expensive, do once)

- Check database counts manually
- Verify embeddings column is populated
- Re-run seed scripts (idempotent - safe to re-run)
- **Phase 1 learning**: Check test expectations allow 5-10% variance
- **Phase 2 learning**: 100% accuracy is achievable - don't settle for less

### Tier Constraint Blocking Seeds

**Issue**: Some entries fail to seed silently

**Phase 1 Example**: 53 Tier 4 weapons blocked by `CHECK (tier BETWEEN 1 AND 3)`

**Solution**:

```sql
-- Check ALL tier constraints:
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname LIKE '%tier%';

-- Update any that are "BETWEEN 1 AND 3":
ALTER TABLE table_name DROP CONSTRAINT constraint_name;
ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (tier BETWEEN 1 AND 4);
```

### Environment Variables Not Loading

**Issue**: Scripts fail with auth errors or wrong database

**Phase 1 Learning**: dotenv load order matters

**Solution**:

```bash
# Verify correct environment:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $OPENAI_API_KEY

# For tests, check __tests__/setup.ts:
config({ path: '.env.test.local', override: true })

# For scripts, add to top of file:
import { config } from 'dotenv'
config({ path: '.env.local' })
```

### Migration Drift

**Issue**: Cannot apply migrations due to remote/local mismatch

**Solution**:

```bash
# Option 1: Use Supabase MCP tool (preferred)
# In Claude Code: Call mcp__supabase__apply_migration

# Option 2: Pull remote migrations
npx supabase db pull

# Option 3: Reset local (DESTRUCTIVE - loses local changes)
npx supabase db reset
```

---

## References

- **Status**: [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md)
- **Phase 1**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md)
- **Phase 2**: [FEATURE_dh_parsers_phase2.md](FEATURE_dh_parsers_phase2.md)
- **Phase 3**: [FEATURE_dh_parsers_phase3.md](FEATURE_dh_parsers_phase3.md)
- **Phase 1 Learnings**: Applied throughout (SupabaseClient types, error logging, tier constraints, flexible test expectations)
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **pgvector**: https://github.com/pgvector/pgvector

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Revision History**:

- 2025-10-26 - Applied Phase 1 learnings (type safety, eslint-disable, tier constraints, comprehensive troubleshooting)
- 2025-10-26 - Applied Phase 2 learnings (100% accuracy standard, systematic validation, apostrophe handling, cost analysis, error tracking)
  **Final Phase**: This completes the Daggerheart Content Database feature 🎉
