# FIXES Documentation

This directory contains detailed specifications for fixes and features that can be executed in separate sessions using the `/execute-fixes` slash command (when available) or manually implemented.

## Available Fixes

### FIX-001: E2E Test for Authentication Flow

**Status:** PENDING
**Priority:** CRITICAL
**Estimated Time:** 30 minutes

Adds end-to-end test for the complete authentication journey (signup → login → redirect to dashboard). Would have caught the middleware session check bug that caused redirect loops.

**User Flow Tested:**

- User signs up with email/password
- User logs in
- User is redirected to dashboard (not back to login)
- Dashboard content is visible

**Why Critical:** Authentication is the foundation - if it's broken, nothing else works.

---

### FIX-002: Refactor Adventure Creation UI to Single-Screen Form

**Status:** PENDING
**Priority:** HIGH
**Estimated Time:** 90 minutes

Refactors the multi-step wizard for adventure creation into a single-screen form with dropdowns. Adds missing inputs (party size, party tier, number of scenes).

**Changes:**

- Replace multi-step wizard with single-screen form
- Add "Primary Motif" dropdown (5 options)
- Add "Party Size" dropdown (1-5+)
- Add "Party Tier" dropdown (Tier 1-4 with level ranges)
- Add "Number of Scenes" dropdown (3, 4, 5)

**Why High Priority:** Current multi-step UI creates friction and is missing required inputs for proper adventure generation.

---

### FIX-003: E2E Test for Create Adventure Flow

**Status:** PENDING
**Priority:** CRITICAL
**Estimated Time:** 60 minutes
**Depends On:** FIX-002

Adds end-to-end test for the complete adventure creation flow. Would have caught the missing `consume_credit` database function bug.

**User Flow Tested:**

- User navigates from dashboard to /adventures/new
- User fills out adventure creation form
- User submits form
- Credit is consumed (consume_credit function called)
- User is redirected to adventure detail page
- Credit balance is updated

**Why Critical:** Adventure generation is the core feature - if credits aren't consumed or generation fails, the entire product is broken.

---

## How to Use

### Option 1: Execute Fixes Command (Future)

```bash
# In a new Claude Code session:
/execute-fixes FIX_001_e2e_auth_flow
```

### Option 2: Manual Implementation

1. Read the FIXES doc thoroughly
2. Follow the "Technical Implementation" section
3. Complete all items in "Acceptance Criteria"
4. Test manually using "Testing Checklist"
5. Run tests in CI/CD
6. Complete all items in "Definition of Done"

---

## Dependencies Between Fixes

```
FIX-001 (Auth E2E Test)
  ↓ (provides login helper function)
FIX-003 (Adventure E2E Test)

FIX-002 (Refactor UI)
  ↓ (UI must exist before testing it)
FIX-003 (Adventure E2E Test)
```

**Recommended Order:**

1. FIX-001 (Independent, quick win)
2. FIX-002 (UI refactor needed for FIX-003)
3. FIX-003 (Depends on FIX-002 completion)

---

## Success Metrics

After implementing all fixes:

### Test Coverage:

- ✅ E2E coverage for authentication flow
- ✅ E2E coverage for adventure creation flow
- ✅ Critical user paths covered by tests

### User Experience:

- ✅ Single-screen adventure creation form (less friction)
- ✅ All required inputs visible (motif, party size, tier, scenes)
- ✅ Confidence that core flows won't break without test failures

### Development Velocity:

- ✅ Catch bugs before production deployment
- ✅ Faster debugging with E2E test failure screenshots
- ✅ Confidence to refactor code knowing tests will catch regressions

---

## Questions to Consider Before Starting

### For FIX-001 (Auth E2E Test):

- Do we have Supabase email confirmation disabled for test environment?
- Should test users be auto-created or pre-seeded?
- How do we clean up test users after tests run?

### For FIX-002 (UI Refactor):

- Should we keep "Adventure Length" as a field or always use "oneshot"?
- Do we need tooltips explaining tier levels?
- Should form state be saved to localStorage?

### For FIX-003 (Adventure E2E Test):

- How do we mock LLM responses (MSW? Custom middleware)?
- Should we test with real Supabase or mock database calls?
- How do we ensure test users have credits before running tests?

---

## Version History

- **2025-10-29**: Initial creation
  - Added FIX-001 (Auth E2E Test)
  - Added FIX-002 (UI Refactor)
  - Added FIX-003 (Adventure E2E Test)

---

## Contributing

When adding new FIXES:

1. Use the naming convention: `FIX_XXX_short_description.md`
2. Include all required sections:
   - Problem Statement
   - User Flow to Test/Implement
   - Acceptance Criteria
   - Technical Implementation
   - Dependencies
   - Testing Checklist
   - Definition of Done
3. Update this README with the new fix
4. Link dependencies between fixes if applicable

---

## Contact

For questions about these fixes, refer to:

- `CLAUDE.md` - Project development guidelines
- `documentation/TESTING_STRATEGY.md` - Testing philosophy
- `documentation/ARCHITECTURE.md` - System architecture
