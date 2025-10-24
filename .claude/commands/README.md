# DaggerGM Slash Commands

Executable commands for systematic development workflows with mandatory checkpoints and safety protocols.

## Development Commands

### `/execute-feature`

**Implement features with TDD workflow**

- **Usage**: `/execute-feature documentation/FEATURE_[name].md`
- **Pattern**: RED → GREEN → REFACTOR
- **Validates**: Tests, lint, coverage (≥90%)
- **File**: [execute-feature.md](execute-feature.md)

### `/test-integration`

**Write integration tests with TDD**

- **Usage**: `/test-integration [feature-name]`
- **Pattern**: Integration-first (80/15/5 distribution)
- **Validates**: Real database, no DB mocking
- **File**: [test-integration.md](test-integration.md)

### `/setup-testing-infrastructure`

**Initialize testing infrastructure**

- **Usage**: `/setup-testing-infrastructure`
- **Sets up**: Vitest, Supabase local, MSW
- **One-time**: Setup command
- **File**: [setup-testing-infrastructure.md](setup-testing-infrastructure.md)

---

## Database Commands

### `/execute-db-ops` (NEW)

**Database operations with safety checkpoints**

- **Usage**: `/execute-db-ops documentation/DATABASE/[operation].md`
- **Operations**: Migrations, RLS, schema changes, data fixes
- **Safety**: Mandatory checkpoints, rollback plans
- **Pattern**: Supabase migrations (git-tracked)
- **File**: [execute-db-ops.md](execute-db-ops.md)

**Key Features**:

- RLS policy implementation and testing
- User isolation enforcement (`user_id` everywhere)
- Guest token handling (24-hour expiry)
- TypeScript type regeneration
- Server Actions compatibility testing

---

## Code Quality Commands

### `/execute-refactor` (NEW)

**Refactor files exceeding 300 lines**

- **Usage**: `/execute-refactor documentation/REFACTOR/[file].md`
- **Trigger**: Files >300 lines (ESLint enforced)
- **Pattern**: Checkpoint-driven extraction
- **File**: [execute-refactor.md](execute-refactor.md)

**Extraction Phases**:

1. Server Actions separation
2. Client Component extraction
3. Custom hooks and Zustand stores
4. Utility functions

**Next.js Specific**:

- Server Component vs Client Component separation
- `'use server'` and `'use client'` directive handling
- TypeScript strict mode compliance

### `/execute-code-review`

**Comprehensive code reviews**

- **Usage**: `/execute-code-review [PR-URL|branch-name]`
- **Validates**: Security, quality, tests, CLAUDE.md compliance
- **File**: [execute-code-review.md](execute-code-review.md)

### `/execute-fixes`

**Bug fixes and stability improvements**

- **Usage**: `/execute-fixes documentation/FIXES/[issue].md`
- **Pattern**: Systematic issue resolution
- **File**: [execute-fixes.md](execute-fixes.md)

---

## Operations Commands

### `/execute-ops` (NEW)

**General operations with 3-phase checkpoints**

- **Usage**: `/execute-ops documentation/OPS/[operation].md`
- **Operations**: Git, config, dependencies, infrastructure, docs
- **Safety**: 3-phase checkpoint system
- **File**: [execute-ops.md](execute-ops.md)

**Common Operations**:

- Git operations (branch management, cleanup)
- npm dependency updates
- Configuration changes (Next.js, TypeScript, ESLint)
- Infrastructure updates (GitHub Actions, Vercel, Supabase)
- Documentation migrations

**DaggerGM Stack**:

- Package Manager: npm (not yarn)
- Platform: GitHub + Vercel + Supabase
- Framework: Next.js 15 + TypeScript strict mode

---

## Command Patterns

All commands follow this structure:

### 1. Pre-flight Checks

- Validate environment
- Read operation specs
- Document baseline state

### 2. Planning Phase

- TodoWrite breakdown
- Risk assessment
- Rollback planning

### 3. Execution Phase

- Systematic implementation
- Continuous validation
- Error handling

### 4. Validation Phase

- Tests (≥90% coverage)
- Lint and type checks
- Build verification

### 5. Documentation

- Update related docs
- Record lessons learned

---

## Checkpoint System

Commands use **mandatory checkpoints** to prevent runaway execution:

```
PHASE → VALIDATE → ✋ CHECKPOINT → USER APPROVES → NEXT PHASE
```

### Why Checkpoints?

- Prevent incomplete work
- Enable user review at critical points
- Allow course correction
- Ensure quality gates

### Checkpoint Rules:

1. **STOP at each checkpoint** - Do not proceed automatically
2. **Report status clearly** - Show what was done and what's next
3. **Wait for approval** - User must explicitly approve
4. **Rollback if issues** - Fix or rollback, never proceed with broken state

---

## Integration with CLAUDE.md

Commands are referenced in [CLAUDE.md](../../CLAUDE.md) under:

- **Slash Commands (Automation)** - Quick reference
- **Task Routing** - When to use each command
- **Development Workflow** - How commands fit into TDD cycle

---

## Archived Commands

The following commands are archived (outdated workflow):

- `execute-prp_daggergm.md`
- `generate-prp_daggergm.md`

See [archive/](archive/) for historical reference.

---

## Command Usage Tips

### For New Features:

```bash
/execute-feature documentation/FEATURE_focus_mode.md
```

### For Database Changes:

```bash
/execute-db-ops documentation/DATABASE/enable_rls_adventures.md
```

### For Large Files:

```bash
/execute-refactor documentation/REFACTOR/adventure_page.md
```

### For Operations:

```bash
/execute-ops documentation/OPS/update_github_actions.md
```

### For Testing:

```bash
/test-integration adventures
```

---

## Safety Protocols

### Critical Security Commands:

- All database operations require user_id filtering
- RLS policies must be tested with `assertRlsBlocks`
- Credit operations require 100% test coverage
- Guest tokens must have 24-hour expiry

### Quality Gates:

- Tests must pass (≥90% coverage)
- TypeScript strict mode must compile
- ESLint must pass (zero warnings)
- Next.js build must succeed

### Rollback Requirements:

- All operations must have documented rollback
- Test rollback before production execution
- Keep original state until validated

---

## File Organization

```
.claude/commands/
├── README.md                           # This file
├── execute-feature.md                  # Feature development (TDD)
├── execute-db-ops.md                   # Database operations (NEW)
├── execute-refactor.md                 # File size reduction (NEW)
├── execute-ops.md                      # General operations (NEW)
├── execute-code-review.md              # Code review
├── execute-fixes.md                    # Bug fixes
├── test-integration.md                 # Integration testing
├── setup-testing-infrastructure.md     # Testing setup
└── archive/                            # Archived commands
    ├── README.md
    ├── execute-prp_daggergm.md
    └── generate-prp_daggergm.md
```

---

**Version**: 1.0
**Last Updated**: 2025-10-23
**Total Active Commands**: 8
**Archived Commands**: 2
**Framework**: Next.js 15 + TypeScript + Supabase
**Testing**: Vitest (90% coverage target)
