# DaggerGM Claude Code Skills

This directory contains auto-applied skills that enforce code quality, security, and testing standards for DaggerGM.

## Skills Overview

| Skill                        | Priority    | Auto-Activates On                | Purpose                                                 |
| ---------------------------- | ----------- | -------------------------------- | ------------------------------------------------------- |
| **tenant-security.md**       | 🔴 CRITICAL | Database queries, Server Actions | User isolation security auditing (`user_id` everywhere) |
| **code-quality.md**          | 🟠 HIGH     | All code changes, new files      | 300-line limit, Next.js patterns                        |
| **vitest-patterns.md**       | 🟠 HIGH     | Test files, coverage gaps        | 90% coverage, integration-first testing                 |
| **nextjs-server-actions.md** | 🟡 MEDIUM   | Server Actions, mutations        | Server Actions patterns (no Express/API routes)         |
| **llm-integration.md**       | 🟡 MEDIUM   | OpenAI calls, LLM responses      | Zod validation, error handling, cost monitoring         |

## Auto-Activation

Skills automatically activate when working with related code:

- **tenant-security.md** → Any `supabase.from()` or `'use server'` directive
- **code-quality.md** → Any file creation, refactoring, or code modification
- **vitest-patterns.md** → Any `.test.ts` file or coverage checking
- **nextjs-server-actions.md** → Any Server Action or form handling
- **llm-integration.md** → Any `openai.chat.completions.create()` call

## Running Validations Manually

Each skill includes executable validation scripts:

### Security Audit

```bash
./scripts/security-audit.sh
```

Checks for:

- ✅ Supabase queries have `user_id` filtering
- ✅ Server Actions have authentication
- ✅ No hardcoded user IDs
- ✅ INSERTs include `user_id`

### File Size Validation

```bash
./scripts/validate-file-size.sh
```

Checks for:

- ✅ All files ≤300 lines
- ⚠️ Warnings for files approaching limit (>250 lines)

### Test Coverage

```bash
npm run test:coverage
```

Checks for:

- ✅ 90% coverage overall
- ✅ 99% coverage for security-critical code

## Integration with CLAUDE.md

Skills enforce standards documented in [CLAUDE.md](../CLAUDE.md):

- **Skills** → Automated enforcement (validation scripts)
- **CLAUDE.md** → Explanation and patterns

Use skills for automated checks, CLAUDE.md for understanding why.

## Adding Skills to CI/CD

Add skill validations to GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Security Audit
  run: ./scripts/security-audit.sh

- name: File Size Validation
  run: ./scripts/validate-file-size.sh

- name: Test Coverage
  run: npm run test:coverage
```

## Skill Structure

Each skill follows this pattern:

```markdown
---
name: 'Skill Name'
description: 'Brief description'
---

# Skill Title

Auto-activates: [triggers]

## Patterns (✅ CORRECT / ❌ WRONG)

## Success Criteria (Binary Pass/Fail)

## Reference
```

## When Skills Fail

If validation scripts find violations:

1. **Review the violations** - Scripts show exact file/line
2. **Fix each violation** - Follow skill patterns
3. **Re-run validation** - Ensure all pass
4. **Do not bypass** - Zero tolerance for security violations

### Example Workflow

```bash
# Make changes
# ...

# Run validations
./scripts/security-audit.sh
./scripts/validate-file-size.sh
npm run test:coverage

# If violations found:
# 1. Read the skill for correct pattern
# 2. Fix the violation
# 3. Re-run validation
# 4. Commit only when all pass
```

## Skill Maintenance

### Updating Skills

Skills should be updated when:

- New patterns emerge from code reviews
- Framework updates (Next.js, Supabase, etc.)
- Security vulnerabilities discovered
- Team adopts new conventions

### Testing Skills

Test skills by creating intentional violations:

```typescript
// Test tenant-security.md
export async function badQuery() {
  const { data } = await supabase.from('adventures').select('*')
  // Missing: user_id filter (should be detected)
}

// Run security audit - should fail
./scripts/security-audit.sh
```

## Skills vs Commands

| Type         | Purpose               | Location            | Usage                             |
| ------------ | --------------------- | ------------------- | --------------------------------- |
| **Skills**   | Automated enforcement | `.claude/skills/`   | Auto-activates on related code    |
| **Commands** | Systematic workflows  | `.claude/commands/` | Manually invoked: `/command-name` |

---

**Version**: 1.0
**Created**: 2025-10-23
**Skills Count**: 5
**Validation Scripts**: 2 (security-audit.sh, validate-file-size.sh)
