# DaggerGM - Next Steps

**Date**: 2025-11-07
**Status**: Post-Reorganization Roadmap
**Reference**: Documentation reorganized - see [archive/2025-11-07/](archive/2025-11-07/)

---

## 🎯 Executive Summary

DaggerGM is in active development with a complete business model implementation. The guest system has been removed, regeneration limits are in place, and the core adventure generation workflow is functional.

### Current State

- ✅ **Authentication**: Required for all adventure generation
- ✅ **Credit Model**: 1 credit = 1 adventure, expansions/refinements FREE with limits
- ✅ **Regeneration Limits**: 10 scaffold, 20 expansion per adventure
- ✅ **Daggerheart Theme**: Implemented with 100% test coverage
- ✅ **Password Authentication**: Server Actions implementation complete
- ✅ **Per-Scene Confirmation**: Implemented (see recent commits)
- ⏳ **Test Coverage**: 69.74% (need 70%+ for CI/CD)

---

## 🚀 Immediate Priorities

### P1: Fix Test Coverage (BLOCKING CI/CD)

**Status:** Ready to Execute
**Time:** 2-3 hours
**Doc:** [FIXES/FIX_boost_test_coverage_to_70_percent.md](FIXES/FIX_boost_test_coverage_to_70_percent.md)

Current test coverage is 69.74%, blocking CI/CD pipeline. Add comprehensive LLM error handling tests to boost coverage and protect revenue-generating AI features.

**Why Critical:**

- CI/CD pipeline failing on coverage check
- Cannot merge feature branches
- LLM is most business-critical component

**Implementation:**

- Add OpenAI API error scenarios (rate limits, timeouts, network failures)
- Add response validation error handling (malformed JSON, Zod failures)
- Add retry logic validation (exponential backoff, max retries)
- Add cache failure fallback scenarios

---

### P2: Refactor Adventure Creation UI

**Status:** Pending
**Time:** 90 minutes
**Doc:** [FIXES/FIX_002_refactor_adventure_creation_ui.md](FIXES/FIX_002_refactor_adventure_creation_ui.md)

Refactor multi-step wizard to single-screen form with all inputs visible. Reduces friction and improves UX.

**Changes:**

- Replace multi-step wizard with single-screen form
- Add dropdowns: Primary Motif, Party Size, Party Tier, Number of Scenes
- Improve form validation and error handling
- Better mobile responsiveness

---

## 🎨 UI/UX Polish (P3)

### P3.1: Dark Mode

**Status:** Not Started
**Time:** 2-3 hours
**Doc:** [FEATURES/FEATURE_dark_mode.md](FEATURES/FEATURE_dark_mode.md)

Implement dark mode toggle with next-themes integration.

**Requirements:**

- Toggle between light and dark themes
- Persist user preference (localStorage)
- System preference detection
- No flash of unstyled content (FOUC)
- WCAG AA compliance in both themes

---

## 📊 Technical Debt & Optimization

### Known Issues

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for full list.

**Active Issue:** Supabase JS Client Fetch Failures in Node.js Scripts

- Scripts using @supabase/supabase-js fail with "TypeError: fetch failed"
- Affects seeders and embeddings generation
- Workaround: Use Supabase MCP tools or integration tests
- Priority: Medium (can be addressed post-MVP)

### Database State

- ✅ 618/760 content entries seeded (81%)
- ❌ 0/129 adversaries (fetch error)
- ❌ 0/618 embeddings generated (fetch error)

---

## 🔍 Exploration Tasks

Based on the recent codebase, here are potential areas to investigate:

1. **Dashboard Page Unit Tests**
   - File opened: `__tests__/unit/app/dashboard/page.test.tsx`
   - Check if tests are complete and passing
   - Verify coverage for dashboard functionality

2. **Adventure Detail Page**
   - Check implementation status of per-scene confirmation
   - Verify expansion confirmation dialog integration
   - Test coverage for Focus Mode interactions

3. **Credit System**
   - Verify credit consumption is properly tested
   - Check RLS policies for credit-related tables
   - Ensure no edge cases in credit allocation

4. **Deployment Status**
   - Check if latest changes are deployed to production
   - Verify environment variables are set correctly
   - Review recent deployment logs for errors

---

## 📅 Recommended Implementation Order

### Week 1: Critical Blockers (CURRENT FOCUS)

1. **Day 1-2**: Fix test coverage to 70%+ (FIX-boost)
2. **Day 3-4**: Refactor adventure creation UI (FIX-002)
3. **Day 5**: Testing, QA, deployment

### Week 2: UI/UX Polish

1. **Day 1-2**: Dark mode implementation
2. **Day 3-4**: Polish and refinement
3. **Day 5**: Documentation updates

### Week 3: Technical Debt

1. Investigate Node.js fetch failures
2. Seed remaining content (adversaries)
3. Generate embeddings (Phase 4 enhancement)

---

## 🎯 Success Metrics

### Business Model Health

- ✅ 1 credit consumed per adventure generation
- ✅ 0 credits consumed for expansions/refinements
- ✅ Regeneration limits enforced (10 scaffold, 20 expansion)
- ✅ No infinite free content generation

### User Experience

- ✅ Per-scene confirmation workflow implemented
- ✅ Visual regeneration budget display
- ⏳ Single-screen adventure creation form
- ⏳ Dark mode support

### Technical Quality

- ⏳ 70%+ test coverage (currently 69.74%)
- ✅ 0 TypeScript/linting errors
- ✅ Production build succeeds
- ⏳ CI/CD pipeline green (blocked by coverage)

---

## 🚦 Quick Start Commands

### Fix Test Coverage (P1)

```bash
git checkout -b fix/boost-test-coverage
npm run test:watch -- __tests__/unit/lib/llm
# Add LLM error handling tests
npm run test:coverage
# Verify coverage ≥ 70%
```

### Refactor Adventure UI (P2)

```bash
git checkout -b fix/refactor-adventure-creation-ui
# Follow FIX_002 document
npm run test:watch
npm run dev
# Manual testing
```

### Implement Dark Mode (P3)

```bash
git checkout -b feature/dark-mode
# Follow FEATURE_dark_mode document
npm install next-themes
npm run dev
```

---

## 📚 References

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System architecture & business model
- [FEATURES/README.md](./FEATURES/README.md) - Active feature tracking
- [FIXES/README.md](./FIXES/README.md) - Active fixes tracking
- [CLAUDE.md](../CLAUDE.md) - Development workflow guide

---

## 🔄 Recently Completed (Archived 2025-11-07)

- **Daggerheart Theme**: OKLCH color palette, 100% test coverage
- **Password Authentication**: Server Actions implementation
- **Per-Scene Confirmation**: Individual scene approval workflow
- **E2E Auth Flow Tests**: Complete authentication journey testing
- **E2E Adventure Creation Tests**: Complete adventure creation testing

---

**Created**: 2025-11-07
**Owner**: Development Team
**Next Review**: After P1 completion (test coverage fix)
