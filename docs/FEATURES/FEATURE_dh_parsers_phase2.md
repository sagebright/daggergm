# Feature: Daggerheart Content Parsers - Phase 2 (Mid-Complexity)

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Content Foundation
**Estimated Time**: 3-4 hours
**Dependencies**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md) recommended (but not required)

---

## Overview

Implement parsers for **3 mid-complexity** Daggerheart content types: Abilities, Items, and Consumables.

- **Abilities** (~191 entries) - Complex with class/subclass/domain relationships
- **Items** (~62 entries) - Simple markdown structure
- **Consumables** (~62 entries) - Very similar to Items

**Total entries**: ~315 (41% of all content)

---

## Acceptance Criteria

- [ ] Ability parser handles all 191 ability files with class/subclass/domain relationships
- [ ] Item parser handles all 62 item files
- [ ] Consumable parser handles all 62 consumable files
- [ ] All parsers extract searchable_text for full-text search
- [ ] Integration tests pass for these 3 tables
- [ ] Seeding script populates database successfully
- [ ] ~315 total entries verified in database

---

## Technical Specification

### 1. Ability Parser

**File**: `scripts/parsers/ability-parser.ts`

**Source Files**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/abilities/*.md`

**Sample Markdown Format**:

```markdown
# A SOLDIER'S BOND

> **Level 2 Blade Ability**
> **Recall Cost:** 1

Once per long rest, when you compliment someone or ask them about something they're good at, you can both gain 3 Hope.
```

**Parser Function**:

```typescript
import type { Ability } from './types'

export function parseAbility(markdown: string, filename: string): Ability {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # A SOLDIER'S BOND
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Line 2-3: Blockquote with level, class/subclass, domain info
  const infoLines = lines.filter((l) => l.startsWith('>'))
  const { ability_type, level_requirement, parent_class, parent_subclass, domain } =
    parseAbilityInfo(infoLines)

  // Description: Everything after the blockquote
  const description = parseDescription(lines)

  const searchable_text = `${name} ${description}`.trim()

  return {
    name,
    ability_type,
    parent_class,
    parent_subclass,
    domain,
    description,
    level_requirement,
    searchable_text,
    source_book: 'Core Rules',
  }
}

interface AbilityInfo {
  ability_type: 'Foundation' | 'Specialization' | 'Pinnacle'
  level_requirement?: number
  parent_class?: string
  parent_subclass?: string
  domain?: string
}

function parseAbilityInfo(infoLines: string[]): AbilityInfo {
  const infoText = infoLines.join(' ')

  // Parse level: "Level 2 Blade Ability" or "Foundation Ability"
  let ability_type: 'Foundation' | 'Specialization' | 'Pinnacle' = 'Foundation'
  let level_requirement: number | undefined

  if (infoText.includes('Foundation')) {
    ability_type = 'Foundation'
  } else if (infoText.includes('Specialization')) {
    ability_type = 'Specialization'
  } else if (infoText.includes('Pinnacle')) {
    ability_type = 'Pinnacle'
  }

  // Extract level: "Level 2"
  const levelMatch = infoText.match(/Level\s+(\d+)/)
  if (levelMatch) {
    level_requirement = parseInt(levelMatch[1], 10)
  }

  // Extract class: "Blade Ability", "Ranger Ability", etc.
  const classMatch = infoText.match(/Level\s+\d+\s+([A-Z][a-z]+)\s+Ability/)
  const parent_class = classMatch?.[1] || undefined

  // Extract subclass (if present): would be in format like "Level 2 Sharpshooter Ability"
  // Subclasses are typically capitalized compound words
  const subclassMatch = infoText.match(/Level\s+\d+\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+Ability/)
  const potentialSubclass = subclassMatch?.[1]

  // If it's not one of the main classes, it might be a subclass
  const mainClasses = [
    'Bard',
    'Druid',
    'Guardian',
    'Ranger',
    'Rogue',
    'Seraph',
    'Sorcerer',
    'Warrior',
    'Wizard',
    'Blade',
  ]
  const parent_subclass =
    potentialSubclass && !mainClasses.includes(potentialSubclass) ? potentialSubclass : undefined

  // Extract domain (if present): appears in some abilities
  const domainMatch = infoText.match(
    /\b(Grace|Codex|Valor|Sage|Blade|Bone|Arcana|Splendor|Midnight|Tide|Instinct)\b/,
  )
  const domain = domainMatch?.[1] || undefined

  return {
    ability_type,
    level_requirement,
    parent_class,
    parent_subclass,
    domain,
  }
}

function parseDescription(lines: string[]): string {
  // Description is everything after the blockquote lines
  const descLines: string[] = []
  let inBlockquote = false

  for (const line of lines) {
    if (line.startsWith('>')) {
      inBlockquote = true
      continue
    }
    if (inBlockquote && !line.startsWith('#')) {
      descLines.push(line)
    }
  }

  return descLines.join(' ').trim()
}
```

---

### 2. Item Parser

**File**: `scripts/parsers/item-parser.ts`

**Source Files**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/items/*.md`

**Sample Markdown Format**:

```markdown
# AIRBLADE CHARM

You can attach this charm to a weapon with a Melee range. Three times per rest, you can activate the charm and attack a target within Close range.

_Item_
```

**Parser Function**:

```typescript
import type { Item } from './types'

export function parseItem(markdown: string, filename: string): Item {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # AIRBLADE CHARM
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Lines 2+ until item type line
  const description = parseItemDescription(lines)

  // Last line: *Item* or *Relic* or *Charm*
  const typeMatch = lines[lines.length - 1]?.match(/\*(Item|Relic|Charm)\*/)
  const item_type = typeMatch?.[1] || 'Item'

  const searchable_text = `${name} ${description}`.trim()

  return {
    name,
    description,
    item_type,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseItemDescription(lines: string[]): string {
  const descLines: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Skip the type line (last line with *Item*)
    if (line.match(/^\*(Item|Relic|Charm)\*$/)) {
      break
    }
    if (!line.startsWith('#')) {
      descLines.push(line)
    }
  }

  return descLines.join(' ').trim()
}
```

---

### 3. Consumable Parser

**File**: `scripts/parsers/consumable-parser.ts`

**Source Files**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/consumables/*.md`

**Sample Markdown Format**:

```markdown
# ACIDPASTE

This paste eats away walls and other surfaces in bright flashes.

_Consumable_
```

**Parser Function**:

```typescript
import type { Consumable } from './types'

export function parseConsumable(markdown: string, filename: string): Consumable {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # ACIDPASTE
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Lines 2+ until consumable type line
  const description = parseConsumableDescription(lines)

  // Uses: Default to 1 (single use), unless specified otherwise in description
  const usesMatch = description.match(/(\d+)\s+uses?/i)
  const uses = usesMatch ? parseInt(usesMatch[1], 10) : 1

  const searchable_text = `${name} ${description}`.trim()

  return {
    name,
    description,
    uses,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseConsumableDescription(lines: string[]): string {
  const descLines: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Skip the type line (last line with *Consumable*)
    if (line.match(/^\*Consumable\*$/)) {
      break
    }
    if (!line.startsWith('#')) {
      descLines.push(line)
    }
  }

  return descLines.join(' ').trim()
}
```

---

## Seeding Script Updates

**File**: `scripts/seeders/phase2.ts`

```typescript
/* eslint-disable no-console */
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import path from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseAbility } from '../parsers/ability-parser'
import { parseItem } from '../parsers/item-parser'
import { parseConsumable } from '../parsers/consumable-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

export async function seedPhase2() {
  console.log('🌱 Starting Phase 2 seeding (Abilities, Items, Consumables)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  await seedAbilities(supabase)
  await seedItems(supabase)
  await seedConsumables(supabase)

  console.log('\n✅ Phase 2 seeding complete!')
}

async function seedAbilities(supabase: SupabaseClient) {
  console.log('📦 Seeding abilities...')
  const files = await glob(`${SRD_PATH}/abilities/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const ability = parseAbility(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_abilities')
      .upsert(ability, { onConflict: 'name,ability_type,parent_class' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} abilities`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} abilities\n`)
}

async function seedItems(supabase: SupabaseClient) {
  console.log('📦 Seeding items...')
  const files = await glob(`${SRD_PATH}/items/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const item = parseItem(markdown, path.basename(file))

    const { error } = await supabase.from('daggerheart_items').upsert(item, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} items`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} items\n`)
}

async function seedConsumables(supabase: SupabaseClient) {
  console.log('📦 Seeding consumables...')
  const files = await glob(`${SRD_PATH}/consumables/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const consumable = parseConsumable(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_consumables')
      .upsert(consumable, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} consumables`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} consumables\n`)
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedPhase2()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
```

---

## Testing Requirements

**File**: `__tests__/integration/daggerheart-content-phase2.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Daggerheart Content - Phase 2 (Abilities, Items, Consumables)', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    supabase = createClient(supabaseUrl, supabaseKey)
  })

  describe('Abilities', () => {
    it('should have ~191 abilities seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_abilities')
        .select('*', { count: 'exact', head: true })

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(count).toBeGreaterThanOrEqual(180)
    })

    it('should have valid ability types', async () => {
      const validTypes = ['Foundation', 'Specialization', 'Pinnacle']
      const { data } = await supabase.from('daggerheart_abilities').select('ability_type')

      expect(data).toBeDefined()
      const types = data!.map((row) => row.ability_type)
      expect(types.every((t) => validTypes.includes(t))).toBe(true)
    })

    it('should parse A Soldiers Bond correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_abilities')
        .select('*')
        .eq('name', "A SOLDIER'S BOND")
        .single()

      expect(data).toBeDefined()
      expect(data!.level_requirement).toBe(2)
      expect(data!.description).toContain('compliment')
    })
  })

  describe('Items', () => {
    it('should have ~62 items seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_items')
        .select('*', { count: 'exact', head: true })

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(count).toBeGreaterThanOrEqual(58)
    })

    it('should parse Airblade Charm correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_items')
        .select('*')
        .eq('name', 'AIRBLADE CHARM')
        .single()

      expect(data).toBeDefined()
      expect(data!.item_type).toBe('Item')
      expect(data!.description).toContain('charm to a weapon')
    })
  })

  describe('Consumables', () => {
    it('should have ~62 consumables seeded', async () => {
      const { count } = await supabase
        .from('daggerheart_consumables')
        .select('*', { count: 'exact', head: true })

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(count).toBeGreaterThanOrEqual(58)
    })

    it('should parse Acidpaste correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_consumables')
        .select('*')
        .eq('name', 'ACIDPASTE')
        .single()

      expect(data).toBeDefined()
      expect(data!.uses).toBe(1)
      expect(data!.description).toContain('paste eats away')
    })
  })

  describe('Phase 2 Totals', () => {
    it('should have ~315 total entries from Phase 2', async () => {
      const tables = [
        'daggerheart_abilities', // ~191
        'daggerheart_items', // ~62
        'daggerheart_consumables', // ~62
      ]

      let totalCount = 0
      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

        totalCount += count || 0
      }

      // Phase 1 learning: Allow 5-10% variance from estimates
      expect(totalCount).toBeGreaterThanOrEqual(290)
    })
  })
})
```

---

## Implementation Steps

1. **Create parser files** (3-4 hours)

   ```bash
   touch scripts/parsers/ability-parser.ts
   touch scripts/parsers/item-parser.ts
   touch scripts/parsers/consumable-parser.ts
   ```

2. **Implement ability parser** (~2 hours)
   - Most complex due to class/subclass/domain relationships
   - **CRITICAL**: Test regex patterns with 10-15 sample files BEFORE full seed
   - Add console.log to verify regex matches expected format
   - Handle different ability types (Foundation, Specialization, Pinnacle)

   **Regex Testing Pattern** (learned from Phase 1):

   ```typescript
   // Test regex on sample files first:
   const testFiles = await glob(`${SRD_PATH}/abilities/*.md`).slice(0, 10)
   for (const file of testFiles) {
     const markdown = await readFile(file, 'utf-8')
     const parsed = parseAbility(markdown, path.basename(file))
     console.log(`${parsed.name}: level=${parsed.level_requirement}, class=${parsed.parent_class}`)
   }
   ```

3. **Implement item parser** (~45 min)
   - Simple structure
   - Test with 5-10 sample files

4. **Implement consumable parser** (~45 min)
   - Nearly identical to item parser
   - Test with 5-10 sample files

5. **Create seeding script** (~30 min)
   - Create `scripts/seeders/phase2.ts`
   - Test with subset first

6. **Run full seed** (~15 min)

   ```bash
   npx tsx scripts/seeders/phase2.ts
   ```

7. **Run integration tests** (~15 min)
   ```bash
   npm test -- __tests__/integration/daggerheart-content-phase2.test.ts
   ```

---

## Verification Checklist

- [ ] All 3 parser files created and pass TypeScript compilation
- [ ] Ability parser tested with 10+ sample files
- [ ] Item parser tested with 5+ sample files
- [ ] Consumable parser tested with 5+ sample files
- [ ] Seeding script runs without errors
- [ ] ~191 abilities in database
- [ ] ~62 items in database
- [ ] ~62 consumables in database
- [ ] Total ~315 entries verified
- [ ] Integration tests pass
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint:fix`
- [ ] Coverage ≥90%: `npm run test:coverage`

---

## Success Criteria

Phase 2 is complete when:

- ✅ All 3 parsers implemented and tested
- ✅ ~315 entries seeded successfully
- ✅ Integration tests pass
- ✅ Ability relationships (class/subclass/domain) correctly parsed
- ✅ Ready to proceed to Phase 3 (remaining 6 parsers)

---

## Troubleshooting

### Environment Variables Not Loading

**Issue**: Tests show wrong Supabase URL or seeding fails with auth errors

**Solution**:

```bash
# Verify environment variables are loaded:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# If wrong, check __tests__/setup.ts has:
config({ path: '.env.test.local', override: true })
```

### Regex Pattern Not Matching

**Issue**: Fields default to null/undefined or wrong values

**Phase 1 Example**: Armor regex `/\*Tier\s+\d+\*/` didn't match `*Armor - Tier 4*`, ALL armor defaulted to Tier 1

**Solution**:

1. Test regex on 10 sample files before full seed
2. Add console.log to see what regex is matching
3. Verify actual markdown format matches expected pattern
4. Add fallback handling for unparsed fields

### Migration Drift Issues

**Issue**: `npx supabase db push` fails with "migrations exist remotely but not locally"

**Solution**:

```bash
# Option 1: Use Supabase MCP tool
# In Claude Code: Call mcp__supabase__apply_migration

# Option 2: Pull remote migrations first
npx supabase db pull
```

### Silent Seeding Failures

**Issue**: Seeding completes but counts are lower than expected

**Phase 1 Example**: 53 Tier 4 weapons silently failed due to database constraint `CHECK (tier BETWEEN 1 AND 3)`

**Solution**:

1. Check for database constraints that might block valid data
2. Add error logging in seeding loops:
   ```typescript
   if (error) {
     console.error(`Failed to seed ${name}:`, error.message)
     count++ // Still increment to see how many failed
   }
   ```
3. Verify tier distributions match expected values

---

## References

- **Status Document**: [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md)
- **Phase 1**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md)
- **Phase 1 Learnings**: Applied throughout this document (type safety, regex testing, flexible test expectations)
- **SRD Location**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/`

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Revision**: 2025-10-26 - Applied Phase 1 learnings (SupabaseClient types, eslint-disable, regex testing, flexible expectations)
**Next**: Phase 3 - Remaining 6 parsers (Ancestries, Subclasses, Environments, Domains, Communities, Frames)
