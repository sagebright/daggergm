# Feature: Daggerheart Content Parsers - Phase 3 (Remaining Types)

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Content Foundation
**Estimated Time**: 2-3 hours
**Dependencies**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md), [FEATURE_dh_parsers_phase2.md](FEATURE_dh_parsers_phase2.md) recommended

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

- [ ] All 6 parsers handle their respective content files
- [ ] All parsers extract searchable_text (where applicable)
- [ ] Integration tests pass for these 6 tables
- [ ] Seeding script populates database successfully
- [ ] ~85 total entries verified in database
- [ ] **All 13 content types now complete** (adversaries done in Phase 1 Status)

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
  const searchable_text = `${name} ${description} ${impulses?.join(' ') || ''}`.trim()

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
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
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

// Implement seed functions similar to Phase 1 & 2...
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

    expect(totalCount).toBeGreaterThanOrEqual(80)
  })
})
```

---

## Implementation Steps

1. **Create 6 parser files** (2-3 hours total)
2. **Implement ancestries parser** (~30 min)
3. **Implement subclasses parser** (~30 min)
4. **Implement environments parser** (~45 min) - Most complex of this group
5. **Implement domain parser** (~15 min) - Very simple
6. **Implement community parser** (~20 min)
7. **Implement frame parser** (~20 min)
8. **Create seeding script** (~20 min)
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

## References

- **Status**: [FEATURE_daggerheart_content_STATUS.md](FEATURE_daggerheart_content_STATUS.md)
- **Phase 1**: [FEATURE_dh_parsers_phase1.md](FEATURE_dh_parsers_phase1.md)
- **Phase 2**: [FEATURE_dh_parsers_phase2.md](FEATURE_dh_parsers_phase2.md)

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Next**: Phase 4 - Embeddings generation & final seeding
