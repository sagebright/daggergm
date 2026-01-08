# Archive: 2025-11-07 - Documentation Reorganization

This folder contains documentation that was completed or is no longer actively needed as of November 7, 2025.

## Purpose of This Archive

As part of the documentation reorganization (v4.0), completed features, fixes, and design documents were moved here to keep the main `docs/`, `docs/FEATURES/`, and `docs/FIXES/` folders focused on active work.

---

## 📦 Archived Documents

### Completed Features

- **FEATURE_daggerheart_theme.md**
  - Completed: 2025-10-28
  - Summary: OKLCH color palette implementation with 100% test coverage
  - Status: Theme is live in production

- **FEATURE_password_authentication.md**
  - Completed: 2025-10-29
  - Summary: Email/password auth via Server Actions, guest access removed
  - Status: Authentication system fully implemented

### Completed Fixes

- **FIX_001_e2e_auth_flow.md**
  - Completed: 2025-10-29
  - Summary: E2E tests for complete authentication journey
  - Status: Tests passing in CI/CD

- **FIX_003_e2e_create_adventure_flow.md**
  - Completed: 2025-10-29
  - Summary: E2E tests for adventure creation with credit consumption
  - Status: Tests passing in CI/CD

- **FIX_003_e2e_credit_setup_issue.md**
  - Completed: 2025-10-29
  - Summary: Fixed credit setup issues in E2E test environment
  - Status: Resolved

### Design Documents

- **DESIGN_per_scene_confirmation.md**
  - Status: Implemented (per recent commits)
  - Summary: Individual scene confirmation workflow
  - Related: PR #71, Issue #9

- **DESIGN_scaffold_quick_prompts.md**
  - Status: Implemented
  - Summary: Quick prompt generation for scaffold

- **DESIGN_scaffold_regeneration_category_fix.md**
  - Status: Implemented
  - Summary: Category-specific scaffold regeneration

### Historical Documentation

- **DOCUMENTATION_ORGANIZATION.md**
  - Date: 2025-10-24
  - Summary: Previous documentation organization audit (v2.0)
  - Superseded by: Current organization (v4.0, 2025-11-07)

---

## 🔍 Finding Information

### If you're looking for...

**Active features to implement:**
→ See [../FEATURES/README.md](../FEATURES/README.md)

**Active bugs/fixes to address:**
→ See [../FIXES/README.md](../FIXES/README.md)

**Current project status:**
→ See [../NEXT_STEPS.md](../NEXT_STEPS.md)

**System architecture:**
→ See [../SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

**Older completed work:**
→ See [../archive/README.md](../archive/README.md) for earlier archives

---

## 📚 Related Archives

- **[../archive/](../archive/)**: Contains older archives from earlier project phases
  - Setup phases (Phase 0, Phase 1, etc.)
  - Earlier feature completions
  - MCP setup documentation
  - DaggerGM rebuild planning

---

## 🔄 Archive Organization Principles

Documents are archived when:

1. **Features are complete** and merged to main
2. **Fixes are implemented** and tests are passing
3. **Design docs are implemented** and no longer guiding active work
4. **Historical docs are superseded** by newer organization

Documents remain active when:

1. **Features are in progress** or planned for near-term work
2. **Fixes are pending** implementation
3. **Design docs are guiding** active development
4. **Reference docs are frequently used** by developers

---

**Archive Date**: 2025-11-07
**Archived By**: Documentation Reorganization v4.0
**Documents Archived**: 9
**Reason**: Completed work cleanup to focus on active tasks
