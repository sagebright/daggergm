# Feature: Daggerheart Content Database

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 2 - Content Foundation
**Estimated Time**: 2-3 days
**Dependencies**: None

---

## Overview

Create comprehensive database tables for all Daggerheart game content and seed with ~900+ entries from the official SRD markdown files. This provides canonical content for hybrid LLM generation (select from database + generate unique content).

---

## Acceptance Criteria

- [ ] All 13 content tables created with proper schema
- [ ] Markdown parsers written for all content types
- [ ] All ~900+ SRD entries seeded into database
- [ ] Vector embeddings generated for semantic search
- [ ] Integration tests verify data integrity
- [ ] Seed script is idempotent (safe to re-run)
- [ ] Full-text search indexes created
- [ ] TypeScript types regenerated from schema

---

## Technical Specification

### Database Tables (13 Total)

**Location**: `supabase/migrations/00008_daggerheart_content_tables.sql`

#### 1. Adversaries (~130 entries)

```sql
CREATE TABLE daggerheart_adversaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    type TEXT NOT NULL, -- Solo, Bruiser, Standard, Minion, Horde, Ranged, Skulk, Leader, Support, Social
    description TEXT NOT NULL,
    motives_tactics TEXT[], -- ["Burrow", "drag away", "feed"]

    -- Combat Stats
    difficulty INT NOT NULL,
    thresholds TEXT, -- "8/15" or "None"
    hp INT NOT NULL,
    stress INT NOT NULL,
    atk TEXT NOT NULL, -- "+3"
    weapon TEXT NOT NULL,
    range TEXT NOT NULL, -- Melee, Very Close, Close, Far, Very Far
    dmg TEXT NOT NULL, -- "1d12+2 phy"

    -- Skills/Abilities
    experiences JSONB, -- {"Tremor Sense": 2, "Commander": 2}
    features JSONB[], -- [{name: "Relentless (3)", type: "Passive", desc: "..."}]

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adversaries_tier ON daggerheart_adversaries(tier);
CREATE INDEX idx_adversaries_type ON daggerheart_adversaries(type);
CREATE INDEX idx_adversaries_name ON daggerheart_adversaries(name);
CREATE INDEX idx_adversaries_embedding ON daggerheart_adversaries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_adversaries_search ON daggerheart_adversaries USING GIN (to_tsvector('english', searchable_text));
```

#### 2. Environments (~20 entries)

```sql
CREATE TABLE daggerheart_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    type TEXT DEFAULT 'Event', -- Event, Hazard, Scene Setup
    description TEXT NOT NULL,
    impulses TEXT[], -- ["Profane the land", "unite realms"]

    -- Scene Mechanics
    difficulty INT,
    potential_adversaries TEXT[], -- Suggested enemy types/names
    features JSONB[], -- [{name: "Desecrated Ground", type: "Passive", desc: "...", gm_prompts: "..."}]

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_environments_tier ON daggerheart_environments(tier);
CREATE INDEX idx_environments_type ON daggerheart_environments(type);
CREATE INDEX idx_environments_embedding ON daggerheart_environments USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_environments_search ON daggerheart_environments USING GIN (to_tsvector('english', searchable_text));
```

#### 3. Weapons (~194 entries)

```sql
CREATE TABLE daggerheart_weapons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    weapon_category TEXT NOT NULL, -- 'Primary' or 'Secondary'
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),

    -- Weapon Stats
    trait TEXT NOT NULL, -- Strength, Agility, Finesse, Instinct, Knowledge, Presence
    range TEXT NOT NULL, -- Melee, Very Close, Close, Far, Very Far
    damage TEXT NOT NULL, -- 'd10+9 phy', '2d6+5 mag'
    burden TEXT, -- Two-Handed, One-Handed, NULL

    -- Special Properties
    feature TEXT, -- Special ability or "—"

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weapons_tier ON daggerheart_weapons(tier);
CREATE INDEX idx_weapons_category ON daggerheart_weapons(weapon_category);
CREATE INDEX idx_weapons_trait ON daggerheart_weapons(trait);
CREATE INDEX idx_weapons_embedding ON daggerheart_weapons USING ivfflat (embedding vector_cosine_ops);
```

#### 4. Armor (~36 entries)

```sql
CREATE TABLE daggerheart_armor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 3),

    -- Armor Stats
    base_thresholds TEXT NOT NULL, -- "13/31"
    base_score INT NOT NULL,
    feature TEXT, -- "Heavy: -1 to Evasion" or "—"

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_armor_tier ON daggerheart_armor(tier);
CREATE INDEX idx_armor_embedding ON daggerheart_armor USING ivfflat (embedding vector_cosine_ops);
```

#### 5. Items (~62 entries)

```sql
CREATE TABLE daggerheart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    item_type TEXT DEFAULT 'Item', -- Item, Relic, Charm

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_type ON daggerheart_items(item_type);
CREATE INDEX idx_items_embedding ON daggerheart_items USING ivfflat (embedding vector_cosine_ops);
```

#### 6. Consumables (~62 entries)

```sql
CREATE TABLE daggerheart_consumables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    uses INT DEFAULT 1, -- Number of uses before consumed

    -- Search & Discovery
    searchable_text TEXT,
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumables_embedding ON daggerheart_consumables USING ivfflat (embedding vector_cosine_ops);
```

#### 7. Ancestries (~20 entries)

```sql
CREATE TABLE daggerheart_ancestries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    features JSONB[], -- [{name: "Purposeful Design", desc: "..."}]

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. Classes (~11 entries)

```sql
CREATE TABLE daggerheart_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Class Stats
    domains TEXT[], -- ['Grace', 'Codex']
    starting_evasion INT NOT NULL,
    starting_hp INT NOT NULL,
    class_items TEXT[],

    -- Class Features
    hope_feature JSONB, -- {name: "Make a Scene", desc: "...", cost: 3}
    class_feature JSONB, -- {name: "Rally", desc: "..."}

    -- Flavor
    background_questions TEXT[],
    connection_questions TEXT[],

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. Subclasses (~20 entries)

```sql
CREATE TABLE daggerheart_subclasses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    parent_class TEXT NOT NULL, -- Class name (FK would require seeding order)
    description TEXT NOT NULL,
    features JSONB[], -- Subclass-specific features

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subclasses_class ON daggerheart_subclasses(parent_class);
```

#### 10. Domains (~11 entries)

```sql
CREATE TABLE daggerheart_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 11. Abilities (~191 entries)

```sql
CREATE TABLE daggerheart_abilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ability_type TEXT NOT NULL, -- Foundation, Specialization, Pinnacle
    parent_class TEXT, -- Class name
    parent_subclass TEXT, -- Subclass name
    domain TEXT, -- Which domain card this belongs to

    -- Ability Details
    description TEXT NOT NULL,
    prerequisites TEXT[], -- Other abilities required
    level_requirement INT,

    -- Search & Discovery
    searchable_text TEXT,

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abilities_class ON daggerheart_abilities(parent_class);
CREATE INDEX idx_abilities_subclass ON daggerheart_abilities(parent_subclass);
CREATE INDEX idx_abilities_type ON daggerheart_abilities(ability_type);
CREATE INDEX idx_abilities_domain ON daggerheart_abilities(domain);
```

#### 12. Communities (~11 entries)

```sql
CREATE TABLE daggerheart_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    community_moves TEXT[], -- Downtime/community actions

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 13. Frames (~3 entries)

```sql
CREATE TABLE daggerheart_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    themes TEXT[],
    typical_adversaries TEXT[],
    lore TEXT,

    -- Search & Discovery
    embedding vector(1536),

    -- Metadata
    source_book TEXT DEFAULT 'Core Rules',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frames_name ON daggerheart_frames(name);
CREATE INDEX idx_frames_embedding ON daggerheart_frames USING ivfflat (embedding vector_cosine_ops);
```

---

## Markdown Parsers

**Location**: `scripts/parsers/`

### Parser Structure (Example: Adversaries)

```typescript
// scripts/parsers/adversary-parser.ts
import type { Adversary } from './types'

export function parseAdversary(markdown: string, filename: string): Adversary {
  const lines = markdown.split('\n').map((l) => l.trim())

  // Line 1: # ACID BURROWER
  const name = lines[0]?.replace(/^#\s*/, '').trim() || extractNameFromFilename(filename)

  // Line 3: ***Tier 1 Solo***
  const tierLine = lines.find((l) => l.includes('***Tier'))
  const tierMatch = tierLine?.match(/Tier (\d+)\s+(.+?)\*/)
  const tier = parseInt(tierMatch?.[1] || '1')
  const type = tierMatch?.[2]?.trim() || 'Standard'

  // Line 4: *Description*
  const descLine = lines.find((l, i) => i > 2 && l.startsWith('*') && !l.startsWith('**'))
  const description = descLine?.replace(/^\*/, '').replace(/\*$/, '').trim() || ''

  // Line 5: **Motives & Tactics:** ...
  const motivesLine = lines.find((l) => l.includes('Motives & Tactics'))
  const motivesTactics =
    motivesLine
      ?.split(':')[1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) || []

  // Blockquote stats: > **Difficulty:** 14 | **Thresholds:** 8/15 | ...
  const statsLine = lines.find((l) => l.startsWith('> **Difficulty:'))
  const stats = parseStatsLine(statsLine || '')

  // Features section
  const features = parseFeatures(lines)

  // Build searchable text
  const searchableText = [
    name,
    description,
    ...motivesTactics,
    ...features.map((f) => `${f.name} ${f.desc}`),
  ].join(' ')

  return {
    name,
    tier,
    type,
    description,
    motives_tactics: motivesTactics,
    ...stats,
    features,
    searchable_text: searchableText,
  }
}

function parseStatsLine(line: string): AdversaryStats {
  // Parse: > **Difficulty:** 14 | **Thresholds:** 8/15 | **HP:** 8 | **Stress:** 3
  //        > **ATK:** +3 | **Claws:** Very Close | 1d12+2 phy
  //        > **Experience:** Tremor Sense +2

  const difficulty = parseInt(line.match(/Difficulty:\*\*\s*(\d+)/)?.[1] || '10')
  const thresholds = line.match(/Thresholds:\*\*\s*([^\|]+)/)?.[1]?.trim() || 'None'
  const hp = parseInt(line.match(/HP:\*\*\s*(\d+)/)?.[1] || '1')
  const stress = parseInt(line.match(/Stress:\*\*\s*(\d+)/)?.[1] || '1')
  const atk = line.match(/ATK:\*\*\s*([^\|]+)/)?.[1]?.trim() || '+0'

  // Weapon could be after ATK or as label: **Claws:**
  const weaponMatch = line.match(/\*\*([A-Za-z\s]+):\*\*\s*(Melee|Very Close|Close|Far|Very Far)/)
  const weapon = weaponMatch?.[1]?.trim() || 'Weapon'
  const range = weaponMatch?.[2] || 'Melee'

  // Damage: 1d12+2 phy
  const dmgMatch = line.match(/([\dd\+\-]+\s+\w+)/)
  const dmg = dmgMatch?.[1] || '1 phy'

  // Experience: Tremor Sense +2
  const expLine = line.match(/Experience:\*\*\s*(.+?)(\||$)/)?.[1]?.trim()
  const experiences = parseExperiences(expLine)

  return {
    difficulty,
    thresholds,
    hp,
    stress,
    atk,
    weapon,
    range,
    dmg,
    experiences,
  }
}

function parseFeatures(lines: string[]): AdversaryFeature[] {
  const features: AdversaryFeature[] = []
  const featureStart = lines.findIndex((l) => l.startsWith('## FEATURES'))

  if (featureStart === -1) return features

  for (let i = featureStart + 1; i < lines.length; i++) {
    const line = lines[i]

    // Feature format: ***Relentless (3) - Passive:*** description
    if (line.startsWith('***') && line.includes(':***')) {
      const [nameType, ...descParts] = line.split(':***')
      const nameTypeCleaned = nameType.replace(/^\*+/, '').replace(/\*+$/, '')

      // Extract type: "Relentless (3) - Passive" -> type = "Passive"
      const typeMatch = nameTypeCleaned.match(/\s-\s(Passive|Action|Reaction)$/)
      const type = typeMatch?.[1] || 'Passive'
      const name = nameTypeCleaned.replace(/\s-\s(Passive|Action|Reaction)$/, '').trim()

      // Collect description (may span multiple lines)
      let desc = descParts.join(':').trim()
      let j = i + 1
      while (j < lines.length && lines[j] && !lines[j].startsWith('***')) {
        desc += ' ' + lines[j]
        j++
      }

      features.push({
        name,
        type: type as 'Passive' | 'Action' | 'Reaction',
        desc: desc.trim(),
      })

      i = j - 1
    }
  }

  return features
}

function parseExperiences(expString?: string): Record<string, number> {
  if (!expString) return {}

  const experiences: Record<string, number> = {}
  // Parse: "Tremor Sense +2, Commander +3"
  const parts = expString.split(',')
  for (const part of parts) {
    const match = part.trim().match(/^(.+?)\s+\+(\d+)$/)
    if (match) {
      experiences[match[1].trim()] = parseInt(match[2])
    }
  }
  return experiences
}

function extractNameFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '').replace(/_/g, ' ')
}
```

### Other Parsers (Similar Structure)

```typescript
// scripts/parsers/weapon-parser.ts
export function parseWeapon(markdown: string): Weapon { ... }

// scripts/parsers/armor-parser.ts
export function parseArmor(markdown: string): Armor { ... }

// scripts/parsers/environment-parser.ts
export function parseEnvironment(markdown: string): Environment { ... }

// scripts/parsers/class-parser.ts
export function parseClass(markdown: string): Class { ... }

// ... etc for all 13 types
```

---

## Seeding Script

**Location**: `scripts/seed-daggerheart-content.ts`

```typescript
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import path from 'path'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { parseAdversary } from './parsers/adversary-parser'
import { parseWeapon } from './parsers/weapon-parser'
import { parseArmor } from './parsers/armor-parser'
import { parseEnvironment } from './parsers/environment-parser'
import { parseItem } from './parsers/item-parser'
import { parseConsumable } from './parsers/consumable-parser'
import { parseAncestry } from './parsers/ancestry-parser'
import { parseClass } from './parsers/class-parser'
import { parseSubclass } from './parsers/subclass-parser'
import { parseDomain } from './parsers/domain-parser'
import { parseAbility } from './parsers/ability-parser'
import { parseCommunity } from './parsers/community-parser'
import { parseFrame } from './parsers/frame-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

async function seedAllContent() {
  console.log('🌱 Starting Daggerheart content seeding...\n')
  const supabase = createServiceRoleClient()

  try {
    // 1. Adversaries
    await seedAdversaries(supabase)

    // 2. Environments
    await seedEnvironments(supabase)

    // 3. Weapons
    await seedWeapons(supabase)

    // 4. Armor
    await seedArmor(supabase)

    // 5. Items
    await seedItems(supabase)

    // 6. Consumables
    await seedConsumables(supabase)

    // 7. Ancestries
    await seedAncestries(supabase)

    // 8. Classes
    await seedClasses(supabase)

    // 9. Subclasses
    await seedSubclasses(supabase)

    // 10. Domains
    await seedDomains(supabase)

    // 11. Abilities
    await seedAbilities(supabase)

    // 12. Communities
    await seedCommunities(supabase)

    // 13. Frames
    await seedFrames(supabase)

    console.log('\n✅ Seeding complete!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

async function seedAdversaries(supabase: any) {
  console.log('📦 Seeding adversaries...')

  const files = await glob(`${SRD_PATH}/adversaries/*.md`)
  let count = 0

  for (const file of files) {
    try {
      const markdown = await readFile(file, 'utf-8')
      const filename = path.basename(file)
      const adversary = parseAdversary(markdown, filename)

      // Upsert (idempotent)
      const { error } = await supabase
        .from('daggerheart_adversaries')
        .upsert(adversary, { onConflict: 'name' })

      if (error) {
        console.error(`  ❌ Failed to seed ${filename}:`, error.message)
      } else {
        count++
        process.stdout.write(`\r  ✓ Seeded ${count} adversaries`)
      }
    } catch (err) {
      console.error(`\n  ❌ Error parsing ${file}:`, err)
    }
  }

  console.log(`\n  ✅ Seeded ${count} adversaries\n`)
}

async function seedWeapons(supabase: any) {
  console.log('📦 Seeding weapons...')

  const files = await glob(`${SRD_PATH}/weapons/*.md`)
  let count = 0

  for (const file of files) {
    try {
      const markdown = await readFile(file, 'utf-8')
      const weapon = parseWeapon(markdown, path.basename(file))

      const { error } = await supabase
        .from('daggerheart_weapons')
        .upsert(weapon, { onConflict: 'name' })

      if (error) {
        console.error(`  ❌ Failed to seed ${path.basename(file)}:`, error.message)
      } else {
        count++
        process.stdout.write(`\r  ✓ Seeded ${count} weapons`)
      }
    } catch (err) {
      console.error(`\n  ❌ Error parsing ${file}:`, err)
    }
  }

  console.log(`\n  ✅ Seeded ${count} weapons\n`)
}

// ... Similar functions for other content types

// Run if called directly
if (require.main === module) {
  seedAllContent()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
```

---

## Embedding Generation

**Location**: `scripts/generate-embeddings.ts`

```typescript
import { OpenAI } from 'openai'
import { createServiceRoleClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function generateEmbeddings() {
  console.log('🔮 Generating embeddings...\n')
  const supabase = createServiceRoleClient()

  // 1. Adversaries
  await generateForTable(supabase, 'daggerheart_adversaries')

  // 2. Environments
  await generateForTable(supabase, 'daggerheart_environments')

  // 3. Weapons
  await generateForTable(supabase, 'daggerheart_weapons')

  // 4. Armor
  await generateForTable(supabase, 'daggerheart_armor')

  // 5. Items
  await generateForTable(supabase, 'daggerheart_items')

  // 6. Consumables
  await generateForTable(supabase, 'daggerheart_consumables')

  // 7. Frames
  await generateForTable(supabase, 'daggerheart_frames')

  console.log('\n✅ Embedding generation complete!')
}

async function generateForTable(supabase: any, tableName: string) {
  console.log(`📊 Generating embeddings for ${tableName}...`)

  const { data: rows } = await supabase
    .from(tableName)
    .select('id, searchable_text')
    .is('embedding', null)

  if (!rows || rows.length === 0) {
    console.log(`  ℹ️  No rows to process\n`)
    return
  }

  let count = 0

  for (const row of rows) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: row.searchable_text || `${row.name} ${row.description}`,
      })

      const embedding = response.data[0].embedding

      await supabase.from(tableName).update({ embedding }).eq('id', row.id)

      count++
      process.stdout.write(`\r  ✓ Generated ${count}/${rows.length} embeddings`)
    } catch (err) {
      console.error(`\n  ❌ Failed for ${row.id}:`, err)
    }
  }

  console.log(`\n  ✅ Generated ${count} embeddings for ${tableName}\n`)
}

if (require.main === module) {
  generateEmbeddings()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
```

---

## Testing Requirements

### Integration Tests

**File**: `tests/integration/daggerheart-content.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

describe('Daggerheart Content Database', () => {
  let supabase: ReturnType<typeof createServiceRoleClient>

  beforeAll(() => {
    supabase = createServiceRoleClient()
  })

  describe('Adversaries', () => {
    it('should have adversaries seeded', async () => {
      const { data, error } = await supabase.from('daggerheart_adversaries').select('count')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(100) // ~130 expected
    })

    it('should have valid tier values (1-3)', async () => {
      const { data } = await supabase.from('daggerheart_adversaries').select('tier')

      const tiers = data!.map((row) => row.tier)
      expect(tiers.every((t) => t >= 1 && t <= 3)).toBe(true)
    })

    it('should have searchable_text populated', async () => {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('name, searchable_text')
        .limit(10)

      for (const row of data!) {
        expect(row.searchable_text).toBeTruthy()
        expect(row.searchable_text.length).toBeGreaterThan(0)
      }
    })

    it('should have embeddings generated', async () => {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('name, embedding')
        .not('embedding', 'is', null)
        .limit(5)

      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)

      // Check embedding is vector of 1536 dimensions
      const embedding = data![0].embedding
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBe(1536)
    })

    it('should parse features correctly', async () => {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('name, features')
        .eq('name', 'Acid Burrower')
        .single()

      expect(data).toBeDefined()
      expect(data!.features).toBeDefined()
      expect(Array.isArray(data!.features)).toBe(true)
      expect(data!.features.length).toBeGreaterThan(0)

      const feature = data!.features[0]
      expect(feature).toHaveProperty('name')
      expect(feature).toHaveProperty('type')
      expect(feature).toHaveProperty('desc')
      expect(['Passive', 'Action', 'Reaction']).toContain(feature.type)
    })
  })

  describe('Weapons', () => {
    it('should have weapons seeded', async () => {
      const { data, error } = await supabase.from('daggerheart_weapons').select('count')

      expect(error).toBeNull()
      expect(data!.length).toBeGreaterThan(150) // ~194 expected
    })

    it('should have both Primary and Secondary categories', async () => {
      const { data } = await supabase.from('daggerheart_weapons').select('weapon_category')

      const categories = new Set(data!.map((w) => w.weapon_category))
      expect(categories.has('Primary')).toBe(true)
      expect(categories.has('Secondary')).toBe(true)
    })

    it('should have valid traits', async () => {
      const validTraits = ['Strength', 'Agility', 'Finesse', 'Instinct', 'Knowledge', 'Presence']

      const { data } = await supabase.from('daggerheart_weapons').select('trait')

      const traits = data!.map((w) => w.trait)
      expect(traits.every((t) => validTraits.includes(t))).toBe(true)
    })
  })

  describe('Classes', () => {
    it('should have classes seeded', async () => {
      const { data } = await supabase.from('daggerheart_classes').select('count')

      expect(data!.length).toBeGreaterThanOrEqual(10) // ~11 expected
    })

    it('should have Bard class with correct structure', async () => {
      const { data } = await supabase
        .from('daggerheart_classes')
        .select('*')
        .eq('name', 'Bard')
        .single()

      expect(data).toBeDefined()
      expect(data!.domains).toEqual(['Grace', 'Codex'])
      expect(data!.starting_evasion).toBe(10)
      expect(data!.starting_hp).toBe(5)
      expect(data!.hope_feature).toBeDefined()
      expect(data!.class_feature).toBeDefined()
    })
  })

  describe('Semantic Search', () => {
    it('should find adversaries by semantic similarity', async () => {
      // Get embedding for "underground insect creature"
      const { data: queryEmbed } = await supabase.rpc('get_embedding', {
        query: 'underground insect creature with acid',
      })

      const { data: similar } = await supabase.rpc('search_adversaries', {
        query_embedding: queryEmbed,
        match_count: 5,
      })

      expect(similar).toBeDefined()
      expect(similar!.length).toBeGreaterThan(0)

      // Should find Acid Burrower
      const names = similar!.map((a: any) => a.name)
      expect(names).toContain('Acid Burrower')
    })
  })
})
```

---

## Implementation Steps

1. **Create migration file**
   - Add all 13 table definitions
   - Add indexes
   - Test migration locally

2. **Write parsers** for each content type
   - Start with adversaries (most complex)
   - Test parser with sample files
   - Iterate for all 13 types

3. **Create seeding script**
   - Implement idempotent upsert logic
   - Add progress indicators
   - Test with subset of files first

4. **Run full seed**
   - Execute on all ~900 files
   - Verify counts match expected

5. **Generate embeddings**
   - Create embedding script
   - Run for tables with embedding column
   - Verify dimensions (1536)

6. **Regenerate TypeScript types**
   - `npm run db:types`
   - Verify new tables appear

7. **Write integration tests**
   - Test data integrity
   - Test semantic search
   - Verify all tables populated

8. **Run tests**
   - `npm run test:coverage`

9. **Commit changes**
   - Message: "feat: add Daggerheart content database with 900+ entries"

---

## Verification Checklist

- [ ] Migration creates all 13 tables
- [ ] All indexes created
- [ ] Parsers handle all markdown formats
- [ ] ~130 adversaries seeded
- [ ] ~20 environments seeded
- [ ] ~194 weapons seeded
- [ ] ~36 armor pieces seeded
- [ ] ~62 items seeded
- [ ] ~62 consumables seeded
- [ ] ~20 ancestries seeded
- [ ] ~11 classes seeded
- [ ] ~20 subclasses seeded
- [ ] ~11 domains seeded
- [ ] ~191 abilities seeded
- [ ] ~11 communities seeded
- [ ] ~3 frames seeded
- [ ] Embeddings generated for searchable content
- [ ] Integration tests pass
- [ ] Types regenerated
- [ ] No TypeScript errors
- [ ] Linting passes

---

## Scripts to Add to package.json

```json
{
  "scripts": {
    "seed:daggerheart": "tsx scripts/seed-daggerheart-content.ts",
    "embeddings:generate": "tsx scripts/generate-embeddings.ts"
  }
}
```

---

## Notes

- **Idempotency**: All seed operations use `upsert` with `onConflict: 'name'` - safe to re-run
- **Partial Seeding**: Can seed one table at a time for testing
- **Error Handling**: Parsers log failures but continue processing
- **Performance**: Seeding ~900 entries takes ~5-10 minutes
- **Embeddings**: Separate script to avoid API rate limits, can run after seeding

---

## References

- **SRD Location**: `/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/`
- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md](../IMPLEMENTATION_GAP_ANALYSIS.md)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
