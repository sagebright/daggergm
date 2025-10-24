# Execute FEATURE Implementation

**Purpose**: Execute FEATURE documentation for DaggerGM with TDD approach, phase awareness, and comprehensive validation between phases.

## FEATURE Target: $ARGUMENTS

---

## 🚀 **IMMEDIATE ACTIONS**

### Pre-Flight Checks

```bash
# 1. Git Status
git status
git branch --show-current

# 2. Create Feature Branch (REQUIRED)
# Extract feature name from FEATURE document filename
# Example: FEATURE_free_expansion_with_limits.md -> feature/free-expansion-with-limits
git checkout -b feature/[feature-name]

# 3. Recent Commits Check
git log --oneline -5

# 3. Test Coverage Check (Baseline)
npm run test:coverage

# 4. Database Connection Check
# We use remote Supabase (JMK project), not local Docker
if [ -f .env.test.local ]; then
  echo "✅ Found .env.test.local with remote Supabase credentials"
  grep "NEXT_PUBLIC_SUPABASE_URL" .env.test.local
else
  echo "⚠️  No .env.test.local found - integration tests may fail"
  echo "   Check .env.local for database URL"
fi
```

### Phase Detection & Planning

```
1. Read FEATURE document(s)
2. Detect if phase-specific (phase1, phase2, etc.) or overview
3. Use TodoWrite to create comprehensive task list
4. Identify prerequisites and dependencies
```

---

## 📋 **PHASE-AWARE EXECUTION**

### If Overview Document:

```
1. Read all related phase documents
2. Create complete TodoWrite task list for all phases
3. Execute Phase 1 only
4. Provide exact command for next phase
```

### If Phase-Specific Document:

```
1. Verify previous phases completed (if applicable)
2. Check specific prerequisites
3. Execute current phase
4. Run validation
5. Prepare handoff to next phase
```

---

## ⚙️ **PHASE 1: TESTS FIRST (TDD)** (ALWAYS)

### Pre-Execution Checklist

```
□ Feature requirements clear
□ Test file structure planned
□ Mock data prepared
□ Coverage baseline recorded
```

### Execution

```bash
# 1. Create test files FIRST
# 2. Write failing tests (RED)
# 3. Run tests to confirm failures (CRITICAL - DO NOT SKIP)
npm test -- [your-test-file]

# If tests fail due to credentials, verify .env.test.local exists:
cat .env.test.local | grep SUPABASE

# 4. Check coverage baseline
npm run test:coverage
```

### Validation

```
□ Tests fail as expected (RED phase confirmed)
□ Tests cover all requirements
□ Coverage report generated
□ Ready for implementation
□ ⚠️ NEVER skip running tests - even if you expect them to fail
```

---

## 🔧 **PHASE 2: IMPLEMENTATION (GREEN)**

### Pre-Execution Checklist

```
□ Tests written and failing
□ Implementation approach clear
□ Type definitions ready
□ CLAUDE.md patterns reviewed
```

### Execution Pattern

```bash
# 1. Implement minimal code to pass tests
# 2. Focus on making tests green
# 3. Don't over-engineer

# 4. Run tests continuously
npm test -- --watch

# 5. Check linting
npm run lint:fix

# 6. Check types
npm run typecheck
```

### Validation

```
□ All tests pass (GREEN) - MUST run locally before pushing
□ Coverage maintained at 90%+
□ Linting clean
□ Types valid
□ No console errors
□ ⚠️ If tests fail, DO NOT push to GitHub - fix locally first
```

---

## 🎨 **PHASE 3: REFACTOR & OPTIMIZE**

### Pre-Execution Checklist

```
□ All tests green
□ Code working but may be messy
□ Performance baseline measured
□ UI/UX patterns identified
```

### Execution Pattern

```bash
# 1. Refactor for clarity and performance
# 2. Extract reusable components/functions
# 3. Optimize bundle size

# 4. Ensure tests still pass
npm test

# 5. Check build size
npm run build

# 6. Run full test suite
npm run test:coverage
```

### Validation

```
□ Tests still pass
□ Code cleaner/more maintainable
□ Performance improved
□ Bundle size acceptable
□ Coverage still 99%
```

---

## ✅ **PHASE VALIDATION GATES**

### After EVERY Phase:

```bash
# MANDATORY Quality Checks (DO NOT SKIP)
npm run lint:fix
npm run typecheck
npm test                  # ⚠️ CRITICAL: Must pass locally before push
npm run test:coverage     # ⚠️ CRITICAL: Must be ≥90%
npm run build             # ⚠️ CRITICAL: Catches Next.js build issues

# If any of these fail, FIX LOCALLY before pushing to GitHub
# CI takes 5-10 minutes. Local tests take 30 seconds.
# Catching failures locally saves 10x time.
```

### Phase Handoff Template

```
✅ Phase [X] Complete!

Completed:
- [List what was done]

Verified:
- [List what was tested]

Next Phase Command:
/execute-feature FEATURE_[name]_phase[X+1]_[type]

Prerequisites for Next Phase:
- [List any manual steps needed]
```

---

## 🛠️ **COMMON PATTERNS**

### Migration Rollback

```bash
# If migration fails, use Supabase CLI
npx supabase migration repair --status reverted [migration-version]
# Fix issue, then reapply
npx supabase db push
```

### Test Failures

```bash
# Isolate failing test
npm run test -- [specific-test]
# Check test environment with verbose output
npm run test -- --verbose
```

### Supabase Issues

```bash
# Restart local Supabase
npx supabase stop
npx supabase start
# Check status
npx supabase status
```

---

## 📊 **PROGRESS TRACKING**

### TodoWrite Pattern

```
Phase 1: Write Tests (RED) ✓
├── Create test files ✓
├── Write failing tests ✓
└── Verify coverage baseline ✓

Phase 2: Implementation (GREEN) [IN PROGRESS]
├── Write minimal code ⟳
├── Make tests pass □
└── Maintain coverage □

Phase 3: Refactor (REFACTOR) □
├── Clean up code □
├── Optimize performance □
└── Extract reusables □
```

### Status Indicators

- ✓ Complete
- ⟳ In Progress
- □ Pending
- ✗ Failed (needs attention)

---

## 🚨 **ERROR RECOVERY**

### Database Issues

```
1. Check migration syntax
2. Verify tenant_id in all tables
3. Check foreign key constraints
4. Review rollback procedures
```

### Test Failures

```
1. Check recent changes: git diff
2. Verify mock data
3. Check for race conditions
4. Review test isolation
```

### Build Failures

```
1. Clear node_modules and reinstall
2. Check for version conflicts
3. Verify environment variables
4. Check Supabase local status
```

---

## 🎯 **FINAL CHECKLIST**

Before marking phase complete:

```
□ All code written and tested
□ All tests passing locally (MANDATORY - DO NOT SKIP)
□ Test coverage ≥90% verified
□ Production build succeeds (npm run build)
□ TodoWrite updated
□ git status clean (or intentionally dirty)
□ Ready for next phase or deployment
```

---

## 🚨 **BEFORE PUSHING TO GITHUB**

### MANDATORY: Run Full Test Suite Locally

```bash
# Run these commands BEFORE git push:
npm test                  # Must pass
npm run test:coverage     # Must be ≥90%
npm run build             # Must succeed

# If tests fail due to missing credentials:
# 1. Check .env.test.local has remote Supabase credentials
# 2. Test SQL directly with Supabase MCP tools
# 3. DO NOT PUSH until tests pass locally
```

**Why this matters:**

- CI takes 5-10 minutes to run
- Local tests take 30 seconds
- Catching failures locally saves 10x time
- Failed CI blocks the team and wastes GitHub Actions minutes

---

**REMEMBER**:

- TDD ALWAYS: Tests first, then implementation
- Maintain 90%+ coverage at all times
- Run tests LOCALLY after EVERY change
- Update TodoWrite continuously
- Follow CLAUDE.md patterns exactly
- NEVER skip local testing before push

**Version**: 2025-09-12 | **Optimized for**: DaggerGM TDD development with 99% coverage requirement
