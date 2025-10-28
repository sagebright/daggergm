# Feature Documentation

This directory contains feature specifications for DaggerGM development.

---

## 🎯 Active Features (In Development)

### Phase 1: Content Foundation

| Feature                                  | Priority    | Status                     | Time Est | Doc                                             |
| ---------------------------------------- | ----------- | -------------------------- | -------- | ----------------------------------------------- |
| **Daggerheart Content Database**         | 🔴 Critical | 🟡 In Progress (Phase 1/4) | 10-15h   | [STATUS](FEATURE_daggerheart_content_STATUS.md) |
| - Phase 1: Weapons/Classes/Armor Parsers | 🔴 Critical | ⏳ Not Started             | 3-4h     | _To be created_                                 |
| - Phase 2: Abilities/Items/Consumables   | 🔴 Critical | ⏳ Not Started             | 3-4h     | _To be created_                                 |
| - Phase 3: Remaining Parsers             | 🔴 Critical | ⏳ Not Started             | 2-3h     | _To be created_                                 |
| - Phase 4: Seeding & Embeddings          | 🔴 Critical | ⏳ Not Started             | 2-3h     | _To be created_                                 |

### Phase 2: Business Model & Structure

| Feature                               | Priority    | Status      | Doc                                                     |
| ------------------------------------- | ----------- | ----------- | ------------------------------------------------------- |
| **Remove Guest Free Adventures**      | 🔴 Critical | ✅ Complete | [FEATURE](FEATURE_remove_guest_free_adventures.md)      |
| **Expansion Six-Component Structure** | 🔴 Critical | ✅ Complete | [FEATURE](FEATURE_expansion_six_component_structure.md) |

### Phase 3: UI/UX Enhancement

| Feature               | Priority | Status         | Doc                                     |
| --------------------- | -------- | -------------- | --------------------------------------- |
| **Daggerheart Theme** | 🟡 High  | ⏳ Not Started | [FEATURE](FEATURE_daggerheart_theme.md) |
| **Dark Mode**         | 🟡 High  | ⏳ Not Started | [FEATURE](FEATURE_dark_mode.md)         |

---

## ✅ Completed Features

### Recent (In docs/FEATURES)

| Feature                               | Completed  | PR  | Doc                                                     |
| ------------------------------------- | ---------- | --- | ------------------------------------------------------- |
| **Remove Guest Free Adventures**      | 2025-10-28 | #68 | [FEATURE](FEATURE_remove_guest_free_adventures.md)      |
| **Expansion Six-Component Structure** | 2025-10-27 | #64 | [FEATURE](FEATURE_expansion_six_component_structure.md) |

### Archived (In docs/archive)

| Feature                               | Completed  | Doc                                                                |
| ------------------------------------- | ---------- | ------------------------------------------------------------------ |
| **Scaffold Regeneration (10 limit)**  | 2025-10-24 | [archive](../archive/FEATURE_scaffold_regeneration.md)             |
| **Free Expansion (20 regen limit)**   | 2025-10-24 | [archive](../archive/FEATURE_free_expansion_with_limits.md)        |
| **User Profiles Default Credits Fix** | 2025-10-24 | [archive](../archive/FEATURE_fix_user_profiles_default_credits.md) |
| **Regeneration Tracking Database**    | 2025-10-24 | [archive](../archive/FEATURE_regeneration_tracking_database.md)    |

**Note**: Credit display and Focus Mode were implemented earlier but lack feature docs.

---

## 📋 Feature Document Template

When creating new FEATURE docs, use this structure:

```markdown
# Feature: [Name]

**Status**: Not Started | In Progress | Complete
**Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low
**Phase**: [1-3]
**Estimated Time**: [X hours]
**Dependencies**: [Other FEATURE docs]

---

## Overview

[What and why]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Technical Specification

[Database, code structure, etc.]

## Implementation Steps

1. Step 1
2. Step 2

## Testing Requirements

[What tests to write]

## Verification Checklist

- [ ] Tests pass
- [ ] Coverage ≥90%
- [ ] Linting clean
- [ ] Build succeeds

---

**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
```

---

## 🔄 Workflow

1. **Planning**: Create FEATURE doc with detailed spec
2. **Branch**: `git checkout -b feature/[name]`
3. **TDD**: Write tests first (RED phase)
4. **Implement**: Make tests pass (GREEN phase)
5. **Refactor**: Clean up code while keeping tests green
6. **Validate**: Run full test suite, linting, build
7. **Push**: Trigger CI/CD validation
8. **PR**: Merge to main when CI passes
9. **Archive**: Move FEATURE doc to `docs/archive/`

---

**Last Updated**: 2025-10-28
