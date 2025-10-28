# FEATURE: Daggerheart Content Database - Phase 2 (High-Priority Parsers)

**Status**: Not Started
**Priority**: P4 (Medium - Content Quality)
**Estimated Time**: 3-4 hours
**Dependencies**: Phase 1 complete (database schema & adversary parser exist)
**Business Impact**: Improves LLM-generated adventure quality with accurate game mechanics

---

## 📋 Problem Statement

Phase 1 (database schema, integration tests, adversary parser) is complete. Phase 2 focuses on the **highest-priority content types** that directly impact adventure generation quality:

1. **Weapons** (~194 entries) - Most common loot and combat mechanics
2. **Classes** (~11 entries) - Character archetypes needed for party balance
3. **Armor** (~36 entries) - Essential for character progression

These three content types are referenced most frequently in adventures and must be seeded before Phase 3.

---

## 🎯 Acceptance Criteria

### Weapons Parser

- [ ] Parse all ~194 weapon files from `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/weapons/*.md`
- [ ] Extract: name, tier (1-4), weapon_type, damage_die, range, properties, description
- [ ] Handle special cases: two-handed, versatile, thrown, magical properties
- [ ] Build `searchable_text` field for full-text search
- [ ] Seed all weapons to `daggerheart_weapons` table
- [ ] Integration tests pass for weapons (7/27 tests related to weapons)

### Classes Parser

- [ ] Parse all ~11 class files from `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/classes/*.md`
- [ ] Extract: name, description, primary_stats, hit_points, core_ability, flavor
- [ ] Handle complex markdown formatting (nested lists, abilities)
- [ ] Build `searchable_text` field
- [ ] Seed all classes to `daggerheart_classes` table
- [ ] Integration tests pass for classes (3/27 tests)

### Armor Parser

- [ ] Parse all ~36 armor files from `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/armor/*.md`
- [ ] Extract: name, tier (1-4), armor_type, armor_score, properties, description
- [ ] Handle special properties (magical, enchanted, etc.)
- [ ] Build `searchable_text` field
- [ ] Seed all armor to `daggerheart_armor` table
- [ ] Integration tests pass for armor (2/27 tests)

### General Quality

- [ ] All parsers handle malformed markdown gracefully
- [ ] Idempotent seeding (can re-run without duplicates)
- [ ] Progress indicators during seeding
- [ ] Error logging for failed parses
- [ ] Test coverage ≥90%

---

## 🏗️ Technical Implementation

### Task 2.1: Weapons Parser (1.5 hours)

**File**: `scripts/parsers/weapon-parser.ts`

```typescript
import * as fs from 'fs'
import * as path from 'path'
import type { WeaponData } from './types'

/**
 * Parses a Daggerheart weapon markdown file
 * Example file: /Users/jmfk/Repos/daggergm_backup/daggerheart-srd/weapons/Advanced_Battleaxe.md
 */
export function parseWeapon(markdown: string, filename: string): WeaponData {
  // Remove BOM if present
  const content = markdown.replace(/^\uFEFF/, '').trim()

  // Extract name from filename (e.g., "Advanced_Battleaxe.md" → "Advanced Battleaxe")
  const name = path.basename(filename, '.md').replace(/_/g, ' ')

  // Extract tier from content (e.g., "**Tier**: 3")
  const tierMatch = content.match(/\*\*Tier\*\*:?\s*(\d+)/i)
  const tier = tierMatch ? parseInt(tierMatch[1], 10) : 1

  // Extract weapon type (e.g., "**Type**: Melee, Axe")
  const typeMatch = content.match(/\*\*Type\*\*:?\s*(.+)/i)
  const weaponType = typeMatch ? typeMatch[1].trim() : null

  // Extract damage die (e.g., "**Damage**: d10")
  const damageMatch = content.match(/\*\*Damage\*\*:?\s*(d\d+)/i)
  const damageDie = damageMatch ? damageMatch[1] : null

  // Extract range (e.g., "**Range**: Melee" or "**Range**: 30 feet")
  const rangeMatch = content.match(/\*\*Range\*\*:?\s*(.+)/i)
  const range = rangeMatch ? rangeMatch[1].trim() : 'Melee'

  // Extract properties (e.g., "**Properties**: Two-handed, Heavy")
  const propertiesMatch = content.match(/\*\*Properties\*\*:?\s*(.+)/i)
  const propertiesString = propertiesMatch ? propertiesMatch[1].trim() : ''
  const properties = propertiesString ? propertiesString.split(',').map((p) => p.trim()) : []

  // Extract description (everything after "---" or first paragraph)
  let description = content
  const descMatch = content.match(/---\s*\n(.+)/s)
  if (descMatch) {
    description = descMatch[1].trim()
  } else {
    // Fallback: take first paragraph
    const paragraphs = content.split('\n\n')
    description = paragraphs.find((p) => p.length > 20) || content
  }

  // Build searchable text
  const searchableText = [name, weaponType, damageDie, range, ...properties, description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    name,
    tier,
    weapon_type: weaponType,
    damage_die: damageDie,
    range,
    properties,
    description,
    searchable_text: searchableText,
  }
}

/**
 * Parses all weapon files from the SRD directory
 */
export function parseAllWeapons(srdPath: string): WeaponData[] {
  const weaponsDir = path.join(srdPath, 'weapons')
  const files = fs.readdirSync(weaponsDir).filter((f) => f.endsWith('.md'))

  console.log(`📦 Parsing ${files.length} weapon files...`)

  const weapons: WeaponData[] = []
  let successCount = 0
  let errorCount = 0

  for (const file of files) {
    try {
      const filePath = path.join(weaponsDir, file)
      const markdown = fs.readFileSync(filePath, 'utf-8')
      const weapon = parseWeapon(markdown, file)
      weapons.push(weapon)
      successCount++

      // Progress indicator
      process.stdout.write(`\r⚔️  Parsed ${successCount}/${files.length} weapons`)
    } catch (error) {
      errorCount++
      console.error(`\n❌ Failed to parse ${file}:`, error)
    }
  }

  console.log(`\n✅ Successfully parsed ${successCount} weapons (${errorCount} errors)`)

  return weapons
}
```

**Types** (add to `scripts/parsers/types.ts`):

```typescript
export interface WeaponData {
  name: string
  tier: number
  weapon_type: string | null
  damage_die: string | null
  range: string | null
  properties: string[]
  description: string
  searchable_text: string
}
```

**Seeding Script**: `scripts/seeders/seed-weapons.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { parseAllWeapons } from '../parsers/weapon-parser'

export async function seedWeapons() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const srdPath = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'
  const weapons = parseAllWeapons(srdPath)

  console.log(`\n🌱 Seeding ${weapons.length} weapons...`)

  const { data, error } = await supabase.from('daggerheart_weapons').upsert(weapons, {
    onConflict: 'name',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }

  console.log(`✅ Seeded ${weapons.length} weapons`)
  return weapons.length
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedWeapons()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
```

---

### Task 2.2: Classes Parser (1 hour)

**File**: `scripts/parsers/class-parser.ts`

```typescript
import * as fs from 'fs'
import * as path from 'path'
import type { ClassData } from './types'

/**
 * Parses a Daggerheart class markdown file
 * Example: /Users/jmfk/Repos/daggergm_backup/daggerheart-srd/classes/Guardian.md
 */
export function parseClass(markdown: string, filename: string): ClassData {
  const content = markdown.replace(/^\uFEFF/, '').trim()

  // Extract name from filename
  const name = path.basename(filename, '.md').replace(/_/g, ' ')

  // Extract primary stats (e.g., "**Primary Stats**: Strength, Constitution")
  const statsMatch = content.match(/\*\*Primary Stats?\*\*:?\s*(.+)/i)
  const primaryStats = statsMatch
    ? statsMatch[1]
        .trim()
        .split(',')
        .map((s) => s.trim())
    : []

  // Extract hit points (e.g., "**Hit Points**: 10 + Proficiency")
  const hpMatch = content.match(/\*\*Hit Points\*\*:?\s*(.+)/i)
  const hitPoints = hpMatch ? hpMatch[1].trim() : null

  // Extract core ability (first ability listed)
  const abilityMatch = content.match(/### (.+?)\s*\n/i)
  const coreAbility = abilityMatch ? abilityMatch[1].trim() : null

  // Extract description (first paragraph after header)
  let description = ''
  const paragraphs = content.split('\n\n')
  description = paragraphs.find((p) => p.length > 50 && !p.startsWith('#')) || ''

  // Extract flavor text (usually italicized)
  const flavorMatch = content.match(/\*(.{20,}?)\*/s)
  const flavor = flavorMatch ? flavorMatch[1].trim() : null

  // Build searchable text
  const searchableText = [name, ...primaryStats, description, flavor]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    name,
    primary_stats: primaryStats,
    hit_points: hitPoints,
    core_ability: coreAbility,
    description,
    flavor,
    searchable_text: searchableText,
  }
}

export function parseAllClasses(srdPath: string): ClassData[] {
  const classesDir = path.join(srdPath, 'classes')
  const files = fs.readdirSync(classesDir).filter((f) => f.endsWith('.md'))

  console.log(`📦 Parsing ${files.length} class files...`)

  const classes: ClassData[] = []
  let successCount = 0

  for (const file of files) {
    try {
      const filePath = path.join(classesDir, file)
      const markdown = fs.readFileSync(filePath, 'utf-8')
      const classData = parseClass(markdown, file)
      classes.push(classData)
      successCount++

      process.stdout.write(`\r🛡️  Parsed ${successCount}/${files.length} classes`)
    } catch (error) {
      console.error(`\n❌ Failed to parse ${file}:`, error)
    }
  }

  console.log(`\n✅ Successfully parsed ${successCount} classes`)
  return classes
}
```

**Types** (add to `scripts/parsers/types.ts`):

```typescript
export interface ClassData {
  name: string
  primary_stats: string[]
  hit_points: string | null
  core_ability: string | null
  description: string
  flavor: string | null
  searchable_text: string
}
```

**Seeding Script**: `scripts/seeders/seed-classes.ts` (follow same pattern as weapons)

---

### Task 2.3: Armor Parser (30 minutes)

**File**: `scripts/parsers/armor-parser.ts`

```typescript
// Similar structure to weapon parser
// Extract: name, tier, armor_type, armor_score, properties, description
// Build searchable_text
// Handle special properties (magical, enchanted)
```

**Seeding Script**: `scripts/seeders/seed-armor.ts`

---

### Task 2.4: Integration Script (15 minutes)

**File**: `scripts/seed-daggerheart-phase2.ts`

```typescript
import { seedWeapons } from './seeders/seed-weapons'
import { seedClasses } from './seeders/seed-classes'
import { seedArmor } from './seeders/seed-armor'

async function seedPhase2() {
  console.log('🌱 Starting Daggerheart Phase 2 seeding...\n')

  const weaponCount = await seedWeapons()
  const classCount = await seedClasses()
  const armorCount = await seedArmor()

  const total = weaponCount + classCount + armorCount

  console.log(`\n✅ Phase 2 seeding complete! ${total} entries added`)
  console.log(`   - ${weaponCount} weapons`)
  console.log(`   - ${classCount} classes`)
  console.log(`   - ${armorCount} armor`)
}

seedPhase2()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

---

## 🧪 Testing Requirements

### Unit Tests

**File**: `__tests__/unit/parsers/weapon-parser.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { parseWeapon } from '@/scripts/parsers/weapon-parser'

describe('parseWeapon', () => {
  it('should parse a basic weapon correctly', () => {
    const markdown = `
# Advanced Battleaxe

**Tier**: 3
**Type**: Melee, Axe
**Damage**: d10
**Range**: Melee
**Properties**: Two-handed, Heavy

---

A massive battleaxe forged from enchanted steel, designed for warriors who value raw power over finesse.
    `.trim()

    const result = parseWeapon(markdown, 'Advanced_Battleaxe.md')

    expect(result.name).toBe('Advanced Battleaxe')
    expect(result.tier).toBe(3)
    expect(result.weapon_type).toBe('Melee, Axe')
    expect(result.damage_die).toBe('d10')
    expect(result.range).toBe('Melee')
    expect(result.properties).toEqual(['Two-handed', 'Heavy'])
    expect(result.description).toContain('massive battleaxe')
  })

  it('should handle missing tier (default to 1)', () => {
    const markdown = `# Basic Dagger\n**Type**: Melee\n**Damage**: d4`
    const result = parseWeapon(markdown, 'Basic_Dagger.md')
    expect(result.tier).toBe(1)
  })

  it('should handle malformed markdown gracefully', () => {
    const markdown = `# Broken Weapon`
    const result = parseWeapon(markdown, 'Broken_Weapon.md')
    expect(result.name).toBe('Broken Weapon')
    expect(result.tier).toBe(1)
  })
})
```

**Coverage Target**: 100% for parsers (data integrity critical)

---

### Integration Tests

The existing integration tests in `__tests__/integration/daggerheart-content.test.ts` already cover Phase 2:

```typescript
// Weapons tests (already exist)
it('should have correct number of weapons', async () => {
  const { count } = await supabase
    .from('daggerheart_weapons')
    .select('*', { count: 'exact', head: true })
  expect(count).toBeGreaterThan(190) // ~194 expected
})

// Classes tests (already exist)
it('should have correct number of classes', async () => {
  const { count } = await supabase
    .from('daggerheart_classes')
    .select('*', { count: 'exact', head: true })
  expect(count).toBe(11)
})

// Armor tests (already exist)
it('should have correct number of armor', async () => {
  const { count } = await supabase
    .from('daggerheart_armor')
    .select('*', { count: 'exact', head: true })
  expect(count).toBeGreaterThan(35) // ~36 expected
})
```

After seeding, these tests should pass.

---

## 📖 Implementation Guide

### Phase 1: Weapons Parser (1.5 hours)

1. Create `scripts/parsers/weapon-parser.ts`
2. Add `WeaponData` type to `scripts/parsers/types.ts`
3. Write unit tests (`__tests__/unit/parsers/weapon-parser.test.ts`)
4. Run tests: `npm run test:watch -- weapon-parser`
5. Test with sample files:
   ```bash
   npx tsx scripts/test-weapon-parser.ts
   ```
6. Create `scripts/seeders/seed-weapons.ts`
7. Run seeding:
   ```bash
   export $(cat .env.test.local | xargs) && npx tsx scripts/seeders/seed-weapons.ts
   ```
8. Verify in database:
   ```sql
   SELECT COUNT(*) FROM daggerheart_weapons;  -- Should be ~194
   ```

---

### Phase 2: Classes Parser (1 hour)

1. Create `scripts/parsers/class-parser.ts`
2. Add `ClassData` type
3. Write unit tests
4. Create seeding script
5. Run seeding
6. Verify: `SELECT COUNT(*) FROM daggerheart_classes;` -- Should be 11

---

### Phase 3: Armor Parser (30 minutes)

1. Create `scripts/parsers/armor-parser.ts`
2. Add `ArmorData` type
3. Write tests
4. Create seeding script
5. Run seeding
6. Verify: `SELECT COUNT(*) FROM daggerheart_armor;` -- Should be ~36

---

### Phase 4: Integration & Verification (30 minutes)

1. Create `scripts/seed-daggerheart-phase2.ts`
2. Run full Phase 2 seeding:
   ```bash
   export $(cat .env.test.local | xargs) && npx tsx scripts/seed-daggerheart-phase2.ts
   ```
3. Run integration tests:
   ```bash
   npm test -- __tests__/integration/daggerheart-content.test.ts
   ```
4. Verify all Phase 2 tests pass (weapons, classes, armor)

---

### Phase 5: Quality Gates (15 minutes)

```bash
npm run test:coverage
# Verify ≥90% coverage

npm run lint
# Should have 0 errors/warnings

npm run build
# Should succeed

npx tsc --noEmit
# Should have 0 type errors
```

---

## ✅ Definition of Done

- [ ] Weapons parser implemented and tested (~194 entries seeded)
- [ ] Classes parser implemented and tested (~11 entries seeded)
- [ ] Armor parser implemented and tested (~36 entries seeded)
- [ ] Integration script runs all three seeders
- [ ] Unit tests written for all parsers (100% coverage)
- [ ] Integration tests pass for all three content types
- [ ] Database contains ~241 new entries (weapons + classes + armor)
- [ ] Test coverage ≥90%
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Production build succeeds
- [ ] PR created and merged to main

---

## 🔄 Rollback Plan

If issues arise:

1. **Database rollback** (drop seeded data):

   ```sql
   DELETE FROM daggerheart_weapons;
   DELETE FROM daggerheart_classes;
   DELETE FROM daggerheart_armor;
   ```

2. **Code rollback** (revert commit):
   ```bash
   git revert <commit-hash>
   ```

No schema changes in Phase 2, so rollback is safe.

---

## 📚 Related Documentation

- [NEXT_STEPS.md](../NEXT_STEPS.md) - Roadmap overview (Priority 4)
- [FEATURE_daggerheart_content_STATUS.md](../archive/FEATURE_daggerheart_content_STATUS.md) - Phase 1 status
- [FEATURE_daggerheart_content_phase3.md](./FEATURE_daggerheart_content_phase3.md) - Next phase (abilities, items, consumables)

---

**Created**: 2025-10-28
**Depends On**: Phase 1 (database schema, adversary parser)
**Blocks**: Phase 3 (abilities, items, consumables)
**Estimated Completion**: 3-4 hours
