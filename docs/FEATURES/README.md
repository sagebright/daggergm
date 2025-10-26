# Feature Implementation Roadmap

**Status**: Ready for Execution
**Created**: 2025-10-24
**Source**: [IMPLEMENTATION_GAP_ANALYSIS.md](../IMPLEMENTATION_GAP_ANALYSIS.md)

---

## Overview

This directory contains small, autonomous feature specifications designed for execution with the `/execute-feature` slash command. Each feature is scoped to be completable in 20 minutes to 3 hours.

---

## Phase 1: Fix Business Model (Critical) 🔴

**Goal**: Prevent revenue loss from free adventures and infinite regenerations.

### 1.1 Database Schema

| Feature                                                                                        | Priority    | Time   | Status      | Dependencies |
| ---------------------------------------------------------------------------------------------- | ----------- | ------ | ----------- | ------------ |
| [FEATURE_regeneration_tracking_database.md](./FEATURE_regeneration_tracking_database.md)       | 🔴 Critical | 30 min | Not Started | None         |
| [FEATURE_fix_user_profiles_default_credits.md](./FEATURE_fix_user_profiles_default_credits.md) | 🟡 High     | 20 min | Not Started | None         |

**Execute Order**: Start with regeneration tracking, then user profiles.

### 1.2 Credit System

| Feature                                                                              | Priority    | Time   | Status      | Dependencies                   |
| ------------------------------------------------------------------------------------ | ----------- | ------ | ----------- | ------------------------------ |
| [FEATURE_remove_guest_free_adventures.md](./FEATURE_remove_guest_free_adventures.md) | 🔴 Critical | 45 min | Not Started | None                           |
| [FEATURE_free_expansion_with_limits.md](./FEATURE_free_expansion_with_limits.md)     | 🔴 Critical | 1 hour | Not Started | regeneration_tracking_database |

**Execute Order**: Remove guest adventures first, then fix expansion credits.

### 1.3 Regeneration Features

| Feature                                                                | Priority    | Time      | Status      | Dependencies                   |
| ---------------------------------------------------------------------- | ----------- | --------- | ----------- | ------------------------------ |
| [FEATURE_scaffold_regeneration.md](./FEATURE_scaffold_regeneration.md) | 🔴 Critical | 1.5 hours | Not Started | regeneration_tracking_database |

**Execute Order**: After database tracking is in place.

---

## Phase 2: Fix Expansion Structure (Critical) 🔴

**Goal**: Align expansion with 4-component specification.

| Feature                                                                                          | Priority    | Time    | Status      | Dependencies                     |
| ------------------------------------------------------------------------------------------------ | ----------- | ------- | ----------- | -------------------------------- |
| [FEATURE_expansion_four_component_structure.md](./FEATURE_expansion_four_component_structure.md) | 🔴 Critical | 3 hours | Not Started | None (Phase 1 recommended first) |

**Note**: This is a breaking change. Recommend completing Phase 1 first.

---

## Phase 3: Focus Mode Features (High) 🟡

**Goal**: Complete Focus Mode UX with regeneration, locking, and limits.

### Coming Soon

Features to be created:

- `FEATURE_movement_lock_unlock.md` - Add lock/unlock mechanism
- `FEATURE_component_regeneration.md` - Regenerate individual NPCs/Enemies
- `FEATURE_regeneration_counter_ui.md` - Display remaining regenerations

---

## Phase 4: Guest System MVP (High) 🟡

**Goal**: Align guest UX with MVP spec (no free generation).

### Coming Soon

Features to be created:

- `FEATURE_sample_adventure_download.md` - Pre-generated sample adventure
- `FEATURE_landing_page_guest_restrictions.md` - Gray out features for guests
- `FEATURE_stripe_account_creation_flow.md` - Post-purchase account creation

---

## How to Execute Features

### Using the `/execute-feature` Command

1. **Navigate to feature document**:

   ```
   Open docs/FEATURES/FEATURE_<name>.md
   ```

2. **Run slash command**:

   ```
   /execute-feature docs/FEATURES/FEATURE_<name>.md
   ```

3. **Claude will autonomously**:
   - Read the specification
   - Implement code changes
   - Write tests
   - Run tests and linting
   - Commit changes

### Manual Execution (Alternative)

If not using slash command:

1. **Read feature document** thoroughly
2. **Follow Implementation Steps** section in order
3. **Run Verification Checklist** to ensure completion
4. **Run tests**: `npm run test:coverage`
5. **Commit** with suggested message

---

## Execution Recommendations

### Recommended Order (Phase 1)

Execute in this exact order to minimize conflicts:

1. `FEATURE_regeneration_tracking_database.md` ← Start here
2. `FEATURE_fix_user_profiles_default_credits.md`
3. `FEATURE_remove_guest_free_adventures.md`
4. `FEATURE_free_expansion_with_limits.md`
5. `FEATURE_scaffold_regeneration.md`

**Total Time**: ~4 hours for Phase 1

### Parallel Execution

These features CAN be executed in parallel (no conflicts):

**Group A** (Database):

- regeneration_tracking_database
- fix_user_profiles_default_credits

**Group B** (After Group A):

- remove_guest_free_adventures
- free_expansion_with_limits

### Sequential Execution

These features MUST be sequential:

- regeneration_tracking_database → free_expansion_with_limits
- regeneration_tracking_database → scaffold_regeneration

---

## Testing Strategy

### After Each Feature

- [ ] Integration tests pass: `npm run test:coverage`
- [ ] Coverage ≥ 90%
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Manual QA (if specified in feature)

### After Each Phase

- [ ] Run full test suite: `npm run test:coverage`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Manual smoke test of complete user flow
- [ ] Review IMPLEMENTATION_GAP_ANALYSIS.md to mark phase complete

---

## Success Metrics

### Phase 1 Complete When:

- [ ] No free guest adventures possible
- [ ] Expansions/refinements don't consume credits
- [ ] Regeneration limits enforced (10 scaffold, 20 expansion)
- [ ] Scaffold regeneration works
- [ ] All integration tests pass
- [ ] 90% coverage maintained

### Phase 2 Complete When:

- [ ] Expansion returns 4-component structure
- [ ] NPCs, Enemies, Descriptions, Narration all populated
- [ ] Database stores new structure correctly
- [ ] Integration tests verify structure
- [ ] All existing tests updated and passing

---

## Troubleshooting

### If Tests Fail

1. **Read error message** carefully
2. **Check dependencies**: Did prerequisite features complete?
3. **Review feature's Testing Requirements** section
4. **Run single test**: `npm test -- <test-file-name>`
5. **Check database**: Are migrations applied? `npm run db:migrate`

### If TypeScript Errors

1. **Regenerate types**: `npm run db:types`
2. **Check imports**: Ensure all new types are exported
3. **Review type definitions** in feature document

### If Conflicts with Main

1. **Pull latest**: `git pull origin main`
2. **Resolve conflicts** in migration files (increment number if needed)
3. **Re-run tests** after resolving

---

## Feature Template

New features should follow this structure:

```markdown
# Feature: <Name>

**Status**: Not Started
**Priority**: 🔴/🟡/🟢
**Phase**: <Phase Number>
**Estimated Time**: <Time>
**Dependencies**: <Feature names or None>

## Overview

Brief description (2-3 sentences).

## Acceptance Criteria

- [ ] Specific, testable criteria
- [ ] ...

## Technical Specification

Detailed implementation with code examples.

## Testing Requirements

Integration tests with full code.

## Implementation Steps

Step-by-step instructions.

## Verification Checklist

Pre-commit checklist.

## References

Links to Gap Analysis and System Overview.
```

---

## Documentation Updates

After completing features, update:

1. **[IMPLEMENTATION_GAP_ANALYSIS.md](../IMPLEMENTATION_GAP_ANALYSIS.md)**: Mark items complete
2. **[SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)**: Confirm implementation matches spec
3. **This README**: Update Status column for completed features

---

## Contact / Questions

If a feature specification is unclear:

1. **Check References section** for context
2. **Review Gap Analysis** for detailed rationale
3. **Review System Overview** for intended behavior
4. **Ask Product Owner** for business decisions (marked in features)

---

## Version History

| Version | Date       | Changes                                 |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2025-10-24 | Initial feature breakdown (Phase 1 & 2) |

---

**Next Steps**: Execute Phase 1 features in recommended order, starting with `FEATURE_regeneration_tracking_database.md`.
