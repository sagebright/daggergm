# Feature: Scene Expansion with Daggerheart Content Integration

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 2 - Fix Expansion Structure
**Estimated Time**: 4 hours
**Dependencies**: Daggerheart content database (completed)

---

## Overview

Restructure scene expansion to return structured components that integrate with the Daggerheart content database. Each expanded **Scene** can include: scene descriptions, narration, NPCs, adversaries, environments, and loot. This moves away from LLM-generated stats to leveraging our rich database of 738+ Daggerheart content entries with vector search.

**Terminology**: Adventures contain 3-5 Scenes. Each Scene gets its own expansion with up to 6 component types. The concept of "Movements" is replaced entirely by Scenes.

---

## Acceptance Criteria

- [ ] `SceneExpansion` type supports all 6 component types
- [ ] **REQUIRED**: Scene descriptions always present for GM
- [ ] **OPTIONAL**: Narration (read-aloud text)
- [ ] **OPTIONAL**: NPCs with references to classes/ancestries/communities
- [ ] **OPTIONAL**: Adversaries pulled from `daggerheart_adversaries` table
- [ ] **OPTIONAL**: Environments pulled from `daggerheart_environments` table
- [ ] **OPTIONAL**: Loot pulled from items/weapons/armor/consumables tables
- [ ] Loot is tier-appropriate for party level (level 2 party gets Tier 1-2 items)
- [ ] Database saves new structure correctly
- [ ] Vector search finds relevant Daggerheart content
- [ ] Integration tests verify structure and database queries
- [ ] Backward compatibility handled (or breaking change documented)

---

## Component Specifications

### 1. Scene Descriptions (REQUIRED)

**Purpose**: Notes for GM to describe what the scene looks, feels, sounds, and/or smells like.

**Structure**:

```typescript
{
  descriptions: string[] // Array of 3-5 text snippets
}
```

**Example**:

```json
{
  "descriptions": [
    "The chamber is dimly lit by bioluminescent fungi growing on the walls",
    "A constant dripping sound echoes from somewhere deeper in the cave",
    "The air is thick with moisture and the smell of decay",
    "Strange carvings cover the stone archway leading further in"
  ]
}
```

---

### 2. Narration (OPTIONAL)

**Purpose**: Read-aloud text for dramatic moments or dialogue.

**Structure**:

```typescript
{
  narration: string | null
}
```

**Example**:

```json
{
  "narration": "As you approach the ancient altar, a voice echoes through the chamber: 'Who dares disturb the slumber of ages?'"
}
```

---

### 3. NPCs (OPTIONAL)

**Purpose**: Named characters for interaction or conflict.

**Structure**:

```typescript
export interface NPC {
  id: string // UUID for component regeneration
  name: string

  // Daggerheart character data (REQUIRED)
  classId: string // Reference to daggerheart_classes
  className: string // Display name (e.g., "Bard")
  communityId: string // Reference to daggerheart_communities
  communityName: string // Display name (e.g., "Wanderer")
  ancestryId: string // Reference to daggerheart_ancestries
  ancestryName: string // Display name (e.g., "Human")

  // Stats (based on class)
  level: number // 1-10, typically matches party level ±1
  hp: number // Based on class starting HP + level
  stress: number // Based on class
  evasion: number // Based on class starting evasion

  // Optional equipment (OPTIONAL)
  abilities?: Array<{
    abilityId: string // Reference to daggerheart_abilities
    abilityName: string
  }>
  armor?: {
    armorId: string // Reference to daggerheart_armor
    armorName: string
    tier: number
  }
  weapon?: {
    weaponId: string // Reference to daggerheart_weapons
    weaponName: string
    tier: number
  }

  // Personality/role
  personality: string // LLM-generated
  role: 'ally' | 'neutral' | 'antagonist' | 'quest_giver'
  description: string // Physical description
}
```

**Example**:

```json
{
  "npcs": [
    {
      "id": "npc-123",
      "name": "Kaelen the Wanderer",
      "classId": "uuid-bard",
      "className": "Bard",
      "communityId": "uuid-wanderer",
      "communityName": "Wanderer",
      "ancestryId": "uuid-human",
      "ancestryName": "Human",
      "level": 3,
      "hp": 18,
      "stress": 15,
      "evasion": 13,
      "weapon": {
        "weaponId": "uuid-longsword",
        "weaponName": "Longsword",
        "tier": 1
      },
      "personality": "Jovial but secretive, quick with a joke to deflect questions",
      "role": "quest_giver",
      "description": "A middle-aged human with weathered features and a lute slung across their back"
    }
  ]
}
```

---

### 4. Adversaries (OPTIONAL)

**Purpose**: Combat encounters using official Daggerheart adversaries.

**Structure**:

```typescript
export interface SceneAdversary {
  id: string // UUID for component regeneration
  adversaryId: string // Reference to daggerheart_adversaries
  adversaryName: string // Display name (e.g., "ACID BURROWER")
  quantity: number // How many of this adversary

  // Customizations (optional adjustments)
  customizations?: {
    nameOverride?: string // "Young Acid Burrower"
    hpModifier?: number // +5 or -3 to adjust difficulty
    stressModifier?: number
    customTactics?: string // Override default motives_tactics
    customDescription?: string // Contextual description
  }
}
```

**Example**:

```json
{
  "adversaries": [
    {
      "id": "adv-456",
      "adversaryId": "uuid-acid-burrower",
      "adversaryName": "ACID BURROWER",
      "quantity": 2,
      "customizations": {
        "customDescription": "These burrowers seem agitated, likely disturbed from their nest"
      }
    }
  ]
}
```

**Vector Search**: Use semantic search to find relevant adversaries based on scene type, party level, and narrative context.

---

### 5. Environments (OPTIONAL)

**Purpose**: Rich environmental descriptions from official SRD.

**Structure**:

```typescript
export interface SceneEnvironment {
  environmentId: string // Reference to daggerheart_environments
  environmentName: string // Display name (e.g., "THE WITHERWILD")
  customDescription?: string // LLM-generated complement to environment
}
```

**Example**:

```json
{
  "environment": {
    "environmentId": "uuid-witherwild",
    "environmentName": "THE WITHERWILD",
    "customDescription": "This section of the Witherwild is particularly overgrown, with vines that seem to pulse with unnatural life"
  }
}
```

---

### 6. Loot (OPTIONAL)

**Purpose**: Rewards from items/weapons/armor/consumables tables.

**Structure**:

```typescript
export interface SceneLoot {
  items: Array<{
    itemId: string // Reference to daggerheart_items/weapons/armor/consumables
    itemName: string
    itemType: 'item' | 'weapon' | 'armor' | 'consumable'
    tier?: number // For weapons/armor (tier-appropriate for party level)
    quantity: number
  }>
}
```

**Tier Appropriateness Rules**:

- Party Level 1-3: Tier 1 loot
- Party Level 4-6: Tier 1-2 loot
- Party Level 7-10: Tier 2-3 loot

**Example**:

```json
{
  "loot": {
    "items": [
      {
        "itemId": "uuid-healing-potion",
        "itemName": "Healing Potion",
        "itemType": "consumable",
        "quantity": 2
      },
      {
        "itemId": "uuid-chainmail",
        "itemName": "Chainmail",
        "itemType": "armor",
        "tier": 1,
        "quantity": 1
      }
    ]
  }
}
```

---

## Technical Specification

### Type Definitions

**File**: `lib/llm/types.ts`

```typescript
// NPC with Daggerheart character data
export interface NPC {
  id: string
  name: string

  // Character references
  classId: string
  className: string
  communityId: string
  communityName: string
  ancestryId: string
  ancestryName: string

  // Stats
  level: number
  hp: number
  stress: number
  evasion: number

  // Optional equipment
  abilities?: Array<{
    abilityId: string
    abilityName: string
  }>
  armor?: {
    armorId: string
    armorName: string
    tier: number
  }
  weapon?: {
    weaponId: string
    weaponName: string
    tier: number
  }

  // Personality
  personality: string
  role: 'ally' | 'neutral' | 'antagonist' | 'quest_giver'
  description: string
}

// Adversary from database
export interface SceneAdversary {
  id: string
  adversaryId: string
  adversaryName: string
  quantity: number
  customizations?: {
    nameOverride?: string
    hpModifier?: number
    stressModifier?: number
    customTactics?: string
    customDescription?: string
  }
}

// Environment from database
export interface SceneEnvironment {
  environmentId: string
  environmentName: string
  customDescription?: string
}

// Loot from database
export interface SceneLoot {
  items: Array<{
    itemId: string
    itemName: string
    itemType: 'item' | 'weapon' | 'armor' | 'consumable'
    tier?: number
    quantity: number
  }>
}

// Full expansion result for a Scene
export interface SceneExpansion {
  // REQUIRED
  descriptions: string[]

  // OPTIONAL components
  narration?: string | null
  npcs?: NPC[]
  adversaries?: SceneAdversary[]
  environment?: SceneEnvironment
  loot?: SceneLoot

  // Legacy fields
  gmNotes?: string
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}

// Scene type (replaces Movement concept entirely)
export interface Scene {
  id: string
  title: string
  type: 'combat' | 'exploration' | 'social' | 'puzzle'
  description: string // Scaffold summary
  estimatedTime?: string
  orderIndex?: number
  locked?: boolean

  // Expansion data (populated after expansion)
  expansion?: SceneExpansion
}

// Adventure type (contains 3-5 Scenes)
export interface Adventure {
  id: string
  title: string
  frame: string
  focus: string
  partySize: number
  partyLevel: number

  // Array of 3-5 scenes
  scenes: Scene[]

  // ... other adventure fields
}
```

---

### OpenAI Provider Update

**File**: `lib/llm/openai-provider.ts`

```typescript
private async _expandScene(params: ExpansionParams): Promise<SceneExpansion> {
  // Check cache first
  const cached = await this.checkCache(params)
  if (cached) {
    return cached as SceneExpansion
  }

  // Step 1: Use vector search to find relevant Daggerheart content
  const relevantContent = await this.searchDaggerheartContent(params)

  // Step 2: Build enriched prompt with relevant content
  const systemPrompt = await this.loadFramePrompt(
    params.adventure.frame,
    `scene_${params.scene.type}`,
  )

  const userPrompt = this.buildExpansionPrompt({
    ...params,
    relevantAdversaries: relevantContent.adversaries,
    relevantEnvironments: relevantContent.environments,
    relevantLoot: relevantContent.loot,
    relevantClasses: relevantContent.classes,
    relevantAncestries: relevantContent.ancestries,
    relevantCommunities: relevantContent.communities,
  })

  const temperature = this.getTemperatureForSceneType(params.scene.type)

  const completion = await this.getClient().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0]!.message.content!)

  // Step 3: Transform response to structured format with UUIDs
  const result: SceneExpansion = {
    descriptions: response.descriptions || [],
    narration: response.narration || null,
    npcs: (response.npcs || []).map((npc: any) => ({
      id: crypto.randomUUID(),
      ...npc,
    })),
    adversaries: (response.adversaries || []).map((adv: any) => ({
      id: crypto.randomUUID(),
      ...adv,
    })),
    environment: response.environment || undefined,
    loot: response.loot || undefined,
    gmNotes: response.gmNotes,
    transitions: response.transitions,
  }

  await this.cacheResponse(params, result, completion.usage?.total_tokens)

  return result
}

// New method: Vector search for relevant content
private async searchDaggerheartContent(params: ExpansionParams) {
  const supabase = createClient()

  // Build search query from scene context
  const searchQuery = `${params.scene.title} ${params.scene.description} ${params.adventure.focus}`

  // Search for relevant adversaries (tier-appropriate)
  const { data: adversaries } = await supabase.rpc('search_adversaries', {
    search_query: searchQuery,
    party_level: params.adventure.partyLevel,
    limit: 5
  })

  // Search for relevant environments
  const { data: environments } = await supabase.rpc('search_environments', {
    search_query: searchQuery,
    limit: 3
  })

  // Get tier-appropriate loot
  const lootTier = Math.ceil(params.adventure.partyLevel / 3) // Level 1-3 → Tier 1, etc.
  const { data: weapons } = await supabase
    .from('daggerheart_weapons')
    .select('*')
    .lte('tier', lootTier)
    .limit(5)

  const { data: armor } = await supabase
    .from('daggerheart_armor')
    .select('*')
    .lte('tier', lootTier)
    .limit(5)

  // Get all classes/ancestries/communities for NPC generation
  const { data: classes } = await supabase.from('daggerheart_classes').select('*')
  const { data: ancestries } = await supabase.from('daggerheart_ancestries').select('*')
  const { data: communities } = await supabase.from('daggerheart_communities').select('*')

  return {
    adversaries: adversaries || [],
    environments: environments || [],
    loot: { weapons: weapons || [], armor: armor || [] },
    classes: classes || [],
    ancestries: ancestries || [],
    communities: communities || [],
  }
}

private buildExpansionPrompt(params: ExpansionParams & {
  relevantAdversaries: any[]
  relevantEnvironments: any[]
  relevantLoot: any
  relevantClasses: any[]
  relevantAncestries: any[]
  relevantCommunities: any[]
}): string {
  return `Expand the following scene for a Daggerheart adventure.

**Scene to Expand:**
- Title: ${params.scene.title}
- Type: ${params.scene.type}
- Description: ${params.scene.description}

**Adventure Context:**
- Frame: ${params.adventure.frame}
- Focus: ${params.adventure.focus}
- Party: ${params.adventure.partySize} players, level ${params.adventure.partyLevel}

**Available Daggerheart Content (use these references):**

ADVERSARIES (choose 0-3 that fit the scene):
${params.relevantAdversaries.map((a) => `- ${a.name} (Tier ${a.tier}, ${a.type}): ${a.description}`).join('\n')}

ENVIRONMENTS (choose 0-1 that fits the scene):
${params.relevantEnvironments.map((e) => `- ${e.name}: ${e.description?.substring(0, 200)}`).join('\n')}

CLASSES (for NPCs):
${params.relevantClasses.map((c) => `- ${c.name}`).join(', ')}

ANCESTRIES (for NPCs):
${params.relevantAncestries.map((a) => `- ${a.name}`).join(', ')}

COMMUNITIES (for NPCs):
${params.relevantCommunities.map((c) => `- ${c.name}`).join(', ')}

LOOT OPTIONS (tier-appropriate for party level):
Weapons: ${params.relevantLoot.weapons.map((w: any) => w.name).join(', ')}
Armor: ${params.relevantLoot.armor.map((a: any) => a.name).join(', ')}

**Generate the following components:**

1. **Scene Descriptions** (REQUIRED): Array of 3-5 text snippets describing what the GM should convey about the scene (sights, sounds, smells, atmosphere)

2. **Narration** (OPTIONAL): Single paragraph of read-aloud text for dramatic moments or dialogue. Use sparingly. Set to null if not needed.

3. **NPCs** (OPTIONAL): 0-3 named characters for interaction
   - Reference class/ancestry/community from lists above (use exact names)
   - Level should match party level ±1
   - Calculate HP/stress/evasion based on class
   - Can include weapons/armor from loot options if appropriate
   - Generate personality and role

4. **Adversaries** (OPTIONAL): 0-3 combat threats from the adversaries list
   - Reference by name (must match adversary name exactly)
   - Specify quantity (1-5)
   - Can add customDescription for context

5. **Environment** (OPTIONAL): 0-1 environment from the list
   - Reference by name (must match environment name exactly)
   - Can add customDescription to complement it

6. **Loot** (OPTIONAL): 0-5 items from weapons/armor/consumables
   - Reference by name (must match item name exactly)
   - Specify quantity
   - Only include if contextually appropriate (chest, defeated enemy, etc.)

Return JSON matching this structure:
{
  "descriptions": ["...", "...", "..."],
  "narration": "..." or null,
  "npcs": [{
    "name": "...",
    "className": "Bard",
    "communityName": "Wanderer",
    "ancestryName": "Human",
    "level": 3,
    "hp": 18,
    "stress": 15,
    "evasion": 13,
    "personality": "...",
    "role": "ally|neutral|antagonist|quest_giver",
    "description": "..."
  }],
  "adversaries": [{
    "adversaryName": "ACID BURROWER",
    "quantity": 2,
    "customizations": {
      "customDescription": "..."
    }
  }],
  "environment": {
    "environmentName": "THE WITHERWILD",
    "customDescription": "..."
  },
  "loot": {
    "items": [{
      "itemName": "Healing Potion",
      "itemType": "consumable",
      "quantity": 2
    }]
  },
  "gmNotes": "..." (optional tips),
  "transitions": { "fromPrevious": "...", "toNext": "..." }
}`
}
```

---

## Database Storage

**File**: `app/actions/scenes.ts`

```typescript
// After LLM expansion
const expansion = await getLLMProvider().expandScene({...})

// Resolve database IDs for all referenced content
const resolvedExpansion = await resolveDaggerheartReferences(expansion)

// Update scene with expansion
const updatedScenes = scenes?.map((s) =>
  s.id === sceneId
    ? {
        ...s,
        expansion: resolvedExpansion,
      }
    : s
)

const { error } = await supabase
  .from('adventures')
  .update({
    scenes: updatedScenes as unknown as Json[],
    updated_at: new Date().toISOString(),
  })
  .eq('id', adventureId)

// Helper function to resolve names to IDs
async function resolveDaggerheartReferences(expansion: SceneExpansion) {
  const supabase = createClient()

  // Resolve NPC references
  if (expansion.npcs) {
    for (const npc of expansion.npcs) {
      const { data: classData } = await supabase
        .from('daggerheart_classes')
        .select('id')
        .eq('name', npc.className)
        .single()

      const { data: ancestryData } = await supabase
        .from('daggerheart_ancestries')
        .select('id')
        .eq('name', npc.ancestryName)
        .single()

      const { data: communityData } = await supabase
        .from('daggerheart_communities')
        .select('id')
        .eq('name', npc.communityName)
        .single()

      npc.classId = classData?.id || ''
      npc.ancestryId = ancestryData?.id || ''
      npc.communityId = communityData?.id || ''
    }
  }

  // Resolve adversary references
  if (expansion.adversaries) {
    for (const adv of expansion.adversaries) {
      const { data } = await supabase
        .from('daggerheart_adversaries')
        .select('id')
        .eq('name', adv.adversaryName)
        .single()

      adv.adversaryId = data?.id || ''
    }
  }

  // Resolve environment reference
  if (expansion.environment) {
    const { data } = await supabase
      .from('daggerheart_environments')
      .select('id')
      .eq('name', expansion.environment.environmentName)
      .single()

    expansion.environment.environmentId = data?.id || ''
  }

  // Resolve loot references
  if (expansion.loot) {
    for (const item of expansion.loot.items) {
      const table = `daggerheart_${item.itemType}s` // items, weapons, armors, consumables
      const { data } = await supabase
        .from(table)
        .select('id, tier')
        .eq('name', item.itemName)
        .single()

      item.itemId = data?.id || ''
      if (data?.tier) item.tier = data.tier
    }
  }

  return expansion
}
```

---

## Database Functions for Vector Search

**File**: `supabase/migrations/00009_expansion_search_functions.sql`

```sql
-- Search adversaries by semantic relevance and tier
CREATE OR REPLACE FUNCTION search_adversaries(
  search_query TEXT,
  party_level INT,
  limit_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tier INT,
  type TEXT,
  description TEXT,
  difficulty INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_embedding VECTOR(1536);
  tier_threshold INT;
BEGIN
  -- Get embedding for search query
  search_embedding := openai_embed(search_query);

  -- Calculate tier threshold based on party level
  tier_threshold := LEAST(CEIL(party_level / 3.0), 3);

  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.tier,
    a.type,
    a.description,
    a.difficulty,
    1 - (a.embedding <=> search_embedding) AS similarity
  FROM daggerheart_adversaries a
  WHERE a.tier <= tier_threshold
  ORDER BY a.embedding <=> search_embedding
  LIMIT limit_count;
END;
$$;

-- Search environments by semantic relevance
CREATE OR REPLACE FUNCTION search_environments(
  search_query TEXT,
  limit_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_embedding VECTOR(1536);
BEGIN
  search_embedding := openai_embed(search_query);

  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.description,
    1 - (e.embedding <=> search_embedding) AS similarity
  FROM daggerheart_environments e
  ORDER BY e.embedding <=> search_embedding
  LIMIT limit_count;
END;
$$;
```

---

## Testing Requirements

### Integration Tests

**File**: `__tests__/integration/scene-expansion-structure.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { expandScene } from '@/app/actions/scenes'
import { createClient } from '@/lib/supabase/server'

describe('Scene Expansion with Daggerheart Content', () => {
  let testUserId: string
  let adventureId: string
  let sceneId: string

  beforeEach(async () => {
    // Setup test adventure with scene
  })

  describe('Required Components', () => {
    it('should always return scene descriptions', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(result.success).toBe(true)
      expect(result.expansion.descriptions).toBeDefined()
      expect(Array.isArray(result.expansion.descriptions)).toBe(true)
      expect(result.expansion.descriptions.length).toBeGreaterThan(0)
    })
  })

  describe('Optional Components', () => {
    it('should have narration as string or null', async () => {
      const result = await expandScene(adventureId, sceneId)

      expect(
        typeof result.expansion.narration === 'string' || result.expansion.narration === null,
      ).toBe(true)
    })

    it('should have NPCs array or undefined', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.npcs) {
        expect(Array.isArray(result.expansion.npcs)).toBe(true)
      }
    })

    it('should have adversaries array or undefined', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.adversaries) {
        expect(Array.isArray(result.expansion.adversaries)).toBe(true)
      }
    })
  })

  describe('NPC Structure', () => {
    it('should have valid Daggerheart references for NPCs', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.npcs && result.expansion.npcs.length > 0) {
        const npc = result.expansion.npcs[0]!
        const supabase = createClient()

        // Verify class exists
        const { data: classData } = await supabase
          .from('daggerheart_classes')
          .select('id')
          .eq('id', npc.classId)
          .single()
        expect(classData).toBeDefined()

        // Verify ancestry exists
        const { data: ancestryData } = await supabase
          .from('daggerheart_ancestries')
          .select('id')
          .eq('id', npc.ancestryId)
          .single()
        expect(ancestryData).toBeDefined()

        // Verify community exists
        const { data: communityData } = await supabase
          .from('daggerheart_communities')
          .select('id')
          .eq('id', npc.communityId)
          .single()
        expect(communityData).toBeDefined()
      }
    })

    it('should assign unique IDs to each NPC', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.npcs && result.expansion.npcs.length > 1) {
        const ids = result.expansion.npcs.map((npc) => npc.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
      }
    })
  })

  describe('Adversary Integration', () => {
    it('should reference valid adversaries from database', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.adversaries && result.expansion.adversaries.length > 0) {
        const supabase = createClient()
        const adv = result.expansion.adversaries[0]!

        const { data } = await supabase
          .from('daggerheart_adversaries')
          .select('*')
          .eq('id', adv.adversaryId)
          .single()

        expect(data).toBeDefined()
        expect(data!.name).toBe(adv.adversaryName)
      }
    })

    it('should only use tier-appropriate adversaries', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.adversaries) {
        const supabase = createClient()

        for (const adv of result.expansion.adversaries) {
          const { data } = await supabase
            .from('daggerheart_adversaries')
            .select('tier')
            .eq('id', adv.adversaryId)
            .single()

          const maxTier = Math.ceil(partyLevel / 3) // Party level determines max tier
          expect(data!.tier).toBeLessThanOrEqual(maxTier)
        }
      }
    })
  })

  describe('Loot Integration', () => {
    it('should reference valid items from database', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.loot) {
        const supabase = createClient()

        for (const item of result.expansion.loot.items) {
          const table = `daggerheart_${item.itemType}s`
          const { data } = await supabase.from(table).select('*').eq('id', item.itemId).single()

          expect(data).toBeDefined()
          expect(data!.name).toBe(item.itemName)
        }
      }
    })

    it('should only include tier-appropriate loot', async () => {
      const result = await expandScene(adventureId, sceneId)

      if (result.expansion.loot) {
        const maxTier = Math.ceil(partyLevel / 3)

        for (const item of result.expansion.loot.items) {
          if (item.tier) {
            expect(item.tier).toBeLessThanOrEqual(maxTier)
          }
        }
      }
    })
  })

  describe('Vector Search', () => {
    it('should find relevant adversaries via vector search', async () => {
      const supabase = createClient()

      const { data } = await supabase.rpc('search_adversaries', {
        search_query: 'underground creature cave',
        party_level: 2,
        limit_count: 5,
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data!.length).toBeGreaterThan(0)
      expect(data![0]).toHaveProperty('similarity')
    })

    it('should find relevant environments via vector search', async () => {
      const supabase = createClient()

      const { data } = await supabase.rpc('search_environments', {
        search_query: 'dark forest mystery',
        limit_count: 3,
      })

      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
```

---

## Implementation Steps

1. **Create database migration for search functions**
   - Write `supabase/migrations/00009_expansion_search_functions.sql`
   - Add `search_adversaries()` and `search_environments()` functions
   - Test locally with `npx supabase db push`

2. **Update type definitions in `lib/llm/types.ts`**
   - Add `NPC`, `SceneAdversary`, `SceneEnvironment`, `SceneLoot` interfaces
   - Update to `SceneExpansion` type (rename from `MovementExpansion`)
   - Update `Scene` type with expansion property
   - Update `Adventure` type to contain `scenes: Scene[]` array (replaces movements entirely)

3. **Update OpenAI provider**
   - Rename `_expandMovement()` to `_expandScene()`
   - Add `searchDaggerheartContent()` method for vector search
   - Update `buildExpansionPrompt()` to use scene context
   - Add `resolveDaggerheartReferences()` helper
   - Update temperature method to `getTemperatureForSceneType()`

4. **Update `app/actions/scenes.ts`**
   - Create `expandScene()` action that takes `adventureId`, `sceneId`
   - Integrate vector search before LLM call
   - Resolve content references to database IDs
   - Save structured expansion directly to scene in adventure.scenes array

5. **Write integration tests**
   - Create `__tests__/integration/scene-expansion-structure.test.ts`
   - Test all component types
   - Verify database references are valid
   - Test vector search functions
   - All test calls use `expandScene(adventureId, sceneId)` (no movementId)

6. **Update MSW mocks**
   - Return new structure in test mocks
   - Mock database queries for content

7. **Run tests**
   - `npm run test:coverage` (must be ≥70%)
   - Fix any broken tests

8. **Manual verification**
   - Generate real adventure with 3-5 scenes
   - Expand a scene
   - Inspect database to verify structure and references

9. **Commit changes**
   - Message: "feat: integrate Daggerheart content database into scene expansion (replaces movements)"

---

## Verification Checklist

- [ ] Database migration creates search functions
- [ ] `SceneExpansion` type has all 6 component types
- [ ] `Scene` type contains expansion property
- [ ] `Adventure` type contains scenes array (no more movements)
- [ ] Scene descriptions always populated (required)
- [ ] NPCs reference valid classes/ancestries/communities
- [ ] Adversaries reference valid `daggerheart_adversaries` entries
- [ ] Loot is tier-appropriate for party level
- [ ] Vector search finds relevant content
- [ ] Database correctly stores scenes array with nested expansions
- [ ] Integration tests pass (≥70% coverage)
- [ ] No TypeScript errors
- [ ] Linting passes

---

## Future Enhancements

### Consider: NPC Database Table

**Idea**: Create `daggerheart_npcs` table with pre-generated NPCs for consistency.

**Benefits**:

- Ensures consistent NPC personalities across expansions
- GMs can reference the same NPC in multiple scenes
- Reduces LLM token costs

**Structure**:

```sql
CREATE TABLE daggerheart_npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES daggerheart_classes(id),
  ancestry_id UUID REFERENCES daggerheart_ancestries(id),
  community_id UUID REFERENCES daggerheart_communities(id),
  personality TEXT,
  description TEXT,
  default_role TEXT,

  -- Metadata
  searchable_text TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Decision**: Defer to future feature (not MVP). LLM-generated NPCs are sufficient for now.

---

## Breaking Changes

**This is a BREAKING CHANGE** due to major architectural restructuring:

1. **Movements completely removed**: The concept of "Movements" no longer exists in the data model
2. **Adventures contain Scenes directly**: `adventure.scenes` replaces `adventure.movements`
3. **Expansion on Scenes**: `scene.expansion` contains the 6 component types
4. **Type renames**: `MovementExpansion` → `SceneExpansion`, `Movement` type deleted
5. **Field removal**: Remove old `content` and `enemies` array (replaced by `adversaries`)

### Migration Strategy

**Recommended**: Breaking change acceptable for MVP.

- Update database schema: `adventures.movements` → `adventures.scenes`
- Remove all references to Movement type from codebase
- Remove legacy `content` field entirely
- Remove legacy `enemies` array (replaced by `adversaries` on Scene)
- Update UI to iterate through `adventure.scenes` and access `scene.expansion`
- Accept that old adventures won't display correctly (acceptable for MVP phase)

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:198-255](../IMPLEMENTATION_GAP_ANALYSIS.md#L198-L255)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:106-112](../SYSTEM_OVERVIEW.md#L106-L112)
- **Daggerheart Content Database**: Phase 4 completed (738+ entries with embeddings)
- **Vector Search Implementation**: [lib/supabase/search-content.ts](../../lib/supabase/search-content.ts)

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-27
**Revision**: 2.0 - Integrated Daggerheart content database
