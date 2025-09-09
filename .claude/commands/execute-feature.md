# Execute FEATURE Implementation

**Purpose**: Execute FEATURE documentation with phase awareness, Docker-first approach, and comprehensive validation between phases.

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

## ⚙️ **PHASE 1: DATABASE CHANGES** (if applicable)

### Pre-Execution Checklist

```
□ Verify on correct branch
□ Check for existing migrations
□ Backup current schema (if production)
```

### Execution

```bash
# 1. Create migration file(s)
# 2. Review SQL for tenant_id compliance
# 3. Apply migration
docker-compose exec backend npm run migrate

# 4. Verify migration
docker-compose exec backend npm run db:verify
```

### Validation

```
□ Tables created successfully
□ Indexes created
□ Constraints active
□ Test queries work
```

---

## 🔧 **PHASE 2: BACKEND SERVICES** (if applicable)

### Pre-Execution Checklist

```
□ Phase 1 migrations applied
□ Docker containers healthy
□ No failing tests
```

### Execution Pattern

```bash
# 1. Create service files
# 2. Update routes
# 3. Add middleware/validation

# 4. Run backend tests
docker-compose exec backend npm run test

# 5. Check linting
docker-compose exec backend npm run lint:fix

# 6. Verify CI
docker-compose exec backend npm run test:ci
```

### Validation

```
□ All tests pass (99% coverage)
□ Linting clean
□ API endpoints accessible
□ Tenant isolation verified
```

---

## 🎨 **PHASE 3: FRONTEND UPDATES** (if applicable)

### Pre-Execution Checklist

```
□ Backend API endpoints working
□ Component structure planned
□ Vibe/Tremor patterns identified
```

### Execution Pattern

```bash
# 1. Create components
# 2. Update data transformations
# 3. Integrate with container

# 4. Run frontend tests
docker-compose exec frontend npm run test

# 5. Check linting
docker-compose exec frontend npm run lint:fix

# 6. Build verification
docker-compose exec frontend npm run build
```

### Validation

```
□ Components render correctly
□ Data flows properly
□ Responsive on mobile
□ No console errors
□ Build succeeds
```

---

## ✅ **PHASE VALIDATION GATES**

### After EVERY Phase:

```bash
# MANDATORY Docker CI/CD Check
docker-compose exec frontend npm run lint:fix
docker-compose exec backend npm run lint:fix
docker-compose exec frontend npm run test:ci
docker-compose exec backend npm run test:ci
docker-compose exec frontend npm run build
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
Phase 1: Database Schema ✓
├── Create migration files ✓
├── Apply migrations ✓
└── Verify schema ✓

Phase 2: Backend Services [IN PROGRESS]
├── Create snapshot service ⟳
├── Update routes □
└── Add tests □

Phase 3: Frontend Updates □
Phase 4: Admin Features □
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

- Always use Docker commands (never local npm)
- Run CI/CD after EVERY change
- Update TodoWrite continuously
- Provide clear next steps

**Version**: 2025-09-07 | **Optimized for**: Multi-phase FEATURE execution with maximum validation
