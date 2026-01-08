# Implementation Gap Analysis

**Version**: 1.1
**Date**: 2025-10-28
**Status**: Current State Assessment
**Reference**: [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) v2.1
**Last Update**: Fixed guest system (PR #68)

---

## Executive Summary

This document compares the **intended system** (as corrected in SYSTEM_OVERVIEW.md) against the **current implementation** to identify gaps, misalignments, and missing features.

### Overall Status: 🟡 **PARTIAL IMPLEMENTATION**

- **Database Schema**: ✅ 95% aligned (minor DEFAULT value fix needed)
- **Credit System**: 🔴 **MAJOR GAPS** - missing regeneration limits tracking
- **Authentication**: ✅ **FIXED** - Guest free adventures removed (PR #68, 2025-10-28)
- **Generation Pipeline**: 🟡 **PARTIAL** - Scaffold works, Expansion exists but wrong structure
- **Expansion Components**: 🔴 **MISSING** - No NPCs/Enemies/Descriptions/Narration structure
- **Focus Mode**: 🔴 **MISSING** - No regeneration limit tracking

---

## 1. Database Schema

### ✅ **ALIGNED** (95%)

#### user_profiles Table

**Current Implementation** ([00001_initial_schema.sql:7-14](supabase/migrations/00001_initial_schema.sql#L7-L14)):

```sql
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    credits INT DEFAULT 1 CHECK (credits >= 0),  -- ❌ WRONG: Should be DEFAULT 0
    total_purchased INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Specification** ([SYSTEM_OVERVIEW.md:166-177](docs/SYSTEM_OVERVIEW.md#L166-L177)):

```sql
credits INT DEFAULT 0 (CHECK >= 0)  -- No free credits in MVP
```

**Gap**: `DEFAULT 1` should be `DEFAULT 0` (no free credits in MVP).

**Impact**: 🟡 Low - Existing profiles may have 1 free credit when they shouldn't.

**Fix Required**: Migration to update DEFAULT and optionally reset existing credits to 0.

#### adventures Table

**Status**: ✅ Fully aligned with specification.

#### credit_transactions Table

**Status**: ✅ Exists and correctly structured ([00003_credit_system.sql:1-14](supabase/migrations/00003_credit_system.sql#L1-L14)).

#### RLS Policies

**Status**: ✅ Comprehensive RLS policies in place ([00002_rls_policies.sql](supabase/migrations/00002_rls_policies.sql)).

---

## 2. Credit System

### 🔴 **MAJOR GAPS**

#### A. Credit Consumption Model

**Intended** ([SYSTEM_OVERVIEW.md:141-146](docs/SYSTEM_OVERVIEW.md#L141-L146)):

- **1 credit consumed at initial generation** (upfront)
- Regenerations: FREE but LIMITED
  - Scaffold stage: 10 regenerations max
  - Expansion stage: 20 regenerations max

**Current Implementation** ([app/actions/adventures.ts:96-106](app/actions/adventures.ts#L96-L106)):

```typescript
// Only consume credit for authenticated users
if (userId && !isGuest) {
  try {
    await creditManager.consumeCredit(userId, 'adventure', { adventureId })
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return { success: false, error: 'Insufficient credits to generate adventure' }
    }
    throw error
  }
}
```

**Analysis**: ✅ 1 credit consumed at generation (correct).

**Movement Expansion** ([app/actions/movements.ts:75-86](app/actions/movements.ts#L75-L86)):

```typescript
// Consume credit for expansion
try {
  await creditManager.consumeCredit(userId, 'expansion', {
    adventureId,
    movementId,
  })
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    return { success: false, error: 'Insufficient credits to expand movement' }
  }
  throw error
}
```

**Gap**: 🔴 **WRONG** - Expansion consumes credits when it should be FREE (with limits).

**Refinement** ([app/actions/movements.ts:240-252](app/actions/movements.ts#L240-L252)):

```typescript
// Consume credit for refinement
try {
  await creditManager.consumeCredit(userId, 'expansion', {
    adventureId,
    movementId,
    refinementType: 'refine',
  })
}
```

**Gap**: 🔴 **WRONG** - Refinement (regeneration) consumes credits when it should be FREE (with limits).

#### B. Regeneration Limits

**Intended**:

- Track regeneration count per adventure
- Scaffold stage: 10 regenerations max
- Expansion stage: 20 regenerations max
- Count every button click (individual component or scene)

**Current Implementation**: 🔴 **MISSING**

**Evidence**: No regeneration tracking in:

- Database schema (no `regenerations_used` column)
- `adventures` table metadata
- Server Actions (no limit checks)

**Impact**: 🔴 **CRITICAL** - Users can regenerate infinitely, breaking business model.

---

## 3. Authentication System

### ✅ **FIXED** (PR #68, 2025-10-28)

**Current Status**: Guest free adventures have been removed. All users must authenticate to generate adventures.

#### Historical Issue (Now Fixed)

- Guests can create free account (no payment required)
- **Must have credits to generate** (no free generation in MVP)
- Guest capabilities:
  - View landing page (most functionality grayed out)
  - Download sample adventure
  - Purchase credits via Stripe

#### Current Implementation

**Homepage** ([app/page.tsx:35-39](app/page.tsx#L35-L39)):

```tsx
<Link href="/adventures/new">
  <Button variant="outline" size="lg">
    Try as Guest
  </Button>
</Link>
```

**Gap**: 🔴 Button exists but should be removed or disabled in MVP.

**generateAdventure** ([app/actions/adventures.ts:83-106](app/actions/adventures.ts#L83-L106)):

```typescript
// Check if this is a guest user
if (!userId && validatedConfig.guestEmail) {
  isGuest = true
  // For guests, we'll create one free adventure
  // In a full implementation, you'd check if this email has already created a free adventure
} else if (!userId) {
  return { success: false, error: 'Authentication required' }
}

// Only consume credit for authenticated users
if (userId && !isGuest) {
  try {
    await creditManager.consumeCredit(userId, 'adventure', { adventureId })
  }
}
```

**Gap**: 🔴 **COMPLETELY WRONG**

- Guests get free adventure (should require credits)
- Comment acknowledges it's not fully implemented
- No check for existing guest adventures

**Historical Impact**: 🔴 **CRITICAL** - Was undermining entire business model.

**Fix Applied** (PR #68):

- Removed `guestEmail` parameter from `AdventureConfig`
- Removed "Try as Guest" button from homepage
- `generateAdventure()` now requires authentication
- All tests updated to reflect new behavior
- See: [**tests**/integration/guest-restrictions.test.ts](__tests__/integration/guest-restrictions.test.ts)

---

## 4. Adventure Generation Pipeline

### 🟡 **PARTIAL IMPLEMENTATION**

#### Scaffold Generation

**Status**: ✅ **IMPLEMENTED**

**Evidence** ([lib/llm/openai-provider.ts:44-83](lib/llm/openai-provider.ts#L44-L83)):

- Generates 3-5 movements with title, type, description
- Returns structured `ScaffoldResult`
- Caching implemented

**Alignment**: ✅ Matches specification.

#### Focus Mode (Scaffold)

**Status**: 🔴 **MISSING**

**Intended**: User can regenerate, edit, or lock individual movements with 10 regeneration limit.

**Current**:

- ✅ Movement update exists ([app/actions/movements.ts:328-430](app/actions/movements.ts#L328-L430))
- 🔴 No regeneration action
- 🔴 No lock/unlock mechanism
- 🔴 No regeneration limit tracking

#### Expansion

**Status**: 🟡 **WRONG STRUCTURE**

**Intended** ([SYSTEM_OVERVIEW.md:106-112](docs/SYSTEM_OVERVIEW.md#L106-L112)):

```
4. Expansion: AI generates 4 components per scene:
   - NPCs: 0, 1, or many non-player characters with stats/personality
   - Enemies: 0, 1, or many adversaries with combat stats
   - Descriptions: Text the GM can draw from to describe the scene
   - Narration: (Optional) Text the GM reads aloud to players
```

**Current Implementation** ([lib/llm/types.ts:50-73](lib/llm/types.ts#L50-L73)):

```typescript
export interface MovementResult {
  content: string  // ❌ Single text blob, not 4 components
  mechanics?: {
    dcChecks?: Array<...>
    combatEncounter?: {
      enemies: Array<...>  // ✅ Partial - has enemies
      environment: string
      objectives: string[]
    }
  }
  gmNotes?: string  // 🟡 Exists but not structured as intended
  transitions?: {
    fromPrevious?: string
    toNext?: string
  }
}
```

**Gap**: 🔴 **MAJOR STRUCTURAL MISMATCH**

- Returns single `content` string instead of 4 separate components
- No `npcs` array
- No `descriptions` field
- No `narration` field
- `gmNotes` exists but not the same as intended descriptions

**Impact**: 🔴 High - Core UX feature not correctly structured.

#### Focus Mode (Expansion)

**Status**: 🔴 **MISSING**

**Intended**: Re-enter Focus Mode to regenerate, edit, lock expansion components (20 regeneration limit).

**Current**:

- 🔴 No component-level regeneration
- 🔴 No 20-regeneration limit tracking

---

## 5. Expansion Components

### 🔴 **MISSING STRUCTURE**

#### NPCs Component

**Intended**:

- Array of NPC objects
- Each with: name, personality, stats, role in scene
- 0, 1, or many per scene

**Current**: 🔴 Not structured as separate component.

**Evidence**: Only `keyNPCs` string array in metadata ([lib/llm/types.ts:24-26](lib/llm/types.ts#L24-L26)):

```typescript
metadata?: {
  suggestedLoot?: string[]
  keyNPCs?: string[]  // Just names, not full NPCs
  environmentalFeatures?: string[]
}
```

#### Enemies Component

**Intended**:

- Array of enemy objects
- Each with: name, quantity, stats, tactics
- 0, 1, or many per scene

**Current**: 🟡 **PARTIAL** ([lib/llm/types.ts:58-66](lib/llm/types.ts#L58-L66)):

```typescript
combatEncounter?: {
  enemies: Array<{
    name: string
    quantity: number
    tactics: string
  }>
  environment: string
  objectives: string[]
}
```

**Gap**: Enemies exist but only within `combatEncounter`, not as top-level component.

#### Descriptions Component

**Intended**: Text the GM can draw from to describe scene and components.

**Current**: 🔴 Not implemented as structured component.

**Closest Match**: `gmNotes` field, but it's a single string, not organized descriptions.

#### Narration Component

**Intended**: Optional text GM reads aloud (dialogue, descriptive text).

**Current**: 🔴 Not implemented.

---

## 6. Focus Mode

### 🔴 **MISSING CORE FEATURES**

#### A. Regeneration Action

**Intended**: "Regenerate" button that calls LLM with locked context.

**Current**: 🔴 No regeneration action exists.

**Evidence**:

- No `regenerateMovement` Server Action
- No `regenerateComponent` Server Action
- Only `refineMovementContent` exists (different from regeneration)

**Difference**:

- **Regeneration**: Completely rewrite movement/component
- **Refinement**: Apply user instruction to existing content

#### B. Lock/Unlock Mechanism

**Intended**: Users can lock movements to prevent overwrites during regeneration.

**Current**: 🔴 Not implemented.

**Evidence**:

- No `locked` field in Movement type ([lib/llm/types.ts:30-36](lib/llm/types.ts#L30-L36))
- No lock/unlock Server Action
- No UI for locking

#### C. Regeneration Limit Tracking

**Intended**:

- Track regenerations per adventure
- Different limits for Scaffold (10) and Expansion (20)
- Enforce limits before calling LLM

**Current**: 🔴 Not implemented.

**Missing**:

- No `regenerations_used` field in DB
- No limit check in Server Actions
- No UI showing remaining regenerations

---

## 7. User Flows

### A. Guest User Flow (MVP)

**Intended** ([SYSTEM_OVERVIEW.md:508-538](docs/SYSTEM_OVERVIEW.md#L508-L538)):

1. Land on homepage
2. See features (most grayed out)
3. Download sample adventure OR Buy credits
4. Complete Stripe → Create account
5. Dashboard with credits
6. Generate adventure (consumes 1 credit)

**Current** ([app/page.tsx](app/page.tsx)):

1. Land on homepage ✅
2. All features active (not grayed out) 🔴
3. "Try as Guest" button → direct adventure generation 🔴
4. No sample download 🔴
5. Guest can generate free adventure 🔴

**Gap**: 🔴 **Complete flow mismatch**.

### B. Registered User Flow

**Intended**:

1. Login ✅
2. Dashboard shows credits, past adventures ✅
3. Generate adventure (1 credit) ✅
4. Focus Mode with 10 regenerations 🔴
5. Expansion with 4 components 🔴
6. Re-enter Focus Mode with 20 regenerations 🔴
7. Export Markdown ✅

**Current**:

- Steps 1-3, 7: ✅ Working
- Steps 4-6: 🔴 Missing/wrong

---

## 8. Priority Matrix

### 🔴 **CRITICAL** (Breaks Business Model / Core UX)

1. **Guest system free adventure** - Must require credits immediately
2. **Credit consumption on expansion/refinement** - Should be free with limits
3. **Regeneration limits** - Infinite regenerations unsustainable
4. **Expansion component structure** - Core UX feature wrong

### 🟡 **HIGH** (Important but not broken)

5. **Sample adventure download** - MVP requirement
6. **Lock/unlock mechanism** - Quality of life for Focus Mode
7. **Landing page restrictions for guests** - UI polish

### 🟢 **MEDIUM** (Can defer post-MVP)

8. **user_profiles.credits DEFAULT 1→0** - Low impact if migrations handle
9. **Refinement vs. Regeneration** - Currently only has refinement

---

## 9. Recommended Implementation Order

### Phase 1: Fix Business Model (Days 1-2)

**Goal**: Prevent revenue loss from free adventures/regenerations

1. **Remove guest free adventure**
   - Update [app/actions/adventures.ts:83-106](app/actions/adventures.ts#L83-L106)
   - Remove `isGuest` logic from credit consumption
   - Require authentication for all adventure generation

2. **Add regeneration tracking to DB**

   ```sql
   ALTER TABLE adventures ADD COLUMN scaffold_regenerations_used INT DEFAULT 0;
   ALTER TABLE adventures ADD COLUMN expansion_regenerations_used INT DEFAULT 0;
   ```

3. **Remove credit consumption from expansion/refinement**
   - Update [app/actions/movements.ts:75-86](app/actions/movements.ts#L75-L86)
   - Update [app/actions/movements.ts:240-252](app/actions/movements.ts#L240-L252)
   - Add regeneration limit checks instead

4. **Implement regeneration limit enforcement**
   - Check limits before calling LLM
   - Increment counters after successful generation
   - Return clear error when limit reached

### Phase 2: Fix Expansion Structure (Days 3-5)

**Goal**: Align expansion with 4-component structure

1. **Update MovementResult type** ([lib/llm/types.ts:50-73](lib/llm/types.ts#L50-L73))

   ```typescript
   export interface MovementResult {
     npcs: Array<{
       name: string
       personality: string
       stats: Record<string, unknown>
       role: string
     }>
     enemies: Array<{
       name: string
       quantity: number
       stats: Record<string, unknown>
       tactics: string
     }>
     descriptions: string[] // Array of descriptive text
     narration: string | null // Optional read-aloud text
     gmNotes?: string // Keep for backward compatibility
   }
   ```

2. **Update OpenAI prompts** to generate 4-component structure

3. **Update expansion Server Action** to save new structure

4. **Update UI** to display 4 components separately

### Phase 3: Implement Focus Mode Features (Days 6-8)

**Goal**: Complete Focus Mode UX

1. **Add regenerateMovement Server Action**
   - Respect scaffold regeneration limit (10)
   - Increment `scaffold_regenerations_used`

2. **Add regenerateComponent Server Action**
   - For individual NPCs, enemies, etc.
   - Respect expansion regeneration limit (20)
   - Increment `expansion_regenerations_used`

3. **Add lock/unlock to Movement type**

   ```typescript
   export interface Movement {
     // ... existing fields
     locked: boolean
   }
   ```

4. **Implement lock/unlock Server Actions**

5. **Update UI**
   - Show remaining regenerations
   - Regenerate buttons (disabled when limit reached)
   - Lock/unlock toggles

### Phase 4: Guest System MVP (Days 9-10)

**Goal**: Align guest UX with MVP spec

1. **Create sample adventure**
   - Generate high-quality example
   - Store as static Markdown file

2. **Add sample download endpoint**
   - `/api/sample-adventure` route

3. **Update homepage for guests**
   - Gray out most features
   - Highlight "Buy Credits" and "Download Sample"
   - Remove "Try as Guest" button

4. **Stripe → Account Creation flow**
   - After successful payment, require account creation
   - Auto-apply purchased credits to new account

### Phase 5: Polish & Testing (Days 11-12)

**Goal**: Ensure quality and test coverage

1. **Write integration tests**
   - Regeneration limit enforcement
   - 4-component expansion structure
   - Guest restrictions

2. **Update database migration** for `user_profiles.credits DEFAULT 0`

3. **Manual QA** of complete user flows

---

## 10. Testing Checklist

### Critical Path Tests (Must Pass Before Deploy)

- [ ] **Credit consumption**: 1 credit at generation, 0 for regenerations
- [ ] **Regeneration limits**: Enforced at 10 (scaffold) and 20 (expansion)
- [ ] **Guest restrictions**: Cannot generate without credits
- [ ] **Expansion structure**: Returns 4 components (NPCs, Enemies, Descriptions, Narration)
- [ ] **RLS policies**: All data queries filtered by user_id

### Integration Tests Needed

```typescript
// tests/integration/credit-system.test.ts
describe('Credit System', () => {
  it('consumes 1 credit at adventure generation', async () => { ... })
  it('does not consume credits for regenerations', async () => { ... })
  it('enforces 10 regeneration limit at scaffold stage', async () => { ... })
  it('enforces 20 regeneration limit at expansion stage', async () => { ... })
  it('tracks regenerations per adventure independently', async () => { ... })
})

// tests/integration/expansion.test.ts
describe('Movement Expansion', () => {
  it('returns 4-component structure', async () => { ... })
  it('generates NPCs array with correct fields', async () => { ... })
  it('generates Enemies array with correct fields', async () => { ... })
  it('generates Descriptions array', async () => { ... })
  it('generates optional Narration string', async () => { ... })
})

// tests/integration/guest-system.test.ts
describe('Guest System (MVP)', () => {
  it('prevents guests from generating adventures', async () => { ... })
  it('allows sample adventure download without auth', async () => { ... })
  it('requires account creation after Stripe purchase', async () => { ... })
})
```

---

## 11. Breaking Changes

### Database Migrations Required

1. **Add regeneration tracking**:

   ```sql
   ALTER TABLE adventures ADD COLUMN scaffold_regenerations_used INT DEFAULT 0;
   ALTER TABLE adventures ADD COLUMN expansion_regenerations_used INT DEFAULT 0;
   ```

2. **Fix user_profiles default**:

   ```sql
   ALTER TABLE user_profiles ALTER COLUMN credits SET DEFAULT 0;
   ```

3. **Update Movement structure** (if stored as JSONB):
   - Add `locked: boolean` field
   - Migration to add `locked: false` to existing movements

### API Breaking Changes

1. **MovementResult type change**:
   - Old: `{ content: string, mechanics?: {...}, gmNotes?: string }`
   - New: `{ npcs: [...], enemies: [...], descriptions: [...], narration: string | null }`
   - **Impact**: Any frontend code reading `movement.content` will break
   - **Migration**: Map old structure to new, populate empty arrays if needed

2. **Guest generation removal**:
   - `generateAdventure()` will reject unauthenticated requests
   - **Impact**: "Try as Guest" flows will break
   - **Migration**: Remove guest flows from UI

---

## 12. Open Questions

### For Product Owner

1. **Existing guest adventures**: What to do with adventures already generated by guests?
   - Delete them?
   - Grandfather them in?
   - Convert to demo/sample content?

2. **Existing user credits**: Users created with `credits DEFAULT 1` have 1 free credit. Should we:
   - Revoke it (set to 0)?
   - Let them keep it?
   - Only apply to new users?

3. **Refinement vs. Regeneration**: Current system has "refineMovementContent" (applies user instruction). Should this:
   - Count toward regeneration limit?
   - Be unlimited?
   - Be a separate feature?

4. **Sample adventure**: Should it be:
   - A real generated adventure?
   - Hand-crafted showcase?
   - Multiple samples for different frames?

### For Engineering

1. **Backward compatibility**: Do we need to support old `MovementResult` structure?
   - If yes, need migration script to transform existing adventures
   - If no, can accept breaking change for early users

2. **Regeneration counting**: Should we count:
   - Only successful LLM calls?
   - Failed attempts too?
   - Preview/test runs during development?

3. **Component-level regeneration**: If user regenerates 1 NPC out of 3, does that:
   - Count as 1 regeneration?
   - Regenerate all NPCs in that movement?
   - Only regenerate the selected NPC?

---

## 13. Documentation Updates Required

After implementation, update:

1. **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)**: Confirm all sections match implementation
2. **[architecture/TESTING_STRATEGY.md](./architecture/TESTING_STRATEGY.md)**: Add regeneration limit tests
3. **[ops/SECRETS_SETUP.md](./ops/SECRETS_SETUP.md)**: Any new env vars
4. **README.md**: Update feature list if needed

---

## 14. Success Criteria

### Phase 1 Complete When:

- [ ] No free guest adventures possible
- [ ] Expansions/refinements don't consume credits
- [ ] Regeneration limits enforced (10 scaffold, 20 expansion)
- [ ] Integration tests pass for credit system

### Phase 2 Complete When:

- [ ] Expansion returns 4-component structure
- [ ] NPCs, Enemies, Descriptions, Narration all populated
- [ ] UI displays components separately
- [ ] Integration tests pass for expansion structure

### Phase 3 Complete When:

- [ ] Regenerate button works at scaffold stage
- [ ] Component-level regeneration works at expansion stage
- [ ] Lock/unlock toggles work
- [ ] Remaining regenerations displayed to user

### Phase 4 Complete When:

- [ ] Sample adventure downloads for guests
- [ ] Landing page features grayed out for guests
- [ ] Stripe → Account creation flow works
- [ ] No "Try as Guest" button on homepage

### MVP Complete When:

- [ ] All phases complete
- [ ] 90% test coverage maintained
- [ ] CI/CD passes
- [ ] Manual QA checklist complete

---

**Version**: 1.0
**Last Updated**: 2025-10-24
**Next Review**: After Phase 1 implementation
**Author**: Claude Code
