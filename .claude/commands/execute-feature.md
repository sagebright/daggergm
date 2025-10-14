# Execute FEATURE Implementation

**Purpose**: Execute FEATURE documentation for DaggerGM with TDD approach, phase awareness, and comprehensive validation between phases.

## FEATURE Target: $ARGUMENTS

---

## 🚀 **IMMEDIATE ACTIONS**

### Pre-Flight Checks

```bash
# 1. Docker Health (MANDATORY)
docker-compose ps

# 2. Git Status
git status
git branch --show-current

# 3. Recent Commits Check
git log --oneline -5

# 4. Test Coverage Check
npm run test:coverage

# 5. Current Branch Verification
git branch --show-current
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
# 3. Run tests to confirm failures
npm test -- --watch

# 4. Check coverage baseline
npm run test:coverage
```

### Validation

```
□ Tests fail as expected
□ Tests cover all requirements
□ Coverage report generated
□ Ready for implementation
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
□ All tests pass (GREEN)
□ Coverage maintained at 99%
□ Linting clean
□ Types valid
□ No console errors
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

# 6. Verify in Docker
docker-compose exec app npm test
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
# MANDATORY Quality Checks
npm run lint:fix
npm run typecheck
npm test
npm run test:coverage

# Docker verification
docker-compose exec app npm test
docker-compose exec app npm run build
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
# If migration fails
docker-compose exec backend npm run migrate:rollback
# Fix issue, then reapply
```

### Test Failures

```bash
# Isolate failing test
docker-compose exec [service] npm run test -- [specific-test]
# Check test environment
docker-compose exec [service] npm run test:debug
```

### Container Issues

```bash
# Restart specific service
docker-compose restart [service]
# Full reset
docker-compose down && docker-compose up -d
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
4. Check Docker resource limits
```

---

## 🎯 **FINAL CHECKLIST**

Before marking phase complete:

```
□ All code written and tested
□ Docker CI/CD verification passed
□ TodoWrite updated
□ git status clean (or intentionally dirty)
□ Ready for next phase or deployment
```

---

**REMEMBER**:

- TDD ALWAYS: Tests first, then implementation
- Maintain 99% coverage at all times
- Run tests after EVERY change
- Update TodoWrite continuously
- Follow CLAUDE.md patterns exactly

**Version**: 2025-09-12 | **Optimized for**: DaggerGM TDD development with 99% coverage requirement
