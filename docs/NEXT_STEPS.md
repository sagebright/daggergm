# DaggerGM - Next Steps

**Date**: 2025-10-28
**Status**: Post-Guest-Removal Roadmap
**Reference**: [IMPLEMENTATION_GAP_ANALYSIS.md](./IMPLEMENTATION_GAP_ANALYSIS.md) v1.1

---

## 🎯 Executive Summary

Following the successful completion of regeneration limits and expansion UX improvements, the system now has a **complete business model implementation**. All critical gaps have been addressed.

### Current State

- ✅ **Authentication**: Required for all adventure generation
- ✅ **Phase 2 Features**: Guest removal & six-component expansion complete
- ✅ **Credit Model**: Fixed - expansions/refinements are FREE with regeneration limits
- ✅ **Regeneration Limits**: Tracking implemented (10 scaffold, 20 expansion per adventure)
- ✅ **Expansion UX**: Visual budget display and confirmation dialogs complete

---

## ✅ Priority 1: Fix Credit Consumption Model (COMPLETED)

### Status: COMPLETED ✅

**Completed**: 2025-10-28 (Commit e9dee50)

The credit consumption model has been fixed. The system now correctly:

- **1 credit** = 1 adventure generation (initial scaffold)
- **Expansions/Refinements** = FREE with regeneration limits (10 scaffold, 20 expansion)

All implementation tasks completed with 100% test coverage.

### Implementation Summary

All tasks completed:

- ✅ **Task 1.1**: Database migration added (`scaffold_regenerations_used`, `expansion_regenerations_used`)
- ✅ **Task 1.2**: Credit consumption removed from expansions/refinements
- ✅ **Task 1.3**: Regeneration limit logic implemented with atomic increments
- ✅ **Task 1.4**: Comprehensive integration tests added (100% coverage)
- ✅ **Task 1.5**: RegenerationBudget component displays usage in Focus Mode

**Reference**: See archived FEATURE documents in `docs/FEATURES/archive/`

---

## ✅ Priority 2: Improve Expansion UX (COMPLETED)

### Status: COMPLETED ✅

**Completed**: 2025-10-28 (PR #69)

All expansion UX improvements implemented:

- ✅ **Task 2.1**: RegenerationBudget component shows visual progress bars and remaining counts
- ✅ **Task 2.2**: RegenerationConfirmDialog shows confirmation before regeneration
- ✅ **Task 2.3**: Integrated into Focus Mode UI with localStorage persistence
- ✅ **100% test coverage**: 11 new unit tests, all passing

**Features**:

- Visual budget display with color-coded warnings (green/amber/red)
- Confirmation dialogs with "Don't ask again" checkbox
- Keyboard navigation support (Escape to cancel)
- Low regeneration warnings (≤2 remaining)

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

## ✅ Priority 4: Daggerheart Content Seeding (COMPLETED)

### Status: COMPLETED ✅

**Completed**: 2025-10-27 (PR #67, commits 412a823, a72d94f, c64bf60)

All phases complete:

- ✅ **Phase 1**: Weapons/Classes/Armor parsers (~241 entries)
- ✅ **Phase 2**: Abilities/Items/Consumables parsers (~315 entries)
- ✅ **Phase 3**: All remaining content parsers (~215 entries)
- ✅ **Phase 4**: Embeddings generation (~771 entries)
- ✅ **Vector search**: Integration tests with 71.98% coverage

**Total**: ~771 Daggerheart SRD entries seeded with embeddings

**Scripts Available**:

- `npm run seed:daggerheart` - Seed all content
- `npm run embeddings:generate` - Generate vector embeddings
- `npm run seed:full` - Full pipeline (seed + embeddings + types)

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

### ✅ Week 1: Critical Business Model Fixes (COMPLETED)

1. ✅ **Day 1-2**: Fix credit consumption model (Task 1.1-1.5) - 6-7 hours
2. ✅ **Day 3**: Improve expansion UX (Task 2.1-2.2) - 2.5 hours
3. ✅ **Day 4-5**: Testing, QA, deployment

### Week 2: UI/UX Polish (CURRENT FOCUS)

1. **Day 1-2**: Daggerheart theme implementation - 3-4 hours
2. **Day 3**: Dark mode implementation - 2-3 hours
3. **Day 4-5**: Testing, refinement, documentation

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

**Recommended**: Begin implementing Priority 3 (UI/UX Polish)

```bash
# Option A: Daggerheart Theme
git checkout -b feature/daggerheart-theme
# Implement: docs/FEATURES/FEATURE_daggerheart_theme.md

# Option B: Dark Mode
git checkout -b feature/dark-mode
# Implement: docs/FEATURES/FEATURE_dark_mode.md

# Option C: Content Seeding Phase 2
git checkout -b feature/content-phase2
# Implement: docs/FEATURES/FEATURE_daggerheart_content_phase2.md
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
