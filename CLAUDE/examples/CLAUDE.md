# 🎯 CLAUDE.md - AI Development Guide Hub

## 🚨 CRITICAL - READ FIRST

### After ANY Code Changes (MANDATORY):

```bash
☐ Run Docker CI/CD verification (NEVER SKIP)
☐ Use TodoWrite for 3+ step tasks
☐ Check git status & current branch
☐ Review recent commits for conflicts
```

### Docker CI/CD Commands (MEMORIZE & EXECUTE IN ORDER):

```bash
# ⚠️ ALL IN DOCKER - NEVER SKIP THESE STEPS
docker-compose exec frontend npm run lint --fix
docker-compose exec backend npm run lint --fix
docker-compose exec frontend npm run test:ci
docker-compose exec backend npm run test:ci
docker-compose exec frontend npm run build
```

---

## 🔄 Project Context

**TCG Card Management System** for Pokémon card resellers

- **Stack**: Node.js/Express + React + Supabase
- **Domain**: Card intake, OCR identification, pricing, inventory, sales
- **UI**: Monday.com Vibe Design System (Tremor for Dashboards)
- **Architecture**: Multi-tenant with JWT auth
- **Status**: Production-ready with 99% test coverage standards

---

## 🚦 TASK ROUTING - Choose Your Path

### 🏗️ Development Workflows

- **Test-Driven Development (NEW FEATURES)** → `workflows/tdd_development.md`
- **Bug Investigation & Fixes** → `workflows/bug_fixing.md`
- **Database Schema Changes** → `workflows/database_changes.md`
- **Performance Optimization** → `workflows/performance_optimization.md`

### 📚 Technical Reference Guides

- **System Architecture & Patterns** → `CLAUDE/CLAUDE_architecture.md`
- **Code Standards & Organization** → `CLAUDE/CLAUDE_coding_standards.md`
- **Test-Driven Development** → `CLAUDE/CLAUDE_tdd.md`
- **Testing Strategy & Coverage** → `CLAUDE/CLAUDE_testing.md`
- **Security & Multi-tenancy** → `CLAUDE/CLAUDE_security.md`
- **UI Components & Design System** → `CLAUDE/CLAUDE_ui.md`
- **Business Domain & OCR Guidelines** → `CLAUDE/CLAUDE_business.md`
- **Deployment & CI/CD** → `CLAUDE/CLAUDE_deployment.md`
- **Code Review Framework** → `CLAUDE/CLAUDE_code_review.md`

---

## ⚡ QUICK PATTERNS

### 🔐 Security & Multi-tenancy (ALWAYS):

- **All queries**: Include `tenant_id` filtering
- **All routes**: Use existing auth middleware, never bypass
- **Default trade-in rates**: 75% cash, 90% store credit

### 🎨 UI Component Standards:

- **Most components**: Use Vibe Design System only
- **Dashboards EXCEPTION**: Use Tremor library as primary
- **No custom HTML**: Always use component libraries
- **Theme system**: Completely removed (don't reference)

### 📏 Code Quality (ENFORCE):

- **File size limit**: 500 lines max (refactor beyond this)
- **Test coverage**: 99% for all new code (Lines/Functions: 99%, Branches: 97%)
- **Check package.json**: Verify library availability before using
- **Mobile-first**: Optimized for card reseller workflows

### 🧪 TDD Checkpoint (BEFORE CODING):

When user says **"take a TDD approach"** or **"reference CLAUDE_tdd.md"**:

```bash
☐ Write failing test first
☐ Run test to see RED
☐ Implement minimal code for GREEN
☐ Refactor while keeping tests GREEN
☐ Repeat until feature complete
```

### 🧠 Development Approach:

- **Ask questions** if context is unclear - better to clarify than assume
- **Use existing patterns** - never reinvent auth, database access, or UI components
- **Follow TodoWrite patterns** - use for multi-step tasks and progress tracking
- **Respect business domain** - this is a card reselling business with specific TCG workflows

---

## 🔧 ESSENTIAL COMMANDS

### Environment Setup:

```bash
docker-compose up -d        # Start all services
docker-compose ps           # Verify services healthy
git status                  # Check working directory
git log --oneline -5        # Review recent commits
```

### Emergency Recovery:

```bash
git stash                   # Save current changes
git reset --hard HEAD~1     # Rollback last commit
git clean -fd               # Clean untracked files
```

---

## 📚 DETAILED REFERENCES

### For Complex Tasks:

- **OCR Service**: 2500+ lines, needs refactoring (see business guidelines)
- **Frontend Debugging**: Environment mismatches → Compare jest configs
- **Backend Patterns**: Service layer checklists → All queries need tenant_id
- **Performance Issues**: Database optimization → Single queries over multiple calls

### Critical Project Alerts:

- **OCR Service Complexity**: 2000+ line file with interdependent patterns
- **Enhanced partial search**: Single optimized OR query (performance fix)
- **Tenant isolation**: All operations must include tenant_id filtering
- **Component patterns**: Feature-based organization under components/[Feature]/

---

## 📋 Documentation Updates

When updating any CLAUDE/\*.md file:

1. Update version date at bottom
2. Create backup: `documentation/Claude Archive/CLAUDE_[domain]_[YYYY-MM-DD].md`
3. Update this hub if routing changes

---

**Version**: 2025-09-08 | **Previous**: 2025-09-04 | **Major Changes**: Added TDD checkpoint and explicit triggers, created TDD development workflow
