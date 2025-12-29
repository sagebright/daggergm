# Execute GitHub Issue

**Argument:** `$ARGUMENTS` = GitHub issue number

---

## 1. Fetch & Analyze Issue

```bash
gh issue view $ARGUMENTS
```

- [ ] Note issue **title** and **labels**
- [ ] Identify sections in body:
  - [ ] Pre-Flight Checklist (if present)
  - [ ] Implementation Checklist / Tasks
  - [ ] Verification Checklist / Acceptance Criteria
  - [ ] Files table

---

## 2. Load Context Based on Labels

### 2.1 Validate Labels Exist

- [ ] Confirm issue has at least one label from the mapping table below
- [ ] **STOP if no matching label** → Comment: "Issue needs a routing label. Options: `bug`, `refactor`, `tech-debt`, `clean-code`, `enhancement`, `ui`, `backend`, `database`, `security`, `test`, `documentation`" and ask user which label to apply

### 2.2 Review CLAUDE.md

- [ ] Read `CLAUDE.md` for current project priorities and patterns

### 2.3 Label → Documentation & Skills Mapping

- [ ] Identify relevant documentation and skills using this table:

| Label           | Documentation                                                            | Skills (Auto-Enforced)                  | Consider Agent            |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------- | ------------------------- |
| `bug`           | `CLAUDE_debugging.md`, `CLAUDE_testing.md`                               | `vitest-patterns`                       | `debugger`                |
| `refactor`      | `CLAUDE_coding_standards.md`, `CLAUDE_architecture.md`                   | `code-quality`                          | `refactoring-specialist`  |
| `tech-debt`     | `CLAUDE_coding_standards.md`                                             | `code-quality`                          | `refactoring-specialist`  |
| `clean-code`    | `CLAUDE_coding_standards.md`                                             | `code-quality`                          | `code-reviewer`           |
| `enhancement`   | `CLAUDE_tdd.md`, `CLAUDE_architecture.md`                                | `tcg-tdd-workflow`                      | —                         |
| `ui`            | `CLAUDE_ui.md`, `CLAUDE_layout_rules.md`, `CLAUDE_component_patterns.md` | `vibe-ui-standards`                     | —                         |
| `backend`       | `CLAUDE_architecture.md`, `CLAUDE_security.md`                           | `tcg-nodejs-backend`, `tenant-security` | —                         |
| `database`      | `CLAUDE_database_connections.md`, `CLAUDE_security.md`                   | `tenant-security`                       | `database-optimizer`      |
| `security`      | `CLAUDE_security.md`                                                     | `tenant-security`                       | `tenant-security-auditor` |
| `test`          | `CLAUDE_testing.md`, `CLAUDE_tdd.md`                                     | `vitest-patterns`                       | `test-automator`          |
| `documentation` | `CLAUDE_code_review.md`                                                  | —                                       | —                         |

### 2.4 Scope-Based Documentation (Check File Paths)

- [ ] Cross-reference Files table with this scope guide:

| If Files Involve             | Also Read                                                                | Skills Active                           |
| ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| `frontend/src/components/`   | `CLAUDE_ui.md`, `CLAUDE_layout_rules.md`, `CLAUDE_component_patterns.md` | `vibe-ui-standards`                     |
| `backend/src/services/`      | `CLAUDE_architecture.md`, `CLAUDE_security.md`                           | `tcg-nodejs-backend`, `tenant-security` |
| `**/tests/**` or `*.test.*`  | `CLAUDE_testing.md`, `CLAUDE_tdd.md`                                     | `vitest-patterns`                       |
| `supabase/` or migrations    | `CLAUDE_database_connections.md`, `CLAUDE_security.md`                   | `tenant-security`                       |
| Quote/Inventory/Sales domain | `CLAUDE_business.md`                                                     | —                                       |

### 2.5 Context Loading

- [ ] Read 1-3 most relevant documentation files identified above
- [ ] Note which skills will auto-enforce patterns
- [ ] Consider spawning specialist agent for complex issues

---

## 3. Pre-Flight (from Issue Body)

- [ ] Execute each item in issue's Pre-Flight Checklist
- [ ] Read all files mentioned in Files table
- [ ] Check dependency issues are complete (if referenced)
- [ ] **STOP if pre-flight fails** → Comment on issue with blocker

---

## 4. Setup TodoWrite

- [ ] Add each Implementation/Tasks checklist item as a todo
- [ ] Mark first item as `in_progress`

---

## 5. Execute Implementation

For each checklist item:

- [ ] Mark item `in_progress` in TodoWrite
- [ ] Execute the task
- [ ] Mark item `completed` in TodoWrite
- [ ] Move to next item

**During execution, respect:**

- Skills patterns (auto-enforced based on scope)
- 500-line file limit (`code-quality`)
- Tenant isolation for any DB operations (`tenant-security`)
- Vibe components for UI work (`vibe-ui-standards`)

---

## 6. Run Verification

- [ ] Execute each Verification/Acceptance Criteria item
- [ ] If any fail: fix before proceeding
- [ ] Run `npm run smoke` (always, unless explicitly skipped)
- [ ] Run `wc -l` on created/modified files if line counts mentioned

---

## 7. Comment Results

```bash
gh issue comment $ARGUMENTS --body "## Execution Complete

### Context Loaded
- Labels: [labels from issue]
- Documentation reviewed: [list files read]
- Skills active: [list relevant skills]

### Pre-Flight
- [x] All items passed

### Implementation
- [x] Item 1
- [x] Item 2
...

### Verification
- [x] Item 1
- [x] Item 2
...

### Files Changed
- \`path/to/file.jsx\` (created/modified)

---
🤖 Executed by Claude Code"
```

---

## 8. Close Issue

- [ ] Only if ALL verification items pass
- [ ] Run: `gh issue close $ARGUMENTS`

---

## Error Handling

### If No Matching Label

- [ ] Do NOT proceed with execution
- [ ] Comment on issue listing available routing labels
- [ ] Ask user which label applies
- [ ] Wait for label to be added before continuing

### If Blocked

- [ ] Comment on issue with blocker details
- [ ] Leave issue open
- [ ] List what was completed vs what remains

### If Tests Fail

- [ ] Do NOT close issue
- [ ] Comment with failure details and stack traces
- [ ] List failing verification items
- [ ] Consider using `debugger` agent to investigate

### If Scope Expands

- [ ] Stop implementation
- [ ] Comment on issue noting scope creep
- [ ] Suggest creating follow-up issue for additional work

---

## Quick Reference: Common Patterns

### Bug Fix Flow

1. Read `CLAUDE_debugging.md` for investigation approach
2. Write failing test first (TDD)
3. Implement minimal fix
4. Verify fix doesn't break other tests

### Refactor Flow

1. Read `CLAUDE_coding_standards.md` for target patterns
2. Ensure tests exist before refactoring
3. Make incremental changes, test after each
4. Verify no behavior changes

### UI Component Flow

1. Read `CLAUDE_component_patterns.md` for golden sources
2. Read `CLAUDE_layout_rules.md` for spacing/layout
3. Check existing components before creating new ones
4. Test on mobile viewport first

---

**Version**: 2025-12-10
