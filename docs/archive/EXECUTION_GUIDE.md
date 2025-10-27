# Execution Guide: Setting Up Skills & Commands

**Purpose**: Step-by-step guide for executing the skills and commands setup documents.

---

## 🎯 **QUICK START**

### Which Command Should I Use?

Both setup documents use `/execute-ops` because they are **operational tasks** (creating files, updating documentation, organizing infrastructure) rather than code implementation or testing.

```bash
# Execute Skills Setup
/execute-ops documentation/SETUP_skills.md

# Execute Commands Setup
/execute-ops documentation/SETUP_commands.md
```

---

## 📊 **COMMAND SELECTION MATRIX**

### When to Use Each Command:

| Task Type                   | Command                | Example                                     |
| --------------------------- | ---------------------- | ------------------------------------------- |
| **Implement new feature**   | `/execute-feature`     | Add Focus Mode editor                       |
| **Write integration tests** | `/test-integration`    | Test adventure creation                     |
| **Database operations**     | `/execute-db-ops`      | Enable RLS on adventures table              |
| **Refactor large file**     | `/execute-refactor`    | Split 500-line component                    |
| **Code review**             | `/execute-code-review` | Review PR #42                               |
| **Bug fixes**               | `/execute-fixes`       | Fix authentication bug                      |
| **Infrastructure/setup**    | `/execute-ops`         | Add skills, update commands, git operations |
| **One-time setup**          | `/setup-testing`       | Initialize test infrastructure              |

---

## 🚀 **EXECUTION ORDER (RECOMMENDED)**

### Phase 1: Skills Setup (PRIORITY)

**Why First**: Skills provide automated enforcement before writing new code.

```bash
# Execute skills setup
/execute-ops documentation/SETUP_skills.md
```

**Duration**: 2-3 hours

**Outcome**:

- ✅ 5 skills created in `.claude/skills/`
- ✅ Security auditing automated
- ✅ Code quality enforcement
- ✅ Testing patterns established
- ✅ Next.js patterns enforced
- ✅ LLM integration patterns defined

**Validation**:

```bash
# Check skills were created
ls -1 .claude/skills/*.md

# Should show:
# - tenant-security.md
# - code-quality.md
# - vitest-patterns.md
# - nextjs-server-actions.md
# - llm-integration.md
# - README.md

# Test security audit
./scripts/security-audit.sh

# Test file size validation
./scripts/validate-file-size.sh
```

---

### Phase 2: Commands Setup (ENHANCEMENT)

**Why Second**: Commands provide workflows for ongoing development.

```bash
# Execute commands setup
/execute-ops documentation/SETUP_commands.md
```

**Duration**: 1-2 hours

**Outcome**:

- ✅ 3 new commands added (db-ops, refactor, ops)
- ✅ 2 outdated commands archived
- ✅ Commands README created
- ✅ CLAUDE.md updated

**Validation**:

```bash
# Check commands were added
ls -1 .claude/commands/*.md

# Should include:
# - execute-db-ops.md (NEW)
# - execute-refactor.md (NEW)
# - execute-ops.md (NEW)
# - README.md (NEW)

# Check old commands archived
ls -1 .claude/commands/archive/*.md

# Should include:
# - execute-prp_daggergm.md
# - generate-prp_daggergm.md
```

---

## 📋 **DETAILED EXECUTION STEPS**

### Step 1: Pre-Flight Checks

```bash
# Verify git status
git status
# Should be clean or only documentation changes

# Verify on correct branch
git branch --show-current
# Recommended: main or dev

# Create feature branch (optional but recommended)
git checkout -b feature/skills-and-commands-setup
```

---

### Step 2: Execute Skills Setup

```bash
# Start execution
/execute-ops documentation/SETUP_skills.md

# Claude will:
# 1. Show pre-flight analysis
# 2. Wait for your approval at CHECKPOINT 0
# 3. Create .claude/skills/ directory
# 4. Create 5 skill files
# 5. Create validation scripts in scripts/
# 6. Update CLAUDE.md
# 7. Wait for your approval at final checkpoint

# After completion, verify:
ls -la .claude/skills/
./scripts/security-audit.sh
```

**Expected Output**:

```
✅ Phase 0 Complete - Ready to create skills
✋ CHECKPOINT 0: Waiting for approval

[After approval]

✅ Phase 1: tenant-security.md created
✅ Phase 2: code-quality.md created
✅ Phase 3: vitest-patterns.md created
✅ Phase 4: nextjs-server-actions.md created
✅ Phase 5: llm-integration.md created
✅ Phase 6: README.md created
✅ Phase 7: CLAUDE.md updated
✅ Phase 8: Validation scripts created

🎉 Skills setup complete!
```

---

### Step 3: Test Skills

```bash
# Run security audit (should pass on clean codebase)
./scripts/security-audit.sh

# Expected: ✅ SECURITY AUDIT PASSED

# Run file size validation
./scripts/validate-file-size.sh

# Expected: ✅ All files within size limits

# If violations found, that's good! Skills are working.
# Fix violations before proceeding.
```

---

### Step 4: Commit Skills

```bash
# Review changes
git status
git diff

# Commit skills setup
git add .claude/skills/
git add scripts/security-audit.sh scripts/validate-file-size.sh
git add CLAUDE.md
git commit -m "feat: Add Claude Code skills for security, quality, and testing

- Add tenant-security.md for user_id isolation auditing
- Add code-quality.md for 300-line limit enforcement
- Add vitest-patterns.md for 90% coverage patterns
- Add nextjs-server-actions.md for Server Actions patterns
- Add llm-integration.md for OpenAI integration patterns
- Add security-audit.sh and validate-file-size.sh scripts
- Update CLAUDE.md with skills reference

Skills provide automated enforcement of DaggerGM standards."
```

---

### Step 5: Execute Commands Setup

```bash
# Start execution
/execute-ops documentation/SETUP_commands.md

# Claude will:
# 1. Show pre-flight analysis
# 2. Wait for your approval at CHECKPOINT 0
# 3. Create 3 new command files
# 4. Archive 2 outdated commands
# 5. Create commands README
# 6. Update CLAUDE.md
# 7. Wait for your approval at final checkpoint

# After completion, verify:
ls -la .claude/commands/
ls -la .claude/commands/archive/
```

**Expected Output**:

```
✅ Phase 0 Complete - Ready to modify commands
✋ CHECKPOINT 0: Waiting for approval

[After approval]

✅ Phase 1: execute-db-ops.md added
✅ Phase 2: execute-refactor.md added
✅ Phase 3: execute-ops.md added
✅ Phase 4: Old commands archived
✅ Phase 5: README.md created
✅ Phase 6: CLAUDE.md updated

🎉 Commands setup complete!
```

---

### Step 6: Test Commands

```bash
# Verify commands are accessible
ls -1 .claude/commands/*.md

# Check README is clear
cat .claude/commands/README.md

# Verify CLAUDE.md references new commands
grep "execute-db-ops" CLAUDE.md
```

---

### Step 7: Commit Commands

```bash
# Review changes
git status
git diff

# Commit commands setup
git add .claude/commands/
git add CLAUDE.md
git commit -m "feat: Add database, refactoring, and operations commands

- Add execute-db-ops.md for Supabase operations (migrations, RLS)
- Add execute-refactor.md for 300-line file size enforcement
- Add execute-ops.md for general operations (git, config, dependencies)
- Archive outdated PRP workflow commands
- Add commands README for easy reference
- Update CLAUDE.md with new commands

Commands provide systematic workflows for development tasks."
```

---

### Step 8: Push and Verify

```bash
# Push to GitHub
git push origin feature/skills-and-commands-setup

# Monitor CI/CD
gh run watch

# Create PR when CI passes
gh pr create --title "Add Claude Code skills and commands infrastructure" \
             --body "Sets up automated enforcement (skills) and systematic workflows (commands) for DaggerGM development."

# Wait for CI to pass, then merge
```

---

## 🎯 **POST-SETUP ACTIONS**

### 1. Test Skills in Real Development

```bash
# Create intentional violation to test security audit
# Example: Add a Supabase query without user_id

# Run security audit
./scripts/security-audit.sh

# Should detect violation and fail
```

### 2. Create First Operation Document

```bash
# Example: Enable RLS on adventures table
# Create: documentation/DATABASE/RLS_adventures_table.md

# Execute with new command
/execute-db-ops documentation/DATABASE/RLS_adventures_table.md
```

### 3. Refactor First Large File (if any exist)

```bash
# Find files over 300 lines
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 300'

# If found, create refactor doc
# Create: documentation/REFACTOR/REFACTOR_[ComponentName].md

# Execute with new command
/execute-refactor documentation/REFACTOR/REFACTOR_[ComponentName].md
```

### 4. Update CI/CD

```bash
# Add security audit to GitHub Actions
# Edit: .github/workflows/ci.yml

# Add step before tests:
- name: Security Audit
  run: ./scripts/security-audit.sh

- name: File Size Validation
  run: ./scripts/validate-file-size.sh
```

---

## 🚨 **TROUBLESHOOTING**

### If `/execute-ops` Not Found

```bash
# Verify command file exists
ls -la .claude/commands/execute-ops.md

# If missing, you're executing BEFORE Phase 2
# Execute skills setup first, then add execute-ops.md manually
```

### If Skills Creation Fails

```bash
# Check directory permissions
ls -la .claude/

# Create directory manually if needed
mkdir -p .claude/skills

# Re-run setup
/execute-ops documentation/SETUP_skills.md
```

### If Security Audit Finds Violations

**This is expected!** Skills are working correctly.

```bash
# Review violations
./scripts/security-audit.sh

# Fix each violation:
# 1. Add user authentication to Server Actions
# 2. Add user_id filtering to database queries
# 3. Remove hardcoded user IDs

# Re-run audit until clean
./scripts/security-audit.sh
```

### If File Size Validation Fails

```bash
# Find large files
./scripts/validate-file-size.sh

# Create refactor document for each
# Use: /execute-refactor documentation/REFACTOR/[file].md
```

---

## 📊 **SUCCESS CHECKLIST**

After completing both setups:

### Skills Setup:

- [ ] `.claude/skills/` directory exists
- [ ] 5 skill files created (tenant-security, code-quality, vitest-patterns, nextjs-server-actions, llm-integration)
- [ ] Skills README created
- [ ] `scripts/security-audit.sh` executable
- [ ] `scripts/validate-file-size.sh` executable
- [ ] CLAUDE.md updated with skills reference
- [ ] Security audit passes (or violations documented)

### Commands Setup:

- [ ] `execute-db-ops.md` added
- [ ] `execute-refactor.md` added
- [ ] `execute-ops.md` added
- [ ] Outdated PRP commands archived
- [ ] Commands README created
- [ ] CLAUDE.md updated with commands reference

### Overall:

- [ ] Changes committed to git
- [ ] Changes pushed to GitHub
- [ ] CI/CD passes
- [ ] PR created and merged (if using feature branch)

---

## 🎓 **LEARNING OUTCOMES**

After completing this setup:

1. **Understanding Skills**:
   - How skills auto-activate on related code
   - How to run validation scripts manually
   - How to fix skill violations

2. **Understanding Commands**:
   - When to use each command
   - How to create operation/feature/refactor documents
   - How commands enforce systematic workflows

3. **DaggerGM Standards**:
   - User isolation security (user_id everywhere)
   - 300-line file limit
   - 90% test coverage (99% security-critical)
   - Server Actions patterns (no Express)
   - OpenAI integration patterns

---

## 📚 **QUICK REFERENCE**

### Execute Skills Setup

```bash
/execute-ops documentation/SETUP_skills.md
```

### Execute Commands Setup

```bash
/execute-ops documentation/SETUP_commands.md
```

### Test Security

```bash
./scripts/security-audit.sh
```

### Test File Sizes

```bash
./scripts/validate-file-size.sh
```

### Next Steps After Setup

```bash
# Create your first operation document
/execute-db-ops documentation/DATABASE/[operation].md

# Create your first refactor document
/execute-refactor documentation/REFACTOR/[file].md

# Implement your next feature
/execute-feature documentation/FEATURE_[name].md
```

---

**Version**: 1.0
**Created**: 2025-10-23
**Purpose**: Guide for executing SETUP_skills.md and SETUP_commands.md
**Recommended Order**: Skills first, then Commands
