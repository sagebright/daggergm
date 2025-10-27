# Documentation Archive

**Purpose**: Historical documentation for completed setup phases and reference material.

---

## About This Archive

This folder contains documentation that was actively used during project setup but is now complete. These files are preserved for:

1. **Historical context** - Understanding what was done and why
2. **Troubleshooting reference** - If issues arise with setup
3. **Learning reference** - Patterns and approaches used

---

## Archive Contents

### Phase Completion Documents

Summaries of completed infrastructure setup phases:

- `PHASE_0_COMPLETION.md` - Initial project setup (completed 2025-10-20)
- `PHASE_1_github_actions_update.md` - CI/CD pipeline setup
- `PHASE_2_mcp_servers_setup.md` - MCP servers configuration (completed 2025-10-23)
- `PHASE_3_workflow_validation.md` - End-to-end validation

### Setup Guides

Step-by-step guides that were executed to configure the project:

- `PHASE_0_project_setup.md` - Infrastructure initialization
- `SETUP_testing_infrastructure.md` - Vitest + Playwright setup
- `SETUP_commands.md` - Command templates setup (completed 2025-10-24)
- `SETUP_skills.md` - Skills configuration (completed 2025-10-24)
- `EXECUTION_GUIDE.md` - Meta-guide for executing setups

### MCP Integration Documents

Model Context Protocol server setup and troubleshooting:

- `MCP_SETUP_COMPLETE.md` - Setup completion summary
- `MCP_TOKEN_SETUP_INSTRUCTIONS.md` - Token generation guide
- `MCP_SETUP_TROUBLESHOOTING.md` - Common issues and solutions

### Testing & Development Guides

Examples and roadmaps from initial development:

- `FEATURE_first_integration_test.md` - First integration test example
- `TESTING_IMPLEMENTATION_ROADMAP.md` - Testing strategy roadmap

### Reference Material

Research and planning documents:

- `UI_UX_RESEARCH_PLAN.md` - UI/UX research findings for Daggerheart
- `GAPS_FILLED_SUMMARY.md` - Gaps analysis from rebuild planning
- `IMPLEMENTATION_CHECKLIST.md` - Full rebuild checklist

### DaggerGM Rebuild Planning (archived 2025-10-24)

Complete rebuild planning folder with templates and examples:

- `DaggerGM/` - Entire rebuild documentation folder
  - `CLAUDE.md` - Rebuild development guide (duplicate of root)
  - `README.md` - Rebuild documentation index
  - `.claude/` - Command/skill templates (now implemented in root)
  - `.github/` - CI/CD workflow templates (now implemented in root)
  - `.husky/` - Git hook templates (now implemented in root)
  - Config files: `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs` (now in root)
  - `src/`, `tests/` - Example directory structures (actual code now exists in root)

**Note**: Valuable architecture docs from this folder were promoted to `documentation/` root:

- `GUEST_SYSTEM.md`
- `SECRETS_SETUP.md`
- `SERVER_STATE.md`
- `STATE_MANAGEMENT_DECISION.md`
- `TESTING_STRATEGY.md`

---

## When to Reference These Files

### MCP Setup Issues

If MCP servers aren't working, see:

- `MCP_SETUP_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- `MCP_TOKEN_SETUP_INSTRUCTIONS.md` - Token regeneration steps

### Understanding Project History

To understand setup decisions and what was done:

- `PHASE_*_COMPLETION.md` files - What was accomplished in each phase
- `IMPLEMENTATION_CHECKLIST.md` - Original rebuild plan

### Testing Strategy Questions

For testing philosophy and patterns:

- `TESTING_IMPLEMENTATION_ROADMAP.md` - Original testing plan
- Note: Active testing docs are in `documentation/DaggerGM/TESTING_STRATEGY.md`

### UI/UX Decisions

For Daggerheart branding and design research:

- `UI_UX_RESEARCH_PLAN.md` - Color palette, typography, design patterns

---

## Active Documentation

If you're looking for current active documentation, see:

- **Root `/CLAUDE.md`** - Main development guide
- **`/documentation/GITHUB_ACTIONS.md`** - CI/CD workflow
- **`/documentation/DaggerGM/`** - Architecture and design decisions
- **`/.claude/commands/`** - Active command templates
- **`/.claude/skills/`** - Active skill enforcement

---

## Archive Maintenance

### Adding to Archive

When a document becomes obsolete:

1. Move to `documentation/archive/`
2. Update `documentation/DOCUMENTATION_ORGANIZATION.md`
3. Update this README if it's a major addition

### Never Delete

These archived documents should **never be deleted** because:

- They explain decisions made during setup
- They can be referenced for troubleshooting
- They preserve institutional knowledge

---

**Archive Created**: 2025-10-24
**Last Updated**: 2025-10-24 (added DaggerGM folder)
**Total Items**: 18 (17 individual files + 1 folder with templates)
**Purpose**: Historical reference for completed work

## Changelog

### 2025-10-24 (afternoon)

- Added entire `DaggerGM/` rebuild planning folder
- Promoted 5 valuable docs to `documentation/` root level
- Updated references throughout documentation

### 2025-10-24 (morning)

- Initial archive creation
- Moved 17 completed phase and setup documents
