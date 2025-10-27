# Daggerheart Content Database - Implementation Status

**Feature Branch**: `feature/daggerheart-content-database`
**Started**: 2025-10-26
**Status**: 🟡 In Progress (Phase 1 Complete - TDD RED ✅)

---

## ✅ Completed

### Phase 1: Database Schema & Tests (TDD RED)

1. **Migration File Created** ✅
   - File: [supabase/migrations/00008_daggerheart_content_tables.sql](../supabase/migrations/00008_daggerheart_content_tables.sql)
   - All 13 tables created with proper schema
   - Vector embeddings (1536 dimensions) for semantic search
   - Full-text search indexes using PostgreSQL GIN
   - Migration successfully applied to remote Supabase

2. **Integration Tests Written** ✅
   - File: [**tests**/integration/daggerheart-content.test.ts](../__tests__/integration/daggerheart-content.test.ts)
   - 27 comprehensive tests covering all 13 tables
   - Tests for data integrity, counts, specific entries, embeddings
   - **TDD RED Phase Confirmed**: All 27 tests failing as expected (no data seeded yet)

3. **Parser Infrastructure** ✅
   - Types file: [scripts/parsers/types.ts](../scripts/parsers/types.ts)
   - Adversary parser: [scripts/parsers/adversary-parser.ts](../scripts/parsers/adversary-parser.ts)
   - MVP seeding script: [scripts/seed-adversaries-mvp.ts](../scripts/seed-adversaries-mvp.ts)

### Database Tables Created (13 total)

| Table                      | Expected Entries | Status          |
| -------------------------- | ---------------- | --------------- |
| `daggerheart_adversaries`  | ~130             | ✅ Schema ready |
| `daggerheart_weapons`      | ~194             | ✅ Schema ready |
| `daggerheart_abilities`    | ~191             | ✅ Schema ready |
| `daggerheart_consumables`  | ~62              | ✅ Schema ready |
| `daggerheart_items`        | ~62              | ✅ Schema ready |
| `daggerheart_armor`        | ~36              | ✅ Schema ready |
| `daggerheart_ancestries`   | ~20              | ✅ Schema ready |
| `daggerheart_subclasses`   | ~20              | ✅ Schema ready |
| `daggerheart_environments` | ~20              | ✅ Schema ready |
| `daggerheart_classes`      | ~11              | ✅ Schema ready |
| `daggerheart_domains`      | ~11              | ✅ Schema ready |
| `daggerheart_communities`  | ~11              | ✅ Schema ready |
| `daggerheart_frames`       | ~3               | ✅ Schema ready |
| **TOTAL**                  | **~771 entries** |                 |

---

## 🔄 In Progress

### Markdown Parsers (1/13 complete)

- ✅ Adversary parser implemented
- ⏳ Need 12 more parsers (see "Next Steps" below)

---

## 📋 Next Steps (GREEN Phase)

### 1. Complete Remaining Parsers

Create parsers for the remaining 12 content types. Each parser should:

- Parse markdown from `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/{type}/*.md`
- Extract structured data matching database schema
- Build searchable_text field for full-text search
- Handle edge cases and malformed markdown gracefully

**Files to create:**

```
scripts/parsers/
├── weapon-parser.ts        (~194 entries) - Priority HIGH
├── class-parser.ts          (~11 entries) - Priority HIGH
├── ability-parser.ts        (~191 entries)
├── armor-parser.ts          (~36 entries)
├── item-parser.ts           (~62 entries)
├── consumable-parser.ts     (~62 entries)
├── ancestry-parser.ts       (~20 entries)
├── subclass-parser.ts       (~20 entries)
├── environment-parser.ts    (~20 entries)
├── domain-parser.ts         (~11 entries)
├── community-parser.ts      (~11 entries)
└── frame-parser.ts          (~3 entries)
```

### 2. Complete Seeding Script

Expand `scripts/seed-adversaries-mvp.ts` into full script:

**File**: `scripts/seed-daggerheart-content.ts`

```typescript
import { seedAdversaries } from './seed-adversaries-mvp'
import { seedWeapons } from './seeders/weapons'
import { seedClasses } from './seeders/classes'
// ... etc for all 13 types

async function seedAllContent() {
  console.log('🌱 Starting Daggerheart content seeding...\n')

  await seedAdversaries() // ~130 entries
  await seedWeapons() // ~194 entries
  await seedClasses() // ~11 entries
  await seedSubclasses() // ~20 entries
  await seedAbilities() // ~191 entries
  await seedArmor() // ~36 entries
  await seedItems() // ~62 entries
  await seedConsumables() // ~62 entries
  await seedAncestries() // ~20 entries
  await seedEnvironments() // ~20 entries
  await seedDomains() // ~11 entries
  await seedCommunities() // ~11 entries
  await seedFrames() // ~3 entries

  console.log('\n✅ Seeding complete! ~771 entries added')
}
```

### 3. Generate Embeddings

**File**: `scripts/generate-embeddings.ts`

```typescript
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

// Generate embeddings for tables with embedding columns:
// - daggerheart_adversaries
// - daggerheart_environments
// - daggerheart_weapons
// - daggerheart_armor
// - daggerheart_items
// - daggerheart_consumables
// - daggerheart_frames

// Use OpenAI text-embedding-3-small model (1536 dimensions)
// Process in batches to avoid rate limits
// Cost estimate: ~$0.10 for 771 entries
```

### 4. Add Package Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "seed:daggerheart": "tsx scripts/seed-daggerheart-content.ts",
    "embeddings:generate": "tsx scripts/generate-embeddings.ts"
  }
}
```

### 5. Regenerate Types

```bash
npm run db:types
```

This will generate TypeScript types for all 13 new tables in `src/types/database.ts`.

### 6. Verify GREEN Phase

```bash
# Run integration tests - should now pass
npm test -- __tests__/integration/daggerheart-content.test.ts

# Expected: 27/27 tests passing ✅
```

### 7. Final Validation

```bash
npm run lint:fix
npm run typecheck
npm run test:coverage  # Must be ≥90%
npm run build
```

---

## 🎯 Implementation Approach

### Recommended Order

1. **Weapons parser** (High priority - most entries after adversaries/abilities)
2. **Classes parser** (High priority - complex structure, needed for subclasses/abilities)
3. **Subclasses parser** (Depends on classes)
4. **Abilities parser** (Most entries, complex relationships)
5. **Remaining parsers** (Can be done in parallel)

### Testing Strategy

For each parser:

1. **Unit test the parser**:

   ```typescript
   describe('parseWeapon', () => {
     it('should parse Advanced Battleaxe correctly', () => {
       const markdown = fs.readFileSync('test-fixtures/weapon.md', 'utf-8')
       const result = parseWeapon(markdown)
       expect(result.name).toBe('ADVANCED BATTLEAXE')
       expect(result.tier).toBe(3)
       // ... etc
     })
   })
   ```

2. **Seed a sample** (5-10 files):

   ```bash
   npx tsx scripts/seed-weapons-sample.ts
   ```

3. **Verify in database**:

   ```sql
   SELECT COUNT(*) FROM daggerheart_weapons;  -- Should be 5-10
   SELECT * FROM daggerheart_weapons LIMIT 1; -- Inspect structure
   ```

4. **Seed full dataset**:

   ```bash
   npx tsx scripts/seed-weapons.ts
   ```

5. **Run integration tests**:
   ```bash
   npm test -- __tests__/integration/daggerheart-content.test.ts
   ```

---

## 📊 Progress Tracking

| Task                 | Status      | Time Estimate    |
| -------------------- | ----------- | ---------------- |
| Database migration   | ✅ Complete | -                |
| Integration tests    | ✅ Complete | -                |
| Adversary parser     | ✅ Complete | -                |
| Weapon parser        | ⏳ Todo     | 1-2 hours        |
| Class parser         | ⏳ Todo     | 1-2 hours        |
| Ability parser       | ⏳ Todo     | 2-3 hours        |
| 8 remaining parsers  | ⏳ Todo     | 4-6 hours        |
| Seeding script       | ⏳ Todo     | 1 hour           |
| Embedding generation | ⏳ Todo     | 1 hour           |
| Type regeneration    | ⏳ Todo     | 5 min            |
| Test validation      | ⏳ Todo     | 15 min           |
| **TOTAL REMAINING**  |             | **~10-15 hours** |

---

## 🐛 Known Issues

1. **Environment Variable Loading**: The `tsx` runner may not load `.env.test.local` automatically. Workaround:

   ```bash
   export $(cat .env.test.local | xargs) && npx tsx scripts/seed-daggerheart-content.ts
   ```

2. **ES Module Syntax**: Scripts use ES modules. Ensure `import.meta.url` for main module detection instead of `require.main === module`.

---

## 📚 References

- **SRD Location**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/`
- **Supabase Project**: `ogvbbfzfljglfanceest` (JMK)
- **Database Schema**: [supabase/migrations/00008_daggerheart_content_tables.sql](../supabase/migrations/00008_daggerheart_content_tables.sql)
- **Feature Spec**: [docs/FEATURES/FEATURE_daggerheart_content_database.md](FEATURES/FEATURE_daggerheart_content_database.md)

---

## 💡 Tips for Implementation

1. **Use the Adversary Parser as Template**: Copy structure and adapt for each content type
2. **Test with Real Files Early**: Don't assume markdown format - verify with actual SRD files
3. **Handle BOM and Encoding**: Use `.replace(/^\uFEFF/, '')` to strip BOM characters
4. **Idempotent Seeding**: Always use `upsert` with `onConflict: 'name'` for safe re-runs
5. **Progress Indicators**: Use `process.stdout.write('\r...')` for real-time progress
6. **Error Handling**: Log errors but continue processing remaining files
7. **Embedding Batching**: Process embeddings in batches of 100 to avoid rate limits

---

**Last Updated**: 2025-10-26
**Next Action**: Implement weapon parser and class parser (highest priority)
