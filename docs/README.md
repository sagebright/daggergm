# DaggerGM Documentation

**Last Updated**: 2025-11-07
**Organization**: v5.0 (Streamlined - task-based execution)

---

## 🎯 START HERE

### [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) ← READ THIS FIRST

Complete system architecture and business model:

- What DaggerGM does (AI-powered Daggerheart adventure generator)
- Tech stack (Next.js 15, React 19, Supabase, OpenAI GPT-4)
- Architecture decisions (Server Actions, RLS, credit-based model)
- Database schema, LLM integration, Focus Mode UX

### [tasks/](tasks/) ← ACTIVE WORK

All executable tasks organized for slash command execution:

- **FEATURE-001**: Expansion Confirmation Workflow (P1-High)
- **FEATURE-002**: Dark Mode (P2-Medium)
- **FIX-001**: Node.js Fetch Failures (P2-Medium)

See [tasks/README.md](tasks/README.md) for full task index.

---

## 📚 Reference Documentation

### Product Requirements

- [PRPs/daggergm_mvp_implementation.md](PRPs/daggergm_mvp_implementation.md) - MVP implementation plan
- [PRPs/INITIAL_daggergm_REVISED.md](PRPs/INITIAL_daggergm_REVISED.md) - Initial feature overview

### Architecture & Design

- [architecture/STATE_MANAGEMENT_DECISION.md](architecture/STATE_MANAGEMENT_DECISION.md) - Zustand for Focus Mode
- [architecture/TESTING_STRATEGY.md](architecture/TESTING_STRATEGY.md) - 80/15/5 test distribution
- [architecture/GUEST_SYSTEM.md](architecture/GUEST_SYSTEM.md) - Guest token system (deprecated)
- [architecture/SERVER_STATE.md](architecture/SERVER_STATE.md) - React Query patterns

### Operations

- [ops/GITHUB_ACTIONS.md](ops/GITHUB_ACTIONS.md) - CI/CD pipeline
- [ops/SECRETS_SETUP.md](ops/SECRETS_SETUP.md) - GitHub secrets configuration

### Active Issues

- [KNOWN_ISSUES.md](KNOWN_ISSUES.md) - Known issues and workarounds

---

## 🎯 Quick Reference

### For New Contributors

1. **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** - Understand the system
2. **[tasks/README.md](tasks/README.md)** - See what needs to be done
3. **[/CLAUDE.md](../CLAUDE.md)** - Development workflow guide

### For Development

1. **Pick a task**: [tasks/README.md](tasks/README.md)
2. **Execute it**: `/execute-[feature|fixes] TASK_NAME`
3. **Or follow manual steps** in the task document

### For Architecture Decisions

- **State Management**: See [architecture/STATE_MANAGEMENT_DECISION.md](architecture/STATE_MANAGEMENT_DECISION.md)
- **Testing Strategy**: See [architecture/TESTING_STRATEGY.md](architecture/TESTING_STRATEGY.md)
- **Database Design**: See [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)

---

## 📦 Historical Documentation

### [archive/](archive/) - Completed Work

See [archive/README.md](archive/README.md) for full index.

**Recent Archives** (2025-11-07):

- Completed features (Daggerheart theme, password auth, etc.)
- Completed fixes (E2E tests, adventure UI refactor, test coverage boost)
- Design docs for implemented features
- Outdated planning documents

---

## 🔄 Documentation Workflow

### When Working on a Task

1. Open task document in `tasks/`
2. Follow implementation steps
3. Mark acceptance criteria as complete
4. Update task status when done

### When Completing a Task

1. Update task status to "Complete"
2. Move task to `archive/YYYY-MM-DD/` folder
3. Update `tasks/README.md` to move to "Recently Completed"
4. Create PR with reference to task document

### When Creating New Tasks

1. Create document in `tasks/` folder
2. Use naming: `FIX_XXX_description.md` or `FEATURE_XXX_description.md`
3. Follow task template (see [tasks/README.md](tasks/README.md))
4. Add to `tasks/README.md` index
5. Assign priority (P0-P3)

---

## 📊 Current State

**Test Coverage**: 75.35% ✅ (above 70% threshold)

**Active Tasks**: 3

- FEATURE-001: Expansion Confirmation (P1-High)
- FEATURE-002: Dark Mode (P2-Medium)
- FIX-001: Node.js Fetch Failures (P2-Medium)

**Recently Completed**:

- FIX-002: Adventure Creation UI Refactor (Oct 29)
- Test Coverage Boost (75.35%, Oct-Nov)
- Password Authentication (Oct 29)
- Per-Scene Confirmation for Scaffold (Oct 30)
- Daggerheart Theme (Oct 28)

---

**Version**: 5.0 (Task-based organization)
**Previous Versions**: See [archive/](archive/) for v1-4 documentation
