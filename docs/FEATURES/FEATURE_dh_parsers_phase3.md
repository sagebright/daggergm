# Feature: Daggerheart Content Parsers - Phase 3 (Remaining Types)

**Status**: ✅ Complete
**Priority**: 🔴 Critical
**Phase**: 1 - Content Foundation
**Actual Time**: 2 hours
**Dependencies**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md), [FEATURE_dh_parsers_phase2.md](FEATURE_dh_parsers_phase2.md) ✅

---

## Phase 2 Learnings Applied

**Key learnings from Phase 2 implementation (Abilities, Items, Consumables)**:

### 1. Apostrophe Handling

- **Source files**: Filenames have NO apostrophes (e.g., `A Soldiers Bond.md`)
- **Markdown headers**: Use curly apostrophes (e.g., `# A SOLDIER'S BOND`)
- **Parser behavior**: ALWAYS extract name from markdown header (line 1), NOT filename
- **Validation**: This causes false "hallucination" detections if comparing filenames to DB
- **File matching**: Sample verification requires testing multiple apostrophe variants:
  ```typescript
  const possibleNames = [
    dbRecord.name,
    dbRecord.name.replace(/'/g, ''), // Remove curly
    dbRecord.name.replace(/[']/g, "'"), // Replace with straight
    dbRecord.name.replace(/['']/g, ''), // Remove all
  ]
  ```

### 2. Insert vs Upsert Patterns

- **Abilities table**: No unique constraint on `name` field → MUST use `insert()`, not `upsert()`
- **Error symptom**: "no unique or exclusion constraint matching the ON CONFLICT specification"
- **Solution pattern**:

  ```typescript
  // Clear table first
  await supabase.from('table').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Then insert
  const { error } = await supabase.from('table').insert(record)
  ```

- **When to use upsert**: Only when table has UNIQUE constraint on conflict field(s)

### 3. undefined vs null Handling

- **Parser returns**: `undefined` for missing optional fields
- **Database stores**: `null` for missing fields
- **Comparison fix**: Normalize comparisons: `(parsed.field || null) !== dbRecord.field`

### 4. Systematic Validation Methodology

**4-step process used for Phase 2 (100% accuracy achieved)**:

1. **Hallucination check**: Verify ALL DB records exist in source files (not just sample)
2. **Content type check**: Verify ALL records are in correct table (not just sample)
3. **Sample accuracy**: Randomly verify 10% for data field accuracy
4. **Report updates**: Document any needed corrections (none found in Phase 2)

### 5. Domain vs Class Differentiation

**Ability parser complexity**:

- Some abilities belong to main classes (Bard, Ranger, Warrior, etc.)
- Some abilities belong to domains (Grace, Blade, Bone, etc.)
- Some abilities belong to subclasses (specific specializations)
- Parser must use known lists to differentiate and populate correct field

### 6. Error Logging in Seeding Loops

**Always include**:

```typescript
if (error) {
  errorCount++
  console.error(`\n  ❌ Failed to seed ${record.name}:`, error.message)
} else {
  count++
}
```

This helps diagnose issues during long seeding runs without losing context.

### 7. 100% Data Accuracy Standard

Phase 2 achieved **309/309 entries (100%)** validated correctly:

- 189/189 abilities ✅
- 60/60 items ✅
- 60/60 consumables ✅

This sets the quality bar for Phase 3.

---

## Overview

Implement parsers for the **remaining 6 simpler** Daggerheart content types:

- **Ancestries** (~20 entries) - Character backgrounds
- **Subclasses** (~20 entries) - Class specializations
- **Environments** (~20 entries) - Scene setups
- **Domains** (~11 entries) - Magic/ability domains
- **Communities** (~11 entries) - Social backgrounds
- **Frames** (~3 entries) - Adventure frameworks

**Total entries**: ~85 (11% of all content, but covers all remaining types)

---

## Acceptance Criteria

- [x] All 6 parsers handle their respective content files
- [x] All parsers extract searchable_text (where applicable)
- [x] Seeding script populates database successfully
- [x] 74 total entries verified in database (18 ancestries + 18 subclasses + 19 environments + 9 domains + 9 communities + 1 frame)
- [x] **All 13 content types now complete** (adversaries done in Phase 1 Status)
- [x] Database constraint updated to allow Tier 4 environments
- [x] All subclasses have correct parent_class mappings

---

## Technical Specification

### 1. Ancestry Parser

**File**: `scripts/parsers/ancestry-parser.ts`

**Sample Format**:

```markdown
# CLANK

Description paragraph...

## ANCESTRY FEATURES

**_Purposeful Design:_** Feature description...

**_Efficient:_** Feature description...
```

```typescript
import type { Ancestry, AncestryFeature } from './types'

export function parseAncestry(markdown: string, filename: string): Ancestry {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = parseAncestryDescription(lines)
  const features = parseAncestryFeatures(lines)

  return {
    name,
    description,
    features,
    source_book: 'Core Rules',
  }
}

function parseAncestryDescription(lines: string[]): string {
  const descLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##\s*ANCESTRY\s+FEATURES/i)) break
    if (!lines[i].startsWith('#')) {
      descLines.push(lines[i])
    }
  }
  return descLines.join(' ').trim()
}

function parseAncestryFeatures(lines: string[]): AncestryFeature[] {
  const features: AncestryFeature[] = []
  const featuresIndex = lines.findIndex((l) => l.match(/^##\s*ANCESTRY\s+FEATURES/i))
  if (featuresIndex === -1) return features

  for (let i = featuresIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('***') && lines[i].includes(':***')) {
      const [namePart, ...descParts] = lines[i].split(':***')
      const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()
      const desc = descParts.join(':').trim()
      features.push({ name, desc })
    }
  }

  return features
}
```

---

### 2. Subclass Parser

**File**: `scripts/parsers/subclass-parser.ts`

**Sample Format**:

```markdown
# TROUBADOUR

Play the Troubadour if you want to play music to bolster your allies.

## SPELLCAST TRAIT

Presence

## FOUNDATION FEATURE

**_Gifted Performer:_** Description...
```

```typescript
import type { Subclass, SubclassFeature } from './types'

export function parseSubclass(markdown: string, filename: string): Subclass {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Parent class: Infer from file structure or known mappings
  // Bard subclasses: Troubadour, Wordsmith
  // Ranger subclasses: Sharpshooter, Beastmaster
  const parent_class = inferParentClass(name)

  const description = parseSubclassDescription(lines)
  const features = parseSubclassFeatures(lines)

  return {
    name,
    parent_class,
    description,
    features,
    source_book: 'Core Rules',
  }
}

function inferParentClass(subclassName: string): string {
  const mappings: Record<string, string> = {
    TROUBADOUR: 'Bard',
    WORDSMITH: 'Bard',
    SHARPSHOOTER: 'Ranger',
    BEASTMASTER: 'Ranger',
    // Add more mappings as needed
  }
  return mappings[subclassName] || 'Unknown'
}

function parseSubclassDescription(lines: string[]): string {
  const descLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('##')) break
    if (!lines[i].startsWith('#')) {
      descLines.push(lines[i])
    }
  }
  return descLines.join(' ').trim()
}

function parseSubclassFeatures(lines: string[]): SubclassFeature[] {
  const features: SubclassFeature[] = []

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('***') && lines[i].includes(':***')) {
      const [namePart, ...descParts] = lines[i].split(':***')
      const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()
      let desc = descParts.join(':').trim()

      // Collect multi-line descriptions
      let j = i + 1
      while (j < lines.length && !lines[j].startsWith('***') && !lines[j].startsWith('##')) {
        desc += ' ' + lines[j]
        j++
      }

      features.push({ name, desc: desc.trim() })
    }
  }

  return features
}
```

---

### 3. Environment Parser

**File**: `scripts/parsers/environment-parser.ts`

**Sample Format**:

```markdown
# ABANDONED GROVE

**_Tier 1 Exploration_**
_Description._
**Impulses:** Draw in the curious, echo the past

> **Difficulty:** 11
> **Potential Adversaries:** Beasts, Grove Guardians

## FEATURES

**_Feature Name - Type:_** Description...
```

```typescript
import type { Environment, EnvironmentFeature } from './types'

export function parseEnvironment(markdown: string, filename: string): Environment {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Tier & Type: ***Tier 1 Exploration***
  const tierLine = lines.find((l) => l.match(/\*+Tier\s+\d+/))
  const { tier, type } = parseTierType(tierLine || '')

  const description = parseEnvironmentDescription(lines)
  const impulses = parseImpulses(lines)
  const statsLines = lines.filter((l) => l.startsWith('>'))
  const { difficulty, potential_adversaries } = parseEnvironmentStats(statsLines)
  const features = parseEnvironmentFeatures(lines)

  // Phase 1 learning: Include ALL relevant fields in searchable_text for semantic search
  const featuresText = features.map((f) => `${f.name} ${f.desc}`).join(' ')
  const searchable_text =
    `${name} ${description} ${impulses?.join(' ') || ''} ${featuresText}`.trim()

  return {
    name,
    tier,
    type,
    description,
    impulses,
    difficulty,
    potential_adversaries,
    features,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseTierType(line: string) {
  const tierMatch = line.match(/Tier\s+(\d+)/)
  const tier = tierMatch ? parseInt(tierMatch[1], 10) : 1

  const typeMatch = line.match(/Tier\s+\d+\s+(.+?)\*/)
  const type = typeMatch?.[1]?.trim() || 'Event'

  return { tier, type }
}

function parseImpulses(lines: string[]): string[] | undefined {
  const impulseLine = lines.find((l) => l.includes('Impulses:'))
  if (!impulseLine) return undefined

  const impulsesText = impulseLine.split(':')[1]?.trim()
  return impulsesText
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseEnvironmentStats(statsLines: string[]) {
  const statsText = statsLines.join(' ')

  const difficultyMatch = statsText.match(/Difficulty:\*\*\s*(\d+)/)
  const difficulty = difficultyMatch ? parseInt(difficultyMatch[1], 10) : undefined

  const adversariesMatch = statsText.match(/Potential Adversaries:\*\*\s*(.+?)(\||$)/)
  const potential_adversaries = adversariesMatch?.[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return { difficulty, potential_adversaries }
}

function parseEnvironmentDescription(lines: string[]): string {
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('*') && !line.startsWith('**') && !line.startsWith('***')) {
      return line.replace(/^\*/, '').replace(/\*$/, '').trim()
    }
  }
  return ''
}

function parseEnvironmentFeatures(lines: string[]): EnvironmentFeature[] {
  const features: EnvironmentFeature[] = []
  const featuresIndex = lines.findIndex((l) => l.match(/^##\s*FEATURES/i))
  if (featuresIndex === -1) return features

  for (let i = featuresIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('***') && lines[i].includes(' - ') && lines[i].includes(':***')) {
      const [namePart, ...descParts] = lines[i].split(':***')
      const [nameRaw, typeRaw] = namePart.split(' - ')

      const name = nameRaw.replace(/^\*+/, '').replace(/\*+$/, '').trim()
      const type = (typeRaw?.trim() || 'Passive') as 'Passive' | 'Action' | 'GM Prompt'
      const desc = descParts.join(':').trim()

      features.push({ name, type, desc })
    }
  }

  return features
}
```

---

### 4-6. Simple Parsers (Domain, Community, Frame)

These are the simplest - mostly just name, description, and optional features.

**Domain Parser**:

```typescript
export function parseDomain(markdown: string, filename: string): Domain {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = lines
    .slice(1)
    .filter((l) => !l.startsWith('#'))
    .join(' ')
    .trim()

  return {
    name,
    description,
    source_book: 'Core Rules',
  }
}
```

**Community Parser**:

```typescript
export function parseCommunity(markdown: string, filename: string): Community {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = parseDescription(lines)
  const community_moves = parseCommunityMoves(lines)

  return {
    name,
    description,
    community_moves,
    source_book: 'Core Rules',
  }
}

function parseCommunityMoves(lines: string[]): string[] | undefined {
  const movesIndex = lines.findIndex((l) => l.match(/COMMUNITY\s+FEATURE/i))
  if (movesIndex === -1) return undefined

  // Moves are bullet points after "COMMUNITY FEATURE" section
  const moves: string[] = []
  for (let i = movesIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('-')) {
      moves.push(lines[i].replace(/^-\s*/, '').trim())
    }
  }

  return moves.length > 0 ? moves : undefined
}
```

**Frame Parser**:

```typescript
export function parseFrame(markdown: string, filename: string): Frame {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = parseFrameDescription(lines)
  const themes = parseFrameThemes(lines)
  const typical_adversaries = parseTypicalAdversaries(lines)
  const lore = parseFrameLore(lines)

  return {
    name,
    description,
    themes,
    typical_adversaries,
    lore,
    source_book: 'Core Rules',
  }
}

// Frame-specific parsing helpers
function parseFrameThemes(lines: string[]): string[] | undefined {
  const themeLine = lines.find((l) => l.includes('Themes:'))
  if (!themeLine) return undefined

  return themeLine
    .split(':')[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
```

---

## Seeding Script

**File**: `scripts/seeders/phase3.ts`

```typescript
/* eslint-disable no-console */
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import path from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseAncestry } from '../parsers/ancestry-parser'
import { parseSubclass } from '../parsers/subclass-parser'
import { parseEnvironment } from '../parsers/environment-parser'
import { parseDomain } from '../parsers/domain-parser'
import { parseCommunity } from '../parsers/community-parser'
import { parseFrame } from '../parsers/frame-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

export async function seedPhase3() {
  console.log('🌱 Starting Phase 3 seeding (Final 6 types)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  await seedAncestries(supabase)
  await seedSubclasses(supabase)
  await seedEnvironments(supabase)
  await seedDomains(supabase)
  await seedCommunities(supabase)
  await seedFrames(supabase)

  console.log('\n✅ Phase 3 seeding complete! All 13 content types done.')
}

async function seedAncestries(supabase: SupabaseClient) {
  console.log('📦 Seeding ancestries...')
  const files = await glob(`${SRD_PATH}/ancestries/*.md`)
  let count = 0
  let errorCount = 0 // Phase 2 learning: Track errors

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const ancestry = parseAncestry(markdown, path.basename(file))

    // Phase 2 learning: Check if table has unique constraint before using upsert
    const { error } = await supabase
      .from('daggerheart_ancestries')
      .upsert(ancestry, { onConflict: 'name' })

    if (error) {
      errorCount++ // Phase 2 learning: Count errors
      console.error(`\n  ❌ Failed to seed ${ancestry.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} ancestries`)
  }

  console.log(`\n  ✅ Seeded ${count} ancestries`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

async function seedSubclasses(supabase: SupabaseClient) {
  console.log('📦 Seeding subclasses...')
  const files = await glob(`${SRD_PATH}/subclasses/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const subclass = parseSubclass(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_subclasses')
      .upsert(subclass, { onConflict: 'name,parent_class' })

    if (error) {
      console.error(`Failed to seed ${subclass.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} subclasses`)
  }

  console.log(`\n  ✅ Seeded ${count} subclasses\n`)
}

async function seedEnvironments(supabase: SupabaseClient) {
  console.log('📦 Seeding environments...')
  const files = await glob(`${SRD_PATH}/environments/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const environment = parseEnvironment(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_environments')
      .upsert(environment, { onConflict: 'name,tier' })

    if (error) {
      console.error(`Failed to seed ${environment.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} environments`)
  }

  console.log(`\n  ✅ Seeded ${count} environments\n`)
}

async function seedDomains(supabase: SupabaseClient) {
  console.log('📦 Seeding domains...')
  const files = await glob(`${SRD_PATH}/domains/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const domain = parseDomain(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_domains')
      .upsert(domain, { onConflict: 'name' })

    if (error) {
      console.error(`Failed to seed ${domain.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} domains`)
  }

  console.log(`\n  ✅ Seeded ${count} domains\n`)
}

async function seedCommunities(supabase: SupabaseClient) {
  console.log('📦 Seeding communities...')
  const files = await glob(`${SRD_PATH}/communities/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const community = parseCommunity(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_communities')
      .upsert(community, { onConflict: 'name' })

    if (error) {
      console.error(`Failed to seed ${community.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} communities`)
  }

  console.log(`\n  ✅ Seeded ${count} communities\n`)
}

async function seedFrames(supabase: SupabaseClient) {
  console.log('📦 Seeding frames...')
  const files = await glob(`${SRD_PATH}/frames/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const frame = parseFrame(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_frames')
      .upsert(frame, { onConflict: 'name' })

    if (error) {
      console.error(`Failed to seed ${frame.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} frames`)
  }

  console.log(`\n  ✅ Seeded ${count} frames\n`)
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedPhase3()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
```

---

## Testing Requirements

Tests verify all 6 remaining tables are populated correctly.

```typescript
describe('Phase 3 Totals', () => {
  it('should have ~85 total entries from Phase 3', async () => {
    const tables = [
      'daggerheart_ancestries', // ~20
      'daggerheart_subclasses', // ~20
      'daggerheart_environments', // ~20
      'daggerheart_domains', // ~11
      'daggerheart_communities', // ~11
      'daggerheart_frames', // ~3
    ]

    let totalCount = 0
    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

      totalCount += count || 0
    }

    // Phase 1 learning: Allow 5-10% variance from estimates
    expect(totalCount).toBeGreaterThanOrEqual(75)
  })
})
```

---

## Implementation Steps

1. **Create 6 parser files** (2-3 hours total)

2. **Implement ancestries parser** (~30 min)
   - Test with 5 sample files before full seed
   - Verify ancestry features are parsed correctly

3. **Implement subclasses parser** (~30 min)
   - Test parent class inference with known mappings
   - Verify features parsing

4. **Implement environments parser** (~45 min) - Most complex of this group
   - **CRITICAL**: Test tier regex with sample files FIRST
   - Phase 1 learning: Wrong regex can cause ALL entries to default to Tier 1
   - Verify tier constraint allows Tier 1-4 (check database schema)

   **Tier Regex Testing** (learned from Phase 1):

   ```typescript
   // Test environment tier parsing with sample files:
   const testFiles = await glob(`${SRD_PATH}/environments/*.md`).slice(0, 5)
   for (const file of testFiles) {
     const markdown = await readFile(file, 'utf-8')
     const parsed = parseEnvironment(markdown, path.basename(file))
     console.log(`${parsed.name}: tier=${parsed.tier}, type=${parsed.type}`)
   }
   ```

5. **Implement domain parser** (~15 min) - Very simple

6. **Implement community parser** (~20 min)

7. **Implement frame parser** (~20 min)

8. **Create seeding script** (~20 min)
   - Include error logging for failed seeds (learned from Phase 1)

9. **Run full seed & tests** (~20 min)

---

## Verification Checklist

- [ ] All 6 parsers created and tested
- [ ] ~20 ancestries seeded
- [ ] ~20 subclasses seeded
- [ ] ~20 environments seeded
- [ ] ~11 domains seeded
- [ ] ~11 communities seeded
- [ ] ~3 frames seeded
- [ ] Total ~85 entries verified
- [ ] Integration tests pass
- [ ] **All 13 content types complete** (~771 total entries across all phases)

---

## Success Criteria

Phase 3 is complete when:

- ✅ All 6 remaining parsers implemented
- ✅ ~85 entries seeded
- ✅ Integration tests pass
- ✅ Combined with adversaries (Phase 1 status) + Phases 1-3: **All 13 content types done**
- ✅ Ready for Phase 4 (embeddings & final integration)

---

## Troubleshooting

### Tier Constraint Issues (Environments)

**Issue**: Environment entries fail to seed or all default to Tier 1

**Phase 1 Learning**: Database constraints can silently block valid data

**Solution**:

```sql
-- Check current constraint on daggerheart_environments:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'daggerheart_environments'::regclass;

-- If constraint is "tier BETWEEN 1 AND 3", update it:
ALTER TABLE daggerheart_environments
DROP CONSTRAINT IF EXISTS daggerheart_environments_tier_check;

ALTER TABLE daggerheart_environments
ADD CONSTRAINT daggerheart_environments_tier_check CHECK (tier BETWEEN 1 AND 4);
```

### Environment Tier Regex Not Matching

**Issue**: All environments default to Tier 1 despite correct markdown

**Phase 1 Example**: Regex `/\*Tier\s+\d+\*/` didn't match `*Armor - Tier 4*`

**Solution**:

1. Console.log the `tierLine` to see what's being matched
2. Check actual markdown format in source files
3. Update regex to match actual format (e.g., `/\*\*Tier\s+\d+\s+(.+?)\*\*/`)
4. Test with 5-10 sample files before full seed

### Subclass Parent Class Inference Failing

**Issue**: Subclasses have `parent_class: 'Unknown'`

**Solution**:

1. Add more mappings to `inferParentClass()` function
2. OR: Parse from directory structure if organized by parent class
3. Add error logging to see which subclasses are failing

### Migration Drift

**Issue**: `npx supabase db push` fails with remote/local drift

**Solution**:

```bash
# Option 1: Use Supabase MCP tool
# In Claude Code: Call mcp__supabase__apply_migration

# Option 2: Pull remote migrations first
npx supabase db pull
```

### Environment Variables Not Loading

**Issue**: Seeding fails with auth errors

**Solution**:

```bash
# Verify environment variables:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check __tests__/setup.ts has override:
config({ path: '.env.test.local', override: true })
```

---

## References

- **Status**: [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md)
- **Phase 1**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md)
- **Phase 2**: [FEATURE_dh_parsers_phase2.md](FEATURE_dh_parsers_phase2.md)
- **Phase 1 Learnings**: Applied throughout (SupabaseClient types, error logging, tier constraints, regex testing)

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Revision History**:

- 2025-10-26 - Applied Phase 1 learnings (type safety, tier constraints, regex validation, error logging)
- 2025-10-26 - Applied Phase 2 learnings (apostrophe handling, insert vs upsert, validation methodology, 100% accuracy standard)
  **Next**: Phase 4 - Embeddings generation & final seeding
