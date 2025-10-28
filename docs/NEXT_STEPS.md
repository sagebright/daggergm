# DaggerGM - Next Steps

**Date**: 2025-10-28
**Status**: Post-Guest-Removal Roadmap
**Reference**: [IMPLEMENTATION_GAP_ANALYSIS.md](./IMPLEMENTATION_GAP_ANALYSIS.md) v1.1

---

## 🎯 Executive Summary

Following the successful removal of guest free adventures (PR #68), the next priority is fixing the credit consumption model and implementing regeneration limits. These are **critical business model features** that prevent infinite free content generation.

### Current State

- ✅ **Authentication**: Required for all adventure generation
- ✅ **Phase 2 Features**: Guest removal & six-component expansion complete
- 🔴 **Critical Gap**: Expansions/refinements still consume credits (should be free with limits)
- 🔴 **Critical Gap**: No regeneration limit tracking (users can regenerate infinitely)

---

## 🚨 Priority 1: Fix Credit Consumption Model (CRITICAL)

### Problem

The system currently consumes credits for expansions and refinements, which is incorrect. Per the business model:

- **1 credit** = 1 adventure generation (initial scaffold)
- **Expansions/Refinements** = FREE but LIMITED (10 scaffold regens, 20 expansion regens)

### Impact

- 🔴 **CRITICAL** - Users are charged for what should be free
- 🔴 **CRITICAL** - Business model broken (users can't afford refinements)
- 🔴 **BLOCKER** - Prevents natural UX flow (Focus Mode unusable due to cost)

### Implementation Tasks

#### Task 1.1: Add Regeneration Tracking to Database

**File**: `supabase/migrations/XXXXX_add_regeneration_tracking.sql`

```sql
-- Add regeneration tracking columns to adventures table
ALTER TABLE adventures
ADD COLUMN scaffold_regenerations_used INT DEFAULT 0 CHECK (scaffold_regenerations_used >= 0),
ADD COLUMN expansion_regenerations_used INT DEFAULT 0 CHECK (expansion_regenerations_used >= 0);

-- Add index for performance
CREATE INDEX idx_adventures_regenerations
ON adventures(scaffold_regenerations_used, expansion_regenerations_used);
```

**Time Estimate**: 30 minutes

#### Task 1.2: Remove Credit Consumption from Expansions

**Files**:

- `app/actions/movements.ts:75-86` (expandMovement)
- `app/actions/movements.ts:240-252` (refineMovement)

**Changes**:

1. Remove `creditManager.consumeCredit()` calls from expansion/refinement actions
2. Add regeneration limit checks instead
3. Increment regeneration counters

**Time Estimate**: 1 hour

#### Task 1.3: Implement Regeneration Limit Logic

**File**: `lib/regeneration/limit-checker.ts` (new)

```typescript
export class RegenerationLimitChecker {
  async checkScaffoldLimit(adventureId: string): Promise<boolean> {
    // Check if < 10 scaffold regenerations used
  }

  async checkExpansionLimit(adventureId: string): Promise<boolean> {
    // Check if < 20 expansion regenerations used
  }

  async incrementScaffoldCount(adventureId: string): Promise<void> {
    // Increment scaffold_regenerations_used
  }

  async incrementExpansionCount(adventureId: string): Promise<void> {
    // Increment expansion_regenerations_used
  }
}
```

**Time Estimate**: 2 hours

#### Task 1.4: Add Tests

**Files**:

- `__tests__/integration/regeneration-limits.test.ts`
- `__tests__/unit/lib/regeneration/limit-checker.test.ts`

**Coverage Target**: 100% (security-critical)

**Time Estimate**: 2 hours

#### Task 1.5: Update UI to Show Regeneration Counts

**Files**:

- `features/focus-mode/components/RegenerationCounter.tsx` (new)
- Update Focus Mode UI to display "X/10 scaffolds used" and "X/20 expansions used"

**Time Estimate**: 1 hour

### Total Time: ~6-7 hours

---

## 📋 Priority 2: Improve Expansion UX

### Problem

Current expansion implementation works but could be more user-friendly:

- No visual feedback for what's being expanded
- Component regeneration not clearly separated from scene regeneration
- No clear indication of remaining regeneration budget

### Implementation Tasks

#### Task 2.1: Add Visual Regeneration Budget Display

Show users: "10 scaffold regens remaining" or "15 expansion regens remaining"

**Time Estimate**: 1 hour

#### Task 2.2: Add Regeneration Confirmation Dialog

Before regenerating, show:

- What will be regenerated
- How many regenerations remain
- Option to cancel

**Time Estimate**: 1.5 hours

### Total Time: ~2.5 hours

---

## 🎨 Priority 3: UI/UX Polish (Phase 3)

### Phase 3.1: Daggerheart Theme

**Status**: Spec exists ([FEATURE_daggerheart_theme.md](./FEATURES/FEATURE_daggerheart_theme.md))

**Tasks**:

- Implement custom color palette (earthy tones)
- Add custom fonts (fantasy serif headers)
- Update shadcn/ui theme config

**Time Estimate**: 3-4 hours

### Phase 3.2: Dark Mode

**Status**: Spec exists ([FEATURE_dark_mode.md](./FEATURES/FEATURE_dark_mode.md))

**Tasks**:

- Implement theme toggle
- Add dark variants for all components
- Ensure proper contrast ratios (WCAG AA)

**Time Estimate**: 2-3 hours

---

## 📊 Priority 4: Daggerheart Content Seeding

### Status

**Current**: Phase 1 complete (weapons/classes/armor seeded)
**Reference**: Check `docs/archive/FEATURE_daggerheart_content_STATUS.md`

### Remaining Phases

- **Phase 2**: Abilities/Items/Consumables (~3-4h)
- **Phase 3**: Remaining content (~2-3h)
- **Phase 4**: Embeddings generation (~2-3h)

**Total Time**: ~7-10 hours

**Note**: This is lower priority than credit model fix but important for content quality.

---

## 🔧 Priority 5: Technical Debt

### 5.1: Fix Default Credits (Low Priority)

**Issue**: `user_profiles.credits` has `DEFAULT 1` but should be `DEFAULT 0`

**File**: `supabase/migrations/XXXXX_fix_default_credits.sql`

```sql
ALTER TABLE user_profiles
ALTER COLUMN credits SET DEFAULT 0;

-- Optional: Reset existing users to 0 (discuss with team first)
-- UPDATE user_profiles SET credits = 0 WHERE credits = 1;
```

**Time Estimate**: 15 minutes

### 5.2: Clean Up Guest Data

**Status**: Low priority (no harm in keeping historical data)

**Options**:

1. Keep guest adventures as historical data
2. Delete guest adventures after 30 days (add cron job)
3. Convert to sample/showcase adventures

**Time Estimate**: 1-2 hours (if implemented)

---

## 📅 Recommended Implementation Order

### Week 1: Critical Business Model Fixes

1. **Day 1-2**: Fix credit consumption model (Task 1.1-1.5) - 6-7 hours
2. **Day 3**: Improve expansion UX (Task 2.1-2.2) - 2.5 hours
3. **Day 4-5**: Testing, QA, deployment

### Week 2: Content & Polish

1. **Day 1-3**: Daggerheart content seeding (Phase 2-4) - 7-10 hours
2. **Day 4**: Daggerheart theme implementation - 3-4 hours
3. **Day 5**: Dark mode implementation - 2-3 hours

### Week 3: Technical Debt & Optimization

1. Fix default credits
2. Performance optimization
3. Analytics review
4. Production monitoring setup

---

## 🎯 Success Metrics

### Business Model Health

- ✅ 1 credit consumed per adventure generation
- ✅ 0 credits consumed for expansions/refinements
- ✅ Regeneration limits enforced (10 scaffold, 20 expansion)
- ✅ No infinite free content generation

### User Experience

- ✅ Clear regeneration budget display
- ✅ Smooth Focus Mode workflow
- ✅ Fast response times (<2s for expansions)
- ✅ Intuitive UI/UX

### Technical Quality

- ✅ 90%+ test coverage maintained
- ✅ 0 TypeScript/linting errors
- ✅ Production build succeeds
- ✅ CI/CD pipeline green

---

## 🚀 Quick Start (Next Session)

To begin implementing Priority 1:

```bash
# 1. Create feature branch
git checkout -b feature/fix-credit-consumption

# 2. Create migration file
npm run db:migration:create add_regeneration_tracking

# 3. Run tests in watch mode
npm run test:watch

# 4. Start implementing Task 1.1
# Edit: supabase/migrations/[timestamp]_add_regeneration_tracking.sql
```

---

## 📚 References

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System architecture & business model
- [IMPLEMENTATION_GAP_ANALYSIS.md](./IMPLEMENTATION_GAP_ANALYSIS.md) - Detailed gap analysis
- [FEATURES/README.md](./FEATURES/README.md) - Feature tracking
- [CLAUDE.md](../CLAUDE.md) - Development workflow guide

---

## ❓ Questions for Product Team

Before implementing Priority 1, confirm:

1. **Regeneration Limits**: Are 10 scaffold / 20 expansion the correct limits?
2. **Limit Scope**: Per adventure or per user lifetime?
3. **Limit Exceeded**: What should happen when user hits limit?
   - Block further regeneration?
   - Offer credit purchase to unlock more?
   - Show upgrade path?

4. **Guest Data**: Should we keep or delete historical guest adventures?

5. **Default Credits**: Should existing users with 1 credit be reset to 0?

---

**Created**: 2025-10-28
**Owner**: Development Team
**Next Review**: After Priority 1 completion
