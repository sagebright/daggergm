# Execute Operations

**Purpose**: Systematically execute operational and maintenance tasks including git operations, configuration changes, dependency updates, infrastructure changes, and documentation for DaggerGM.

## Operation: $ARGUMENTS

---

## 🎯 Command Scope

Use this command for:

- **Git Operations**: Branch management, repository cleanup, merge strategies
- **Dependency Updates**: npm package upgrades, library migrations
- **Configuration Changes**: Environment configs, build settings, tooling setup
- **Infrastructure Operations**: Vercel deployment configs, Supabase settings, CI/CD updates
- **Documentation Migrations**: Reorganization, format changes, mass updates
- **Tooling Changes**: ESLint, Prettier, TypeScript configs

---

## 🚨 Operational Safety Pattern

This command uses a **3-phase checkpoint system** for all operations:

```
PRE-FLIGHT → ✋ CHECKPOINT → EXECUTION → ✋ CHECKPOINT → VALIDATION
```

Each checkpoint requires explicit user approval to proceed.

---

## 📋 PHASE 0: Pre-Flight Checks (MANDATORY)

### Actions:

1. **Read the operation spec**: `$ARGUMENTS`
2. **Identify operation type**: Git / Config / Dependencies / Infrastructure / Docs
3. **Assess impact scope**:
   - What systems/files are affected?
   - Who needs to be notified?
   - What's the rollback complexity?
4. **Check current state**:
   - Verify starting conditions
   - Document baseline state
   - Identify blockers or dependencies
5. **Create backup/safety strategy**:
   - Git commits for code changes
   - Backups for config files
   - Documentation of current state

### Safety Checklist:

```bash
# For Git Operations:
git status                          # Check for uncommitted work
git log --oneline -5               # Review recent commits
git branch -a                       # Check branch structure
git remote -v                       # Verify remote configuration
gh repo view                        # Verify GitHub repo details

# For Configuration Changes:
ls -la .env* tsconfig.json next.config.js  # Verify files exist
git diff [config-files]            # Check for local changes
grep -r "old-value" .              # Find all references

# For Dependency Updates:
npm outdated                        # Check current versions
npm list [package]                  # Verify dependency tree
git diff package.json package-lock.json  # See pending changes

# For Supabase Operations:
# Check credentials configured
test -f .env.test.local && grep "NEXT_PUBLIC_SUPABASE_URL" .env.test.local || echo "⚠️  Missing .env.test.local"
# Use Supabase MCP tools: list_projects, get_project
```

### Impact Assessment:

```
✅ IMPACT ANALYSIS:
□ Scope clearly defined
□ Team members identified
□ Timing appropriate
□ Rollback plan simple
□ Dependencies identified
□ Documentation needs identified
□ Success criteria defined
```

### ✋ CHECKPOINT 0

**STOP HERE. Report to user:**

- **Operation type**: [Git / Config / Dependencies / Infrastructure / Docs]
- **Scope**: [What's changing - be specific]
- **Impact**: [Who/what is affected]
- **Risk level**: [Low / Medium / High]
- **Rollback complexity**: [Simple / Moderate / Complex]
- **Estimated duration**: [minutes/hours]

**Wait for explicit user approval before proceeding.**

---

## 📋 PHASE 1: Execution Planning & Setup

### Actions:

1. **Create detailed execution plan** using TodoWrite
2. **Break down into sequential steps**:
   - What's the order of operations?
   - Which steps are reversible?
   - Which steps require validation?
3. **Prepare rollback scripts/commands**:
   - Document how to reverse each change
   - Test rollback steps if possible
4. **Identify validation checks**:
   - How will we know it worked?
   - What tests need to run?
   - What manual checks are needed?

### Planning Checklist:

```
✅ EXECUTION PLAN:
□ TodoWrite plan created with all steps
□ Steps ordered correctly (dependencies respected)
□ Each step has validation criteria
□ Rollback commands prepared and documented
□ Verification tests identified
```

### ✋ CHECKPOINT 1

**STOP HERE. Report to user:**

- **Execution plan**: [TodoWrite summary]
- **Validation strategy**: [How we'll verify success]
- **Rollback plan**: [How to reverse if needed]
- **Estimated time**: [Realistic duration]

**Wait for user approval to proceed with execution.**

---

## 📋 PHASE 2: Execution & Validation

### Execution Strategy:

**For Git Operations:**

```bash
# TodoWrite checklist:
□ Verify starting state (git status, git branch)
□ Execute git commands (branch rename, cleanup, etc.)
□ Update GitHub settings (gh repo edit, gh api)
□ Update CI/CD workflow files (.github/workflows/)
□ Update documentation references
□ Verify remote state (git remote -v, gh repo view)
□ Test workflows trigger correctly (gh run watch)
```

**For Configuration Changes (Next.js/TypeScript):**

```bash
# TodoWrite checklist:
□ Backup current configurations
□ Apply new configurations:
  - tsconfig.json (TypeScript strict mode)
  - next.config.js (Next.js settings)
  - .env.local (environment variables)
  - vitest.config.ts (testing config)
□ Validate syntax: npx tsc --noEmit
□ Test application startup: npm run dev
□ Run smoke tests: npm run lint && npm test
□ Verify no breaking changes
□ Update related documentation
```

**For Dependency Updates (npm):**

```bash
# TodoWrite checklist:
□ Update package.json versions
□ Run: npm install
□ Check for breaking changes in changelogs
□ Run full test suite: npm test
□ Check for deprecation warnings: npm run dev
□ Update code for API changes
□ Test build process: npm run build
□ Update TypeScript types if needed: npm run db:types
```

**For Infrastructure/CI-CD (GitHub Actions, Vercel, Supabase):**

```bash
# TodoWrite checklist:
□ Update workflow files (.github/workflows/)
□ Update Vercel settings (vercel.json, if applicable)
□ Update Supabase config (supabase/config.toml)
□ Test on feature branch first
□ Monitor CI/CD execution: gh run watch
□ Verify all checks pass
□ Update deployment documentation
□ Notify team of changes
```

### DaggerGM-Specific Patterns:

```bash
# Update environment variables
# 1. Local (.env.local)
# 2. Vercel (if deployed)
vercel env add [VAR_NAME]

# Update Supabase settings
npx supabase link --project-ref [project-id]
npx supabase db push  # Apply migrations

# Update Next.js config
# Edit next.config.js
npm run build  # Test build
npm run dev    # Test dev server

# Update TypeScript config
# Edit tsconfig.json
npx tsc --noEmit  # Verify no errors
```

### Validation Requirements:

```
✅ VALIDATION CHECKPOINTS:
□ File changes applied correctly
□ Git state matches expected
□ CI/CD pipelines trigger and pass
□ Tests pass (npm test minimum)
□ No broken links or references
□ Documentation updated accurately
□ Next.js builds successfully
□ TypeScript compiles (strict mode)
```

### Continuous Monitoring:

```bash
# For CI/CD changes
gh run watch                        # Watch current workflow
gh run list --limit 5               # Check recent runs
gh run view [run-id]                # Inspect specific run

# For configuration changes
npm run lint                        # ESLint + TypeScript
npm test                            # Vitest test suite
npm run test:coverage               # Coverage check (≥90%)
npm run build                       # Verify build succeeds

# For Supabase changes
# Use Supabase MCP tools: list_migrations, list_tables
# Check credentials: test -f .env.test.local
```

### Rollback Triggers:

**Execute rollback if:**

- Git operations create inconsistent state
- CI/CD pipelines fail unexpectedly
- Tests fail that previously passed
- Application fails to start (npm run dev fails)
- Breaking changes discovered
- TypeScript compilation errors
- Next.js build fails

### ✋ CHECKPOINT 2

**STOP HERE. Report to user:**

- **Execution status**: ✅ Complete / ⚠️ Issues / ❌ Failed
- **TodoWrite completion**: [X/Y tasks completed]
- **Validation results**: [Summary of checks]
- **Issues encountered**: [List with resolutions]
- **Rollback needed**: Yes / No

**If successful, proceed to final validation.**
**If issues found, decide: fix forward or rollback?**

---

## 📋 PHASE 3: Final Validation & Documentation

### Comprehensive Validation:

```
✅ FINAL VALIDATION:
□ All operation objectives met
□ No breaking changes introduced
□ Tests passing (same or better than baseline)
□ CI/CD pipelines working correctly
□ Next.js dev server working (npm run dev)
□ Next.js production build working (npm run build)
□ TypeScript strict mode passing (npx tsc --noEmit)
□ Coverage maintained (≥90%)
□ Documentation complete and accurate
□ No loose ends or incomplete steps
```

### Documentation Updates:

```
DOCUMENTATION CHECKLIST:
□ Operation spec file completed
□ CLAUDE.md updated (if workflow changed)
□ Related documentation updated
□ README.md updated (if applicable)
□ Environment variable docs updated (.env.example)
□ Changelog updated
□ Lessons learned documented
```

### ✋ CHECKPOINT 3 (FINAL)

**STOP HERE. Report to user:**

**Operation Complete! Summary:**

- **Operation type**: [Git / Config / Dependencies / Infrastructure / Docs]
- **Scope**: [What changed - be specific]
- **Duration**: [Actual time taken]
- **Impact**:
  - Files modified: [count]
  - Tests status: [passing/total]
  - Coverage: [percentage]
- **Success criteria**: All met ✅
- **Documentation**: Updated ✅

**Post-Operation:**

- Continue monitoring for [duration, if applicable]
- Follow up with team
- Document any optimization opportunities

---

## 🚨 Emergency Rollback Procedures

### Git Operations Rollback:

```bash
# Reverse branch rename
git checkout [new-branch]
git branch -m [new-branch] [old-branch]
git push origin -u [old-branch]
gh repo edit --default-branch [old-branch]
git push origin --delete [new-branch]
```

### Configuration/File Changes Rollback:

```bash
# Git-based rollback
git log --oneline -10              # Find commit before changes
git revert [commit-hash]           # Revert specific commit
# OR
git reset --hard [commit-hash]     # Hard reset (if not pushed)

# Verify rollback
npm run lint
npm test
npm run build
```

### Dependency Updates Rollback:

```bash
# Restore package files
git checkout HEAD~1 -- package.json package-lock.json
npm ci                              # Clean install previous versions
npm test                            # Verify tests pass
npm run build                       # Verify build works
```

### Supabase Rollback:

```bash
# Rollback migrations
npx supabase migration new rollback_[operation]
# Edit rollback migration with reverse SQL
npx supabase db reset  # Apply rollback
npm test               # Verify application works
```

### Vercel Rollback:

```bash
# Rollback deployment (if deployed)
vercel rollback [deployment-url]
# OR revert git commit and redeploy
git revert [commit-hash]
git push origin main
```

---

## 🎯 DaggerGM-Specific Operations

### Common Operations:

**1. Update Environment Variables:**

```bash
# Local
cp .env.local .env.local.backup
# Edit .env.local
npm run dev  # Verify works

# Vercel (if deployed)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
```

**2. Update Supabase Connection:**

```bash
npx supabase link --project-ref [project-id]
npx supabase db pull  # Pull schema
npm run db:types      # Regenerate types
npm test              # Verify tests pass
```

**3. Update Next.js Configuration:**

```bash
# Edit next.config.js
npm run build         # Verify build
npm run dev           # Verify dev server
```

**4. Update GitHub Actions:**

```bash
# Edit .github/workflows/ci.yml
git add .github/workflows/
git commit -m "ci: update workflow"
git push origin feature/update-ci
gh run watch          # Monitor test run
```

**5. npm Package Updates:**

```bash
npm outdated                    # Check outdated packages
npm update [package]            # Update specific package
# OR
npm install [package]@latest   # Install latest version
npm test                        # Run tests
npm run build                   # Verify build
```

---

## 📚 Related Documentation

- **Architecture**: [documentation/ARCHITECTURE.md](../../documentation/ARCHITECTURE.md)
- **Testing Strategy**: [documentation/TESTING_STRATEGY.md](../../documentation/TESTING_STRATEGY.md)
- **CI/CD**: [.github/workflows/](../../.github/workflows/)
- **Environment Setup**: [.env.example](../../.env.example)

---

**Version**: 1.0 (DaggerGM)
**Adapted From**: template execute-ops.md
**Package Manager**: npm (not yarn)
**Platform**: GitHub + Vercel + Supabase
**Usage**: `/execute-ops documentation/OPS/[operation].md`
