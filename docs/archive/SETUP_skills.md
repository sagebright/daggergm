# SETUP Skills Infrastructure

**Purpose**: Systematically implement Claude Code skills for DaggerGM to enforce security, quality, and testing standards.

**Execute with**: `/execute-ops documentation/SETUP_skills.md`

---

## 🎯 **OPERATION OVERVIEW**

**Operation Type**: Skills Infrastructure Setup
**Risk Level**: Low (read-only enforcement patterns)
**Duration**: 2-3 hours
**Reversible**: Yes (files can be deleted)

---

## 📋 **OBJECTIVES**

Create 5 skills in `.claude/skills/` directory:

1. **tenant-security.md** - User isolation security auditing
2. **code-quality.md** - 300-line limit and Next.js patterns
3. **vitest-patterns.md** - 90% coverage and integration-first testing
4. **nextjs-server-actions.md** - Server Actions patterns (NEW)
5. **llm-integration.md** - OpenAI integration patterns (NEW)

---

## ✅ **SUCCESS CRITERIA**

- [ ] `.claude/skills/` directory created
- [ ] All 5 skill files created with proper frontmatter
- [ ] All skills use DaggerGM-specific variables (user_id, Supabase, etc.)
- [ ] All skills have executable validation scripts
- [ ] Skills documented in CLAUDE.md
- [ ] README.md created in skills directory

---

## 📝 **PHASE 1: DIRECTORY SETUP**

### Actions:

```bash
# Create skills directory
mkdir -p .claude/skills

# Verify creation
ls -la .claude/skills
```

### Validation:

```bash
# Directory should exist
test -d .claude/skills && echo "✅ Skills directory created"
```

---

## 📝 **PHASE 2: SKILL 1 - TENANT SECURITY**

### File: `.claude/skills/tenant-security.md`

### Content Template:

````markdown
---
name: 'User Isolation Security Enforcer'
description: 'Auto-verify user_id isolation in all database operations - CRITICAL security validation'
---

# Multi-Tenant Security Enforcement (DaggerGM)

Auto-activates: ANY database query, Server Action, or data access code.

## AUTOMATED SECURITY AUDIT (Run First)

```bash
#!/bin/bash
# Execute this before ANY database-related code review

echo "🔒 USER ISOLATION SECURITY AUDIT (DaggerGM)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FAIL_COUNT=0

# 1. CRITICAL: Find Supabase queries WITHOUT user_id
echo "1️⃣  Scanning for queries missing user_id..."
MISSING_USER=$(grep -rn "supabase\.from" src --include="*.ts" --include="*.tsx" | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check next 10 lines for user_id or .auth.getUser()
  if ! sed -n "$linenum,$((linenum+10))p" "$file" 2>/dev/null | grep -q "user_id\|getUser()"; then
    echo "❌ $file:$linenum - Missing user_id filtering"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_USER" -gt 0 ]; then
  echo "   ❌ CRITICAL: $MISSING_USER queries without user_id"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_USER))
else
  echo "   ✅ All queries have user_id filtering"
fi

# 2. CRITICAL: Find Server Actions WITHOUT authentication
echo ""
echo "2️⃣  Scanning for Server Actions missing auth..."
MISSING_AUTH=$(grep -rn "'use server'" src --include="*.ts" --include="*.tsx" | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check next 20 lines for auth.getUser()
  if ! sed -n "$linenum,$((linenum+20))p" "$file" 2>/dev/null | grep -q "getUser()"; then
    echo "❌ $file:$linenum - Server Action missing auth check"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_AUTH" -gt 0 ]; then
  echo "   ❌ CRITICAL: $MISSING_AUTH Server Actions without auth"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_AUTH))
else
  echo "   ✅ All Server Actions have authentication"
fi

# 3. Check for hardcoded user_id values
echo ""
echo "3️⃣  Scanning for hardcoded user_id..."
HARDCODED=$(grep -rn "user_id.*['\"].*-.*-.*-.*-" src --include="*.ts" --include="*.tsx" | grep -v "// " | wc -l | tr -d ' ')

if [ "$HARDCODED" -gt 0 ]; then
  echo "   ⚠️  WARNING: $HARDCODED potential hardcoded user_id (UUIDs)"
  grep -rn "user_id.*['\"].*-.*-.*-.*-" src --include="*.ts" --include="*.tsx" | grep -v "// " | head -5
else
  echo "   ✅ No hardcoded user_id values"
fi

# 4. Verify INSERT operations include user_id
echo ""
echo "4️⃣  Scanning INSERT operations..."
MISSING_INSERT_USER=$(grep -rn "\.insert(" src --include="*.ts" --include="*.tsx" | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check previous 10 lines for user_id assignment
  if ! sed -n "$((linenum-10)),$linenum p" "$file" 2>/dev/null | grep -q "user_id"; then
    echo "❌ $file:$linenum - INSERT missing user_id"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_INSERT_USER" -gt 0 ]; then
  echo "   ❌ CRITICAL: $MISSING_INSERT_USER INSERT without user_id"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_INSERT_USER))
else
  echo "   ✅ All INSERT operations include user_id"
fi

# 5. Final verdict
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ SECURITY AUDIT FAILED: $FAIL_COUNT critical violations"
  echo "🚨 DO NOT MERGE - Fix violations before proceeding"
  exit 1
else
  echo "✅ SECURITY AUDIT PASSED: No critical violations"
  exit 0
fi
```
````

**Usage:**

```bash
# Save as: scripts/security-audit.sh
chmod +x scripts/security-audit.sh
./scripts/security-audit.sh
```

---

## MANDATORY QUERY PATTERN

### ✅ CORRECT: All database operations

```typescript
// 1️⃣  VALIDATE user exists (Server Action)
'use server'

export async function createAdventure(data: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // 2️⃣  SELECT with user_id
  const { data: adventures, error } = await supabase
    .from('adventures')
    .select('*')
    .eq('user_id', user.id) // ✅ REQUIRED - First filter
    .eq('status', 'published')

  // 3️⃣  INSERT with user_id
  const { data: adventure, error } = await supabase
    .from('adventures')
    .insert({
      title: data.get('title'),
      user_id: user.id, // ✅ REQUIRED - Inject before insert
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  // 4️⃣  UPDATE with user_id
  const { data, error } = await supabase
    .from('adventures')
    .update({ title: 'New Title' })
    .eq('id', adventureId)
    .eq('user_id', user.id) // ✅ REQUIRED - Double-verify ownership

  // 5️⃣  DELETE with user_id
  const { error } = await supabase
    .from('adventures')
    .delete()
    .eq('id', adventureId)
    .eq('user_id', user.id) // ✅ REQUIRED - Prevent cross-user delete

  revalidatePath('/adventures')
  return adventure
}
```

### ❌ REJECT: Security violations

```typescript
// ❌ CRITICAL: No user authentication
export async function getAdventures() {
  const supabase = await createClient()
  const { data } = await supabase.from('adventures').select('*')
  // Missing: auth.getUser() check
}

// ❌ CRITICAL: No user_id filter
export async function getAdventure(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data } = await supabase.from('adventures').select('*').eq('id', id)
  // Missing: .eq('user_id', user.id)
}

// ❌ CRITICAL: Client-side fetch (should use Server Action)
const response = await fetch('/api/adventures', {
  method: 'POST',
  body: JSON.stringify(data),
})
  // ❌ CRITICAL: Hardcoded user_id
  .eq('user_id', '00000000-0000-0000-0000-000000000000')
```

---

## MULTI-TENANT TEST REQUIREMENTS

Every Server Action MUST have this test pattern:

```typescript
import { describe, test, expect, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

describe('User isolation', () => {
  let user1, user2, adventure1

  beforeEach(async () => {
    // ✅ Setup two different users
    user1 = await createTestUser()
    user2 = await createTestUser()

    // ✅ Create adventure for user1
    adventure1 = await createTestAdventure(user1.id)
  })

  test('user2 CANNOT access user1 data', async () => {
    const supabase = await createClient()

    // Mock user2 session
    const { data, error } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventure1.id)
      .eq('user_id', user2.id) // Wrong user

    // ✅ MUST return empty (RLS blocks access)
    expect(data).toHaveLength(0)
  })

  test('user1 CAN access user1 data', async () => {
    const supabase = await createClient()

    const { data } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventure1.id)
      .eq('user_id', user1.id) // Correct user

    expect(data).toHaveLength(1)
    expect(data[0].user_id).toBe(user1.id)
  })
})
```

---

## SUCCESS CRITERIA (Binary Pass/Fail)

```bash
# All must exit 0:

# 1. No queries without user_id
! grep -r "supabase.from" src --include="*.ts" --include="*.tsx" -A 5 | grep -v "user_id\|getUser()"
# Exit 0 = PASS ✅

# 2. All Server Actions have auth
! grep -r "'use server'" src --include="*.ts" --include="*.tsx" -A 10 | grep -v "getUser()"
# Exit 0 = PASS ✅

# 3. All tests include user isolation checks
grep -r "describe.*[Uu]ser.*isolation" src --include="*.test.ts" --include="*.test.tsx" | wc -l
# Result > 0 = PASS ✅

# 4. No hardcoded user IDs
! grep -r "user_id.*['\"].*-.*-.*-.*-" src --include="*.ts" --include="*.tsx" | grep -v "//"
# Exit 0 = PASS ✅
```

**If ANY check fails → Code is NOT secure → DO NOT MERGE**

---

**Reference**: CLAUDE.md "Security & Multi-tenancy" section
**Enforcement**: CRITICAL - Zero tolerance for violations
**Auto-activate**: On ANY database or authentication code

````

### Validation:

```bash
# File should exist and be readable
test -f .claude/skills/tenant-security.md && echo "✅ Skill 1 created"
````

---

## 📝 **PHASE 3: SKILL 2 - CODE QUALITY**

### File: `.claude/skills/code-quality.md`

### Key Adaptations:

- Change `{{FILE_SIZE_LIMIT}}` → `300`
- Add Next.js App Router patterns
- Include Server Components vs Client Components
- Add shadcn/ui component patterns
- Include Zustand state management patterns

### Validation:

```bash
test -f .claude/skills/code-quality.md && echo "✅ Skill 2 created"
```

---

## 📝 **PHASE 4: SKILL 3 - VITEST PATTERNS**

### File: `.claude/skills/vitest-patterns.md`

### Key Adaptations:

- Update `{{COVERAGE_TARGET}}` → `90` (99 for security-critical)
- Add Supabase test client patterns
- Include MSW for OpenAI mocking
- Add Next.js Server Actions testing
- Include Playwright E2E patterns

### Validation:

```bash
test -f .claude/skills/vitest-patterns.md && echo "✅ Skill 3 created"
```

---

## 📝 **PHASE 5: SKILL 4 - NEXTJS SERVER ACTIONS** (NEW)

### File: `.claude/skills/nextjs-server-actions.md`

### Content Focus:

- Server Actions patterns (not Express routes)
- `'use server'` directive enforcement
- `revalidatePath()` / `revalidateTag()` usage
- Server/Client component boundaries
- Form Actions with useFormState/useFormStatus
- Error handling in Server Actions

### Example Pattern:

```typescript
// ✅ CORRECT Server Action
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createAdventure(formData: FormData) {
  // 1. Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Validate input
  const title = formData.get('title') as string
  if (!title || title.length < 3) {
    return { success: false, error: 'Title must be at least 3 characters' }
  }

  // 3. Database operation
  const { data: adventure, error } = await supabase
    .from('adventures')
    .insert({
      title,
      user_id: user.id,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to create adventure' }
  }

  // 4. Revalidate cached data
  revalidatePath('/adventures')
  revalidatePath(`/adventures/${adventure.id}`)

  // 5. Return success
  return { success: true, data: adventure }
}

// ❌ WRONG - Using API route
export async function createAdventure(data: any) {
  const response = await fetch('/api/adventures', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.json()
}
```

### Validation:

```bash
test -f .claude/skills/nextjs-server-actions.md && echo "✅ Skill 4 created"
```

---

## 📝 **PHASE 6: SKILL 5 - LLM INTEGRATION** (NEW)

### File: `.claude/skills/llm-integration.md`

### Content Focus:

- OpenAI GPT-4 structured outputs
- Zod schema validation (ALWAYS)
- Temperature settings per content type
- MSW mocking patterns for tests
- Error handling and retries
- Token usage monitoring
- Prompt caching strategies

### Example Pattern:

```typescript
// ✅ CORRECT: Structured output with Zod
import { z } from 'zod'
import { openai } from '@/lib/openai'

const AdventureSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(50),
  frame: z.enum(['witherwild', 'celestial', 'undergrowth']),
  scenes: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum(['combat', 'social', 'exploration']),
    }),
  ),
})

export async function generateAdventure(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a Daggerheart adventure generator...' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7, // Creative but coherent for scaffolds
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content

  // ✅ ALWAYS validate with Zod
  const validated = AdventureSchema.parse(JSON.parse(content))

  return validated
}

// ❌ WRONG: No validation
const content = JSON.parse(completion.choices[0].message.content)
return content // Could be malformed!
```

### MSW Mock Pattern:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{
        message: {
          content: JSON.stringify({
            title: 'Test Adventure',
            description: 'A thrilling adventure in the Witherwild...',
            frame: 'witherwild',
            scenes: [...]
          })
        }
      }]
    })
  })
]
```

### Validation:

```bash
test -f .claude/skills/llm-integration.md && echo "✅ Skill 5 created"
```

---

## 📝 **PHASE 7: DOCUMENTATION**

### Create Skills README

### File: `.claude/skills/README.md`

````markdown
# DaggerGM Claude Code Skills

This directory contains auto-applied skills that enforce code quality, security, and testing standards.

## Skills

1. **tenant-security.md** - User isolation security auditing
2. **code-quality.md** - 300-line limit and Next.js patterns
3. **vitest-patterns.md** - 90% coverage and integration-first testing
4. **nextjs-server-actions.md** - Server Actions patterns enforcement
5. **llm-integration.md** - OpenAI integration patterns with Zod validation

## Auto-Activation

Skills automatically activate when working with related code:

- `tenant-security.md` → Any database query or Server Action
- `code-quality.md` → All code changes, refactoring, new files
- `vitest-patterns.md` → Test files, test writing, coverage gaps
- `nextjs-server-actions.md` → Server Actions, API routes, mutations
- `llm-integration.md` → OpenAI calls, prompt engineering, LLM responses

## Running Validations

Each skill includes executable validation scripts in `scripts/`:

```bash
# Security audit
./scripts/security-audit.sh

# File size validation
./scripts/validate-file-size.sh

# Coverage validation
npm run test:coverage
```
````

## Integration with CLAUDE.md

Skills are referenced in CLAUDE.md under "Claude Code Skills (Auto-Applied)":

- Skills enforce standards documented in CLAUDE.md
- Use skills for automated enforcement, CLAUDE.md for explanation

````

### Validation:

```bash
test -f .claude/skills/README.md && echo "✅ Skills README created"
````

---

## 📝 **PHASE 8: UPDATE CLAUDE.MD**

### Update `.claude/skills/` section in CLAUDE.md:

```markdown
### ⚡ Claude Code Skills (Auto-Applied)

Skills are located in `.claude/skills/` and provide reusable enforcement patterns:

- **tenant-security.md** → User isolation security auditing (CRITICAL)
- **code-quality.md** → 300-line limit and Next.js patterns
- **vitest-patterns.md** → 90% coverage and integration-first testing
- **nextjs-server-actions.md** → Server Actions patterns (no Express routes)
- **llm-integration.md** → OpenAI integration with Zod validation
```

### Validation:

```bash
grep -q "tenant-security.md" CLAUDE.md && echo "✅ CLAUDE.md updated"
```

---

## 📝 **PHASE 9: CREATE VALIDATION SCRIPTS**

### Create `scripts/security-audit.sh`:

(Extract from tenant-security.md skill)

### Create `scripts/validate-file-size.sh`:

(Extract from code-quality.md skill)

### Validation:

```bash
test -x scripts/security-audit.sh && echo "✅ Security audit script created"
test -x scripts/validate-file-size.sh && echo "✅ File size validation script created"
```

---

## ✅ **FINAL VALIDATION**

### Comprehensive Validation Suite:

```bash
# 1. All skill files exist
ls -1 .claude/skills/*.md | wc -l
# Expected: 6 (5 skills + README)

# 2. README exists
test -f .claude/skills/README.md && echo "✅ README exists"

# 3. CLAUDE.md updated
grep -q "tenant-security.md" CLAUDE.md && echo "✅ CLAUDE.md updated"

# 4. Scripts exist and executable
test -x scripts/security-audit.sh && echo "✅ Security audit executable"
test -x scripts/validate-file-size.sh && echo "✅ File size validation executable"

# 5. Test security audit (should pass initially)
./scripts/security-audit.sh
```

---

## 🎯 **SUCCESS METRICS**

After completion:

- ✅ 5 skills created in `.claude/skills/`
- ✅ Skills README created
- ✅ CLAUDE.md updated with skills reference
- ✅ 2 validation scripts created and executable
- ✅ All validations pass

---

## 📚 **NEXT STEPS**

After skills are created:

1. **Test Skills**: Create intentional violations to verify detection
2. **Update CI/CD**: Add `./scripts/security-audit.sh` to GitHub Actions
3. **Team Training**: Document skill usage in team runbook
4. **Iterate**: Refine skills based on real-world usage

---

**Version**: 1.0
**Created**: 2025-10-23
**Execution Command**: `/execute-ops documentation/SETUP_skills.md`
**Estimated Duration**: 2-3 hours
**Reversible**: Yes (can delete skills directory)
