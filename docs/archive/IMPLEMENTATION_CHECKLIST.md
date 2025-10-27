# DaggerGM Implementation Checklist

**Purpose**: Complete rebuild roadmap from scratch using modern Next.js 15 + TypeScript patterns.

**For**: The other Claude instance managing the DaggerGM project.

**Version**: 1.0.0 | **Date**: 2025-10-18

---

## Executive Summary

### Technology Stack: APPROVED ✅

After thorough analysis, the **Next.js 15 + TypeScript + Supabase** stack is the RIGHT choice for DaggerGM:

| Technology              | Verdict    | Why                                                                      |
| ----------------------- | ---------- | ------------------------------------------------------------------------ |
| **Next.js 15**          | ✅ Proceed | App Router + Server Actions perfect for content-heavy app with mutations |
| **TypeScript (Strict)** | ✅ Proceed | Critical for Supabase type generation + LLM validation                   |
| **Supabase**            | ✅ Proceed | RLS handles multi-tenancy, local dev via Docker, built-in auth           |
| **Server Actions**      | ✅ Proceed | Simpler than Express backend, built-in cache invalidation                |
| **Zustand**             | ✅ Proceed | Better than Context API for Focus Mode state (vs Jotai/Redux)            |
| **Vitest + Playwright** | ✅ Proceed | Modern testing stack, 99% coverage achievable                            |

### What Would I Change?

**NOTHING** - This stack is optimal for DaggerGM's requirements. The only alternative would be:

- **Remix** instead of Next.js (but Next.js 15 is more mature, better docs for first-time users)
- **Drizzle ORM** instead of Supabase client (but you lose RLS, worse DX)

---

## Phase 0: Project Setup (1-2 days)

### 0.1 Initialize Next.js 15 Project

```bash
npx create-next-app@latest daggergm \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*" \
  --use-npm

cd daggergm
```

**Validation**:

- [ ] `package.json` has Next.js ^15.0.0
- [ ] `tsconfig.json` has strict mode enabled
- [ ] `app/` directory exists (not `pages/`)

---

### 0.2 Install Core Dependencies

```bash
# Database & Auth
npm install @supabase/supabase-js

# AI & Validation
npm install openai zod

# UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea select

# State Management
npm install zustand @tanstack/react-query

# Payments
npm install stripe @stripe/stripe-js

# Development Tools
npm install -D \
  vitest @vitest/coverage-v8 \
  playwright @playwright/test \
  msw \
  @testing-library/react @testing-library/jest-dom \
  eslint@^9 prettier \
  husky lint-staged
```

**Validation**:

- [ ] `npm list` shows no vulnerabilities (or only low-severity)
- [ ] `package.json` matches versions in `documentation/DaggerGM/package.json` template

---

### 0.3 Configure TypeScript (Strict Mode)

Copy configuration from: `documentation/DaggerGM/tsconfig.json`

**Key settings**:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- Path aliases: `@/features/*`, `@/lib/*`, etc.

**Validation**:

```bash
npx tsc --noEmit
```

Expected: No errors (empty project compiles)

---

### 0.4 Configure ESLint (Flat Config)

Copy configuration from: `documentation/DaggerGM/eslint.config.mjs`

**Key rules**:

- `max-lines: 300` (file size limit)
- `@typescript-eslint/no-explicit-any: error`
- No `fetch()` to `/api` routes (use Server Actions)

**Validation**:

```bash
npm run lint
```

Expected: No errors

---

### 0.5 Setup Testing Infrastructure

Follow command: `documentation/DaggerGM/.claude/commands/setup-testing-infrastructure.md`

**Deliverables**:

- [ ] `vitest.config.ts` configured
- [ ] `playwright.config.ts` configured
- [ ] `tests/setup.ts` created
- [ ] `tests/helpers/testDb.ts` created
- [ ] `tests/helpers/mockLLM.ts` created
- [ ] Smoke tests pass: `npm run test -- --run`

---

### 0.6 Setup Git Hooks

```bash
npx husky init
```

Copy from: `documentation/DaggerGM/.husky/pre-commit`
Copy from: `documentation/DaggerGM/.lintstagedrc.json`

**Validation**:

```bash
git add .
git commit -m "test: verify pre-commit hook"
```

Expected: Lint + TypeScript check runs before commit

---

### 0.7 Setup CI/CD Pipeline

Copy from: `documentation/DaggerGM/.github/workflows/ci.yml`

**Secrets to add to GitHub**:

- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY`
- `TEST_SUPABASE_SERVICE_ROLE_KEY`
- `SNYK_TOKEN`
- `VERCEL_TOKEN`
- `SLACK_WEBHOOK_URL`

**Validation**:
Push to GitHub, verify CI runs:

```bash
gh run watch
```

---

## Phase 1: Database Setup (2-3 days)

### 1.1 Start Supabase Locally

```bash
npx supabase init
npx supabase start
```

**Validation**:

- [ ] Supabase Studio accessible: http://localhost:54323
- [ ] Postgres running on port 54322

---

### 1.2 Migrate Existing Schema

**PRESERVE EXACTLY** from current DaggerGM project:

- All table definitions
- All RLS policies
- All indexes
- Seed data (Witherwild frame, etc.)

Copy migrations from: `daggergm/supabase/migrations/`

```bash
npx supabase db reset  # Run all migrations
```

**Validation**:

- [ ] Run RLS audit: `npx tsx scripts/audit-rls.ts`
- [ ] Verify all tables have `tenant_id` column
- [ ] Verify RLS enabled on all tables

---

### 1.3 Generate TypeScript Types

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

**Validation**:

- [ ] `src/types/database.types.ts` exists
- [ ] No TypeScript errors: `npx tsc --noEmit`

**Add to package.json**:

```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --local > src/types/database.types.ts"
  }
}
```

---

### 1.4 Create Supabase Client Helpers

**File: `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export function getSupabaseServer() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )
}
```

**File: `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function getSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

**Validation**:

- [ ] Import in Server Component: No errors
- [ ] Import in Client Component: No errors

---

## Phase 2: Core Features (Iterative - 2-3 weeks)

### Feature Implementation Order

Implement features in this order (dependencies matter!):

1. **User Authentication** (2-3 days)
   - Supabase Auth integration
   - Login/signup pages
   - Auth middleware
   - Protected routes

2. **Guest System** (1-2 days)
   - Guest token generation
   - Guest credit tracking
   - Guest → authenticated conversion

3. **Credit System** (2-3 days)
   - Credit balance display
   - Atomic credit consumption (RPC function)
   - Stripe integration (purchase flow)

4. **Frame Management** (1 day)
   - Default frames (Witherwild, etc.)
   - Custom frame creation
   - Frame selector component

5. **LLM Integration** (3-4 days)
   - OpenAI client setup
   - Structured output validation (Zod)
   - Prompt templates
   - Error handling + retries
   - MSW mocking for tests

6. **Adventure Generation** (4-5 days)
   - Scaffold generation
   - Movement generation
   - Combat encounter generation
   - End-to-end generation flow

7. **Focus Mode** (3-4 days)
   - Zustand state management
   - Collapse/expand interactions
   - URL state sync
   - Mobile gestures (swipe)
   - Browser back button

8. **Adventure Editing** (2-3 days)
   - Regenerate movement
   - Edit movement manually
   - Optimistic updates

9. **Export** (2-3 days)
   - PDF export
   - Markdown export
   - Template rendering

---

### For EACH Feature: Use TDD Workflow

Follow command: `documentation/DaggerGM/.claude/commands/execute-feature.md`

**Steps for EVERY feature**:

1. **RED**: Write failing integration tests
2. **GREEN**: Implement minimal code to pass tests
3. **REFACTOR**: Improve code quality
4. **VERIFY**: Check coverage ≥99%

**Example: Implementing Credit Consumption**

#### Step 1: RED (Write Failing Test)

**File: `src/features/credits/actions/__tests__/consumeCredit.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { createTestUser, cleanupTestData } from '@/tests/helpers/testDb'
import { consumeCredit } from '../consumeCredit'

describe('consumeCredit (Integration)', () => {
  it('should atomically consume 1 credit', async () => {
    const user = await createTestUser({ credits: 5 })

    await consumeCredit(user.id)

    const supabase = getSupabaseServer()
    const { data } = await supabase.from('users').select('credits').eq('id', user.id).single()

    expect(data?.credits).toBe(4) // 5 - 1 = 4

    await cleanupTestData(user.id)
  })

  // Add more tests for edge cases...
})
```

**Run**: `npm run test:watch -- consumeCredit`
**Expected**: ❌ Test fails (function doesn't exist)

#### Step 2: GREEN (Implement)

**File: `src/features/credits/actions/consumeCredit.ts`**

```typescript
'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export async function consumeCredit(userId: string) {
  const supabase = getSupabaseServer()

  // Use RPC function for atomic update
  const { data, error } = await supabase.rpc('consume_credit', {
    user_id: userId,
  })

  if (error) {
    throw new Error('Failed to consume credit')
  }

  return data
}
```

**Run**: `npm run test:watch -- consumeCredit`
**Expected**: ✅ Test passes

#### Step 3: REFACTOR

- Add error handling for insufficient credits
- Add RLS tests
- Add optimistic UI updates

#### Step 4: VERIFY

```bash
npm run test:coverage -- consumeCredit
```

Expected: ≥99% coverage

---

## Phase 3: Integration & Polish (1 week)

### 3.1 E2E Testing

Write Playwright tests for critical flows:

1. **Guest Flow**:
   - Generate free adventure
   - Signup prompt after generation
   - Convert guest → authenticated

2. **Credit Purchase**:
   - Buy credits via Stripe
   - Credit balance updates
   - Generate adventure with purchased credits

3. **Focus Mode**:
   - Navigate to edit page
   - Collapse/expand movements
   - Regenerate movement
   - URL state sync

**File: `tests/e2e/guest-flow.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('guest can generate free adventure', async ({ page }) => {
  await page.goto('/')

  await page.click('[data-testid="generate-free"]')

  await page.fill('[name="title"]', 'Test Adventure')
  await page.selectOption('[name="frame"]', 'Witherwild')
  await page.click('[type="submit"]')

  // Wait for generation
  await expect(page.locator('[data-testid="adventure-title"]')).toContainText('Test Adventure')

  // Verify signup prompt shown
  await expect(page.locator('[data-testid="signup-prompt"]')).toBeVisible()
})
```

**Validation**:

```bash
npm run test:e2e
```

Expected: All E2E tests pass

---

### 3.2 Performance Optimization

#### Database Indexes

Verify indexes exist for:

- `adventures.user_id`
- `adventures.tenant_id`
- `movements.adventure_id`
- `movements.tenant_id`

#### Bundle Size

Check Next.js build output:

```bash
npm run build
```

**Target**: First Load JS < 300KB

If over, use:

- Dynamic imports: `const Component = dynamic(() => import('./Component'))`
- Route-based code splitting (App Router does this automatically)

#### Lighthouse Audit

```bash
npx lighthouse http://localhost:3000 --view
```

**Targets**:

- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

---

### 3.3 Security Audit

#### Run RLS Verification

Follow skill: `documentation/DaggerGM/.claude/skills/rls-verification/SKILL.md`

```bash
npm run test -- rls
npx tsx scripts/audit-rls.ts
```

**Validation**:

- [ ] All RLS tests pass
- [ ] Audit script passes
- [ ] Manual SQL verification completed

#### Environment Variable Audit

Run validation:

```typescript
import { validateEnv } from '@/lib/validators/env'

validateEnv() // Throws if any required vars missing
```

#### Dependency Audit

```bash
npm audit
npm audit fix
```

**Target**: Zero high/critical vulnerabilities

---

## Phase 4: Documentation (2-3 days)

### 4.1 Update CLAUDE.md

Customize `documentation/DaggerGM/CLAUDE.md` for your project:

- Add project-specific patterns discovered
- Document common pitfalls encountered
- Update command examples

### 4.2 Create Feature Documentation

For each major feature, create:

- `documentation/FEATURE_NAME.md`
- Architecture diagrams (optional but helpful)
- API reference for Server Actions

### 4.3 Create Deployment Guide

**File: `documentation/DEPLOYMENT.md`**

- Vercel deployment steps
- Environment variable setup
- Supabase production setup
- Stripe production setup
- Monitoring setup (Sentry, LogRocket, etc.)

---

## Phase 5: Deployment (1 day)

### 5.1 Setup Production Supabase

1. Create Supabase project: https://supabase.com/dashboard
2. Run migrations:

```bash
npx supabase db push
```

3. Setup RLS policies (verify with audit script)

### 5.2 Setup Vercel

1. Connect GitHub repo
2. Add environment variables
3. Deploy

```bash
vercel --prod
```

### 5.3 Setup Stripe Webhooks

1. Create webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
2. Add webhook secret to env vars
3. Test with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Phase 6: Post-Launch (Ongoing)

### 6.1 Monitoring

Setup:

- **Error tracking**: Sentry
- **Analytics**: Vercel Analytics + Plausible
- **Logs**: Axiom or Better Stack

### 6.2 Performance Monitoring

Track:

- LLM API costs (OpenAI dashboard)
- Database query performance (Supabase logs)
- Bundle size (Vercel build output)
- Lighthouse scores (weekly)

### 6.3 Iterative Improvements

Based on user feedback:

- Refine prompts for better LLM output
- Optimize database queries
- Add new features (real-time collab? adventure sharing?)

---

## Validation Checklist (Before Launch)

### Code Quality

- [ ] All files <300 lines
- [ ] No TypeScript `any` types
- [ ] No console.logs in production code
- [ ] ESLint passes: `npm run lint`
- [ ] Prettier formatted: `npm run format`

### Testing

- [ ] Unit tests: ≥99% coverage
- [ ] Integration tests: ≥99% coverage
- [ ] E2E tests: All critical flows covered
- [ ] RLS tests: All policies verified
- [ ] CI/CD: All jobs passing

### Performance

- [ ] Lighthouse score >90 (all categories)
- [ ] First Load JS <300KB
- [ ] LCP <2.5s
- [ ] CLS <0.1

### Security

- [ ] RLS audit passes
- [ ] Environment variables validated
- [ ] API keys server-only
- [ ] Guest tokens expire after 24h
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities (Zod sanitization)

### Documentation

- [ ] CLAUDE.md up to date
- [ ] Feature docs complete
- [ ] Deployment guide written
- [ ] API reference complete

---

## Common Pitfalls (Next.js 15)

### 1. Server Component vs Client Component

**Symptom**: "You're importing a component that needs useState. It only works in a Client Component..."

**Solution**: Add `'use client'` at top of file

```typescript
'use client' // <-- Add this

import { useState } from 'react'
```

### 2. Environment Variables Not Available

**Symptom**: `process.env.MY_VAR` is undefined in browser

**Solution**: Add `NEXT_PUBLIC_` prefix for client-side vars

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...  # ✅ Available in browser
SUPABASE_SERVICE_ROLE_KEY=... # ❌ Server-only
```

### 3. Server Actions Not Working

**Symptom**: "Error: Functions cannot be passed directly to Client Components..."

**Solution**: Add `'use server'` directive

```typescript
'use server' // <-- Add this

export async function myAction() {
  // ...
}
```

### 4. TypeScript Errors After Schema Change

**Symptom**: Type errors after database migration

**Solution**: Regenerate types

```bash
npm run db:types
```

### 5. Tests Failing in CI but Passing Locally

**Symptom**: Tests pass on Mac but fail in GitHub Actions

**Solution**: Common causes:

- Timezone differences (use UTC in tests)
- Race conditions (use `waitFor` in React Testing Library)
- Database state (ensure cleanup in `afterEach`)

---

## Questions & Answers

### Q: Should we use Next.js 14 or 15?

**A**: Next.js 15. Stable as of October 2024, React 19 support, improved caching.

### Q: What if we hit the 300-line file limit?

**A**: Refactor into smaller modules. Example:

```
src/features/generation/services/scaffoldGenerator.ts (280 lines)

Split into:
├── scaffoldGenerator.ts (150 lines) - Main logic
├── scaffoldPrompts.ts (80 lines) - Prompt templates
└── scaffoldValidators.ts (50 lines) - Zod schemas
```

### Q: How do we handle LLM rate limits?

**A**: Implement exponential backoff in `src/lib/openai/retry.ts`:

```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429) {
        await sleep(2 ** i * 1000) // 1s, 2s, 4s
        continue
      }
      throw error
    }
  }
}
```

### Q: What if Zustand gets too complex for Focus Mode?

**A**: Consider Jotai for atomic state, or keep Zustand and split into multiple stores:

```typescript
// stores/focusMode.ts
export const useFocusMode = create(...);

// stores/generation.ts
export const useGenerationProgress = create(...);
```

### Q: How do we prevent LLM hallucinations in adventures?

**A**: Structured outputs + Zod validation catches malformed responses:

```typescript
const MovementSchema = z.object({
  description: z.string().min(50).max(500),
  npcs: z.array(NPCSchema).min(1).max(5),
  rewards: z.array(z.string()).min(1),
})

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  response_format: { type: 'json_object' },
})

const validated = MovementSchema.parse(JSON.parse(response.content))
```

---

## Resources

### Documentation

- **Next.js 15**: https://nextjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Supabase**: https://supabase.com/docs
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

### Example Projects

- **Next.js + Supabase**: https://github.com/vercel/next.js/tree/canary/examples/with-supabase
- **shadcn/ui templates**: https://ui.shadcn.com/examples

### Community

- **Next.js Discord**: https://nextjs.org/discord
- **Supabase Discord**: https://supabase.com/discord

---

## Final Checklist

Before handing off to production:

### Development

- [ ] All features implemented per requirements
- [ ] TDD workflow followed for all features
- [ ] Coverage ≥99%
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] RLS tests pass
- [ ] Manual QA completed

### Performance

- [ ] Lighthouse scores >90
- [ ] Bundle size <300KB
- [ ] Database indexes optimized
- [ ] LLM costs monitored

### Security

- [ ] RLS audit passed
- [ ] Environment variables validated
- [ ] API keys server-only
- [ ] No vulnerabilities (npm audit)

### Documentation

- [ ] CLAUDE.md complete
- [ ] Feature docs written
- [ ] Deployment guide written
- [ ] API reference complete

### Deployment

- [ ] Production Supabase setup
- [ ] Vercel deployment configured
- [ ] Stripe webhooks configured
- [ ] Monitoring setup (Sentry, etc.)

---

**Checklist Version**: 1.0.0
**Last Updated**: 2025-10-18
**Maintainer**: DaggerGM Team
**Estimated Timeline**: 6-8 weeks for MVP

**Good luck with the rebuild!** 🚀

---

## Appendix: File Structure Reference

```
daggergm/
├── src/
│   ├── app/                          # Next.js App Router
│   ├── features/                     # Feature modules (see Phase 2)
│   ├── lib/                          # Shared utilities
│   ├── stores/                       # Zustand stores
│   ├── components/                   # Shared UI
│   └── types/                        # Global types
├── tests/
│   ├── e2e/                          # Playwright
│   ├── integration/                  # Vitest integration
│   └── helpers/                      # Test utilities
├── documentation/
│   ├── ARCHITECTURE.md
│   ├── TESTING_STRATEGY.md
│   ├── LLM_INTEGRATION.md
│   ├── FOCUS_MODE.md
│   └── STATE_MANAGEMENT_DECISION.md
├── .claude/
│   ├── commands/
│   │   ├── setup-testing-infrastructure.md
│   │   ├── execute-feature.md
│   │   └── verify-rls.md
│   └── skills/
│       ├── rls-verification/
│       ├── llm-integration/
│       └── focus-mode-testing/
├── CLAUDE.md
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

This is your complete roadmap. Follow it phase by phase, and you'll have a production-ready DaggerGM in 6-8 weeks. 🎉
