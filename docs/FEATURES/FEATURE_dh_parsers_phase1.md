# Feature: Daggerheart Content Parsers - Phase 1 (High Priority)

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Content Foundation
**Estimated Time**: 3-4 hours
**Dependencies**: [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md) (Phase 1 complete)

---

## Overview

Implement parsers for the **3 highest-priority** Daggerheart content types: Weapons, Classes, and Armor. These are critical because:

- **Weapons** (~194 entries) - Largest dataset after adversaries/abilities
- **Classes** (~11 entries) - Required for subclasses and abilities parsers
- **Armor** (~36 entries) - Completes the combat equipment trio

**Total entries**: ~241 (31% of all content)

---

## Acceptance Criteria

- [ ] Weapon parser handles all 194 weapon files from SRD
- [ ] Class parser handles all 11 class files with complex structure
- [ ] Armor parser handles all 36 armor files
- [ ] All parsers extract searchable_text for full-text search
- [ ] Integration tests pass for these 3 tables
- [ ] Seeding script populates database successfully
- [ ] ~241 total entries verified in database

---

## Technical Specification

### 1. Weapon Parser

**File**: `scripts/parsers/weapon-parser.ts`

**Source Files**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/weapons/*.md`

**Sample Markdown Format**:

```markdown
# ADVANCED BATTLEAXE

**Trait:** Strength; **Range:** Melee; **Damage:** d10+9 phy; **Burden:** Two-Handed

**Feature:** —

_Primary Weapon - Tier 3_
```

**Parser Function**:

```typescript
import type { Weapon } from './types'

export function parseWeapon(markdown: string, filename: string): Weapon {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # ADVANCED BATTLEAXE
  const name = parseName(lines[0], filename)

  // Line 2: **Trait:** Strength; **Range:** Melee; **Damage:** d10+9 phy; **Burden:** Two-Handed
  const statsLine = lines.find((l) => l.includes('Trait:'))
  const stats = parseWeaponStats(statsLine || '')

  // Line 3: **Feature:** —
  const featureLine = lines.find((l) => l.includes('Feature:'))
  const feature = featureLine?.split(':')[1]?.trim() || null

  // Line 4: *Primary Weapon - Tier 3*
  const categoryTierLine = lines.find((l) =>
    l.match(/\*(Primary|Secondary)\s+Weapon\s+-\s+Tier\s+\d+\*/),
  )
  const { weapon_category, tier } = parseCategoryTier(categoryTierLine || '')

  const searchable_text = `${name} ${stats.trait} ${stats.damage} ${feature || ''}`.trim()

  return {
    name,
    weapon_category,
    tier,
    ...stats,
    feature: feature === '—' ? null : feature,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseWeaponStats(line: string) {
  // Parse: **Trait:** Strength; **Range:** Melee; **Damage:** d10+9 phy; **Burden:** Two-Handed
  const trait = line.match(/Trait:\*\*\s*([^;]+)/)?.[1]?.trim() || 'Strength'
  const range = line.match(/Range:\*\*\s*([^;]+)/)?.[1]?.trim() || 'Melee'
  const damage = line.match(/Damage:\*\*\s*([^;]+)/)?.[1]?.trim() || '1 phy'
  const burdenMatch = line.match(/Burden:\*\*\s*([^;\n]+)/)
  const burden = burdenMatch?.[1]?.trim() || null

  return { trait, range, damage, burden }
}

function parseCategoryTier(line: string) {
  // Parse: *Primary Weapon - Tier 3*
  const categoryMatch = line.match(/\*(Primary|Secondary)/)
  const weapon_category = (categoryMatch?.[1] || 'Primary') as 'Primary' | 'Secondary'

  const tierMatch = line.match(/Tier\s+(\d+)/)
  const tier = tierMatch ? parseInt(tierMatch[1], 10) : 1

  return { weapon_category, tier }
}

function parseName(firstLine: string, filename: string): string {
  if (firstLine && firstLine.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '').trim()
  }
  return filename.replace(/\.md$/i, '').replace(/_/g, ' ').toUpperCase()
}
```

---

### 2. Class Parser

**File**: `scripts/parsers/class-parser.ts`

**Source Files**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/classes/*.md`

**Sample Markdown Format**:

```markdown
# BARD

Bards are the most charismatic people in all the realms. ...

> **• DOMAINS:** [Grace](../domains/Grace.md) & [Codex](../domains/Codex.md)
> **• STARTING EVASION:** 10
> **• STARTING HIT POINTS:** 5
> **• CLASS ITEMS:** A romance novel or a letter never opened

## BARD'S HOPE FEATURE

**_Make a Scene:_** Spend 3 Hope to temporarily Distract a target within Close range...

## CLASS FEATURE

**_Rally:_** Once per session, describe how you rally the party...

## BACKGROUND QUESTIONS

_Answer any of the following background questions..._

- Who from your community taught you to have such confidence in yourself?
- You were in love once. Who did you adore, and how did they hurt you?
- You've always looked up to another bard. Who are they, and why do you idolize them?

## CONNECTIONS

_Ask your fellow players one of the following questions..._

- What made you realize we were going to be such good friends?
- What do I do that annoys you?
- Why do you grab my hand at night?
```

**Parser Function**:

```typescript
import type { Class, ClassFeature } from './types'

export function parseClass(markdown: string, filename: string): Class {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # BARD
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Everything before stats blockquote
  const description = parseDescription(lines)

  // Stats blockquote: > **• DOMAINS:** ...
  const statsLines = lines.filter((l) => l.startsWith('>'))
  const stats = parseClassStats(statsLines)

  // Hope feature: ## BARD'S HOPE FEATURE
  const hope_feature = parseHopeFeature(lines)

  // Class feature: ## CLASS FEATURE
  const class_feature = parseClassFeature(lines)

  // Background questions
  const background_questions = parseQuestions(lines, 'BACKGROUND QUESTIONS')

  // Connection questions
  const connection_questions = parseQuestions(lines, 'CONNECTIONS')

  return {
    name,
    description,
    ...stats,
    hope_feature,
    class_feature,
    background_questions,
    connection_questions,
    source_book: 'Core Rules',
  }
}

function parseClassStats(statsLines: string[]) {
  const statsText = statsLines.join(' ')

  // Extract domains: [Grace](link) & [Codex](link)
  const domainMatches = Array.from(statsText.matchAll(/\[([^\]]+)\]/g))
  const domains = domainMatches.map((m) => m[1])

  const starting_evasion = parseInt(
    statsText.match(/STARTING EVASION:\*\*\s*(\d+)/)?.[1] || '10',
    10,
  )

  const starting_hp = parseInt(statsText.match(/STARTING HIT POINTS:\*\*\s*(\d+)/)?.[1] || '5', 10)

  // Class items: comma-separated list after "CLASS ITEMS:**"
  const itemsMatch = statsText.match(/CLASS ITEMS:\*\*\s*(.+?)(\||$)/)
  const class_items = itemsMatch
    ? itemsMatch[1]
        .split(/,|or/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  return { domains, starting_evasion, starting_hp, class_items }
}

function parseHopeFeature(lines: string[]): ClassFeature | undefined {
  const hopeIndex = lines.findIndex((l) => l.match(/##\s*.*HOPE\s+FEATURE/i))
  if (hopeIndex === -1) return undefined

  // Next line should have feature format: ***Make a Scene:*** description
  let i = hopeIndex + 1
  while (i < lines.length && !lines[i].startsWith('***')) {
    i++
  }

  if (i >= lines.length) return undefined

  const featureLine = lines[i]
  const [namePart, ...descParts] = featureLine.split(':***')
  const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()

  // Check if there's a cost: "Spend 3 Hope"
  const descText = descParts.join(':').trim()
  const costMatch = descText.match(/Spend\s+(\d+)\s+Hope/i)
  const cost = costMatch ? parseInt(costMatch[1], 10) : undefined

  return { name, desc: descText, cost }
}

function parseClassFeature(lines: string[]): ClassFeature | undefined {
  const featureIndex = lines.findIndex((l) => l.match(/##\s*CLASS\s+FEATURE/i))
  if (featureIndex === -1) return undefined

  let i = featureIndex + 1
  while (i < lines.length && !lines[i].startsWith('***')) {
    i++
  }

  if (i >= lines.length) return undefined

  const featureLine = lines[i]
  const [namePart, ...descParts] = featureLine.split(':***')
  const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()
  const desc = descParts.join(':').trim()

  return { name, desc }
}

function parseQuestions(lines: string[], sectionName: string): string[] | undefined {
  const sectionIndex = lines.findIndex((l) => l.includes(sectionName))
  if (sectionIndex === -1) return undefined

  const questions: string[] = []
  let i = sectionIndex + 1

  while (i < lines.length && !lines[i].startsWith('##')) {
    const line = lines[i]
    if (line.startsWith('-')) {
      questions.push(line.replace(/^-\s*/, '').trim())
    }
    i++
  }

  return questions.length > 0 ? questions : undefined
}

function parseDescription(lines: string[]): string {
  // Description is everything from line 2 until first blockquote (>)
  let desc = ''
  let i = 1 // Skip name line

  while (i < lines.length && !lines[i].startsWith('>')) {
    if (!lines[i].startsWith('#')) {
      desc += lines[i] + ' '
    }
    i++
  }

  return desc.trim()
}
```

---

### 3. Armor Parser

**File**: `scripts/parsers/armor-parser.ts`

**Source Files**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/armor/*.md`

**Sample Markdown Format** (simpler than weapons/classes):

```markdown
# LEATHER ARMOR

**Base Thresholds:** 13/31
**Base Armor Score:** 2

**Feature:** —

_Tier 1_
```

**Parser Function**:

```typescript
import type { Armor } from './types'

export function parseArmor(markdown: string, filename: string): Armor {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # LEATHER ARMOR
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Line 2: **Base Thresholds:** 13/31
  const thresholdsLine = lines.find((l) => l.includes('Base Thresholds:'))
  const base_thresholds = thresholdsLine?.match(/:\*\*\s*([^\n]+)/)?.[1]?.trim() || '10/20'

  // Line 3: **Base Armor Score:** 2
  const scoreLine = lines.find((l) => l.includes('Base Armor Score:'))
  const base_score = parseInt(scoreLine?.match(/:\*\*\s*(\d+)/)?.[1] || '0', 10)

  // Line 4: **Feature:** —
  const featureLine = lines.find((l) => l.includes('Feature:'))
  const feature = featureLine?.split(':')[1]?.trim() || null

  // Line 5: *Tier 1*
  const tierLine = lines.find((l) => l.match(/\*Tier\s+\d+\*/))
  const tier = parseInt(tierLine?.match(/Tier\s+(\d+)/)?.[1] || '1', 10)

  const searchable_text = `${name} ${base_thresholds} ${feature || ''}`.trim()

  return {
    name,
    tier,
    base_thresholds,
    base_score,
    feature: feature === '—' ? null : feature,
    searchable_text,
    source_book: 'Core Rules',
  }
}
```

---

## Seeding Script Updates

**File**: `scripts/seeders/phase1.ts`

```typescript
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { parseWeapon } from '../parsers/weapon-parser'
import { parseClass } from '../parsers/class-parser'
import { parseArmor } from '../parsers/armor-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

export async function seedPhase1() {
  console.log('🌱 Starting Phase 1 seeding (Weapons, Classes, Armor)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  await seedWeapons(supabase)
  await seedClasses(supabase)
  await seedArmor(supabase)

  console.log('\n✅ Phase 1 seeding complete!')
}

async function seedWeapons(supabase: any) {
  console.log('📦 Seeding weapons...')
  const files = await glob(`${SRD_PATH}/weapons/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const weapon = parseWeapon(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_weapons')
      .upsert(weapon, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} weapons`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} weapons\n`)
}

async function seedClasses(supabase: any) {
  console.log('📦 Seeding classes...')
  const files = await glob(`${SRD_PATH}/classes/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const classData = parseClass(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_classes')
      .upsert(classData, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} classes`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} classes\n`)
}

async function seedArmor(supabase: any) {
  console.log('📦 Seeding armor...')
  const files = await glob(`${SRD_PATH}/armor/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const armor = parseArmor(markdown, path.basename(file))

    const { error } = await supabase.from('daggerheart_armor').upsert(armor, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} armor`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} armor pieces\n`)
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedPhase1()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
```

---

## Testing Requirements

**File**: `__tests__/integration/daggerheart-content-phase1.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Daggerheart Content - Phase 1 (Weapons, Classes, Armor)', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    supabase = createClient(supabaseUrl, supabaseKey)
  })

  describe('Weapons', () => {
    it('should have ~194 weapons seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_weapons')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(190)
    })

    it('should parse Advanced Battleaxe correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_weapons')
        .select('*')
        .eq('name', 'ADVANCED BATTLEAXE')
        .single()

      expect(data).toBeDefined()
      expect(data!.weapon_category).toBe('Primary')
      expect(data!.tier).toBe(3)
      expect(data!.trait).toBe('Strength')
      expect(data!.range).toBe('Melee')
      expect(data!.damage).toBe('d10+9 phy')
      expect(data!.burden).toBe('Two-Handed')
    })
  })

  describe('Classes', () => {
    it('should have ~11 classes seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_classes')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(10)
    })

    it('should parse Bard class correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_classes')
        .select('*')
        .eq('name', 'BARD')
        .single()

      expect(data).toBeDefined()
      expect(data!.domains).toEqual(['Grace', 'Codex'])
      expect(data!.starting_evasion).toBe(10)
      expect(data!.starting_hp).toBe(5)
      expect(data!.hope_feature).toBeDefined()
      expect(data!.hope_feature.name).toBe('Make a Scene')
      expect(data!.class_feature).toBeDefined()
      expect(data!.class_feature.name).toBe('Rally')
    })
  })

  describe('Armor', () => {
    it('should have ~36 armor pieces seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_armor')
        .select('*', { count: 'exact', head: true })

      expect(count).toBeGreaterThanOrEqual(35)
    })
  })

  describe('Phase 1 Totals', () => {
    it('should have ~241 total entries from Phase 1', async () => {
      const tables = [
        'daggerheart_weapons', // ~194
        'daggerheart_classes', // ~11
        'daggerheart_armor', // ~36
      ]

      let totalCount = 0
      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

        totalCount += count || 0
      }

      expect(totalCount).toBeGreaterThanOrEqual(235)
    })
  })
})
```

---

## Implementation Steps

1. **Create parser files** (3-4 hours)

   ```bash
   # Create parser files
   touch scripts/parsers/weapon-parser.ts
   touch scripts/parsers/class-parser.ts
   touch scripts/parsers/armor-parser.ts
   ```

2. **Implement weapon parser** (~1.5 hours)
   - Copy template code above
   - Test with 5-10 sample files manually
   - Handle edge cases (missing fields, etc.)

3. **Implement class parser** (~1.5 hours)
   - Most complex of the 3 due to nested structure
   - Test with all 11 class files
   - Verify domains, features, questions all parsed

4. **Implement armor parser** (~30 min)
   - Simplest of the 3
   - Test with sample files

5. **Create seeding script** (~30 min)
   - Create `scripts/seeders/phase1.ts`
   - Test with subset first (10 files each)
   - Run full seed

6. **Run integration tests** (~15 min)

   ```bash
   npm test -- __tests__/integration/daggerheart-content-phase1.test.ts
   ```

7. **Verify database** (~15 min)

   ```bash
   # Check counts
   npx tsx -e "
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );

   Promise.all([
     supabase.from('daggerheart_weapons').select('count'),
     supabase.from('daggerheart_classes').select('count'),
     supabase.from('daggerheart_armor').select('count')
   ]).then(results => console.log(results));
   "
   ```

---

## Verification Checklist

- [ ] All 3 parser files created and pass TypeScript compilation
- [ ] Weapon parser tested with 5+ sample files
- [ ] Class parser tested with all 11 class files
- [ ] Armor parser tested with 5+ sample files
- [ ] Seeding script runs without errors
- [ ] ~194 weapons in database
- [ ] ~11 classes in database
- [ ] ~36 armor pieces in database
- [ ] Total ~241 entries verified
- [ ] Integration tests pass (3/27 subtests from main test file)
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint:fix`
- [ ] Coverage ≥90%: `npm run test:coverage`

---

## Success Criteria

Phase 1 is complete when:

- ✅ All 3 parsers implemented and tested
- ✅ ~241 entries seeded successfully
- ✅ Integration tests pass
- ✅ Database tables populated with correct data structure
- ✅ Searchable_text field populated for full-text search
- ✅ Ready to proceed to Phase 2 (abilities, items, consumables)

---

## References

- **Status Document**: [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md)
- **Main FEATURE**: [FEATURE_daggerheart_content_database.md](FEATURE_daggerheart_content_database.md)
- **SRD Location**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/`
- **Adversary Parser** (template): [scripts/parsers/adversary-parser.ts](../../scripts/parsers/adversary-parser.ts)

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Next**: Phase 2 - Abilities, Items, Consumables parsers
