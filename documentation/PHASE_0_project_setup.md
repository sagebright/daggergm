# PHASE 0: Complete Project Setup

**Feature Type**: Infrastructure Setup
**Estimated Time**: 2-4 hours
**Prerequisites**: None (greenfield setup)
**Test Coverage Target**: N/A (infrastructure - validate with smoke tests)

---

## Overview

Phase 0 establishes the complete development infrastructure for DaggerGM rebuild:

- Next.js 15 + TypeScript (strict mode)
- Testing infrastructure (Vitest + Playwright + MSW)
- CI/CD pipeline (GitHub Actions)
- Git hooks (Husky + lint-staged)
- Project structure (features/, lib/, tests/)

**Success Criteria**:

- ✅ `npm run typecheck` passes (0 errors)
- ✅ `npm run lint` passes (0 errors/warnings)
- ✅ `npm run test -- --run` passes
- ✅ `npm run build` succeeds
- ✅ `npm run dev` starts on http://localhost:3000
- ✅ Git pre-commit hook works
- ✅ CI/CD pipeline configured

---

## Tasks

### Task 1: Backup & Safety

**What**: Create backup of current configuration

**Steps**:

```bash
# Create timestamped backup
mkdir -p .backups/phase-0-$(date +%Y%m%d-%H%M%S)
cp package.json tsconfig.json .backups/phase-0-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
```

**Validation**: Backup directory created

---

### Task 2: Next.js 15 Initialization

**What**: Initialize or update to Next.js 15

**Option A: Fresh Start (recommended if starting over)**:

```bash
# Remove old Next.js files
rm -rf .next

# Initialize Next.js 15
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*" \
  --use-npm
```

**Option B: Update existing project**:

```bash
npm install next@latest react@latest react-dom@latest
```

**Validation**:

```bash
cat package.json | grep '"next":'  # Should show ^15.
```

---

### Task 3: Install Core Dependencies

**What**: Install all required packages

**Steps**:

```bash
# Database & Auth
npm install @supabase/supabase-js@latest @supabase/ssr@latest

# AI & Validation
npm install openai@latest zod@latest

# UI Components
npx shadcn@latest init
npx shadcn@latest add button card input textarea select label

# State Management
npm install zustand@latest @tanstack/react-query@latest

# Payments
npm install stripe@latest @stripe/stripe-js@latest

# Development Tools
npm install -D \
  vitest@latest \
  @vitest/coverage-v8@latest \
  playwright@latest \
  @playwright/test@latest \
  msw@latest \
  @testing-library/react@latest \
  @testing-library/jest-dom@latest \
  @testing-library/user-event@latest \
  @vitejs/plugin-react@latest \
  eslint@^9 \
  prettier@latest \
  husky@latest \
  lint-staged@latest

# Install Playwright browsers
npx playwright install chromium firefox
```

**Validation**:

```bash
npm list --depth=0 | grep -E "(next|supabase|openai|vitest|playwright)"
```

---

### Task 4: Copy Configuration Files

**What**: Copy all config files from documentation

**Steps**:

```bash
# TypeScript
cp documentation/DaggerGM/tsconfig.json ./tsconfig.json

# ESLint
cp documentation/DaggerGM/eslint.config.mjs ./eslint.config.mjs

# Vitest
cp documentation/DaggerGM/vitest.config.ts ./vitest.config.ts

# Playwright
cp documentation/DaggerGM/playwright.config.ts ./playwright.config.ts

# Lint-staged
cp documentation/DaggerGM/.lintstagedrc.json ./.lintstagedrc.json
```

**Validation**:

```bash
npm run lint  # Should pass or show fixable issues
npx tsc --noEmit  # Should compile
```

---

### Task 5: Setup Testing Infrastructure

**What**: Setup Vitest + Playwright + MSW + Test Database

**Steps**:
Follow the comprehensive testing setup guide:

**Reference**: `documentation/DaggerGM/.claude/commands/setup-testing-infrastructure.md`

**Key steps**:

1. Setup PostgreSQL test database (local or Docker)
2. Create `.env.test.local`
3. Apply database schema
4. Create test setup files
5. Create test helpers
6. Validate with smoke tests

**Validation**:

```bash
npm run test -- --run  # Should run (may be 0 tests)
npm run test:e2e  # Should run Playwright
```

---

### Task 6: Setup Git Hooks

**What**: Configure Husky pre-commit hooks

**Steps**:

```bash
# Initialize Husky
npx husky init

# Copy pre-commit hook
cp documentation/DaggerGM/.husky/pre-commit ./.husky/pre-commit
chmod +x ./.husky/pre-commit
```

**Validation**:

```bash
# Test hook
echo "test" > test-file.ts
git add test-file.ts
git commit -m "test: verify hook"
# Should run lint-staged + typecheck
rm test-file.ts
```

---

### Task 7: Setup CI/CD Pipeline

**What**: Configure GitHub Actions

**Steps**:

```bash
# Copy workflow
mkdir -p .github/workflows
cp documentation/DaggerGM/.github/workflows/ci.yml ./.github/workflows/ci.yml
```

**Setup GitHub Secrets**:
Follow `documentation/DaggerGM/SECRETS_SETUP.md` for:

- Supabase test project
- Supabase production project
- Vercel deployment
- Optional: Snyk, Slack

**Validation**:

```bash
gh secret list  # Should show all 9 secrets (or required ones)
```

---

### Task 8: Create Project Structure

**What**: Create feature-based directory structure

**Steps**:

```bash
# Feature directories
mkdir -p src/features/{adventure,generation,credits,frames,export,guest}
mkdir -p src/features/adventure/{components,actions,hooks,schemas}
mkdir -p src/features/generation/{services,prompts,validators}
mkdir -p src/features/credits/{actions,hooks}
mkdir -p src/features/frames/{components,data}
mkdir -p src/features/export/{services,templates}
mkdir -p src/features/guest/{actions,hooks}

# Lib directories
mkdir -p src/lib/{supabase,openai,stripe,validators}
mkdir -p src/stores
mkdir -p src/components/ui
mkdir -p src/types

# Test directories
mkdir -p tests/{integration,e2e,helpers,mocks}
mkdir -p tests/integration/{auth,adventures,credits,guest}
mkdir -p tests/e2e/{smoke,flows}
```

**Validation**:

```bash
tree -L 3 src/
tree -L 2 tests/
```

---

### Task 9: Create Initial Files

**What**: Create root layout, providers, and essential files

**File 1: `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DaggerGM - AI Adventure Generator',
  description: 'Frame-aware adventure generation for Daggerheart TTRPG',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**File 2: `src/app/providers.tsx`**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**File 3: `src/app/page.tsx`**

```typescript
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">DaggerGM</h1>
      <p className="mt-4 text-lg text-gray-600">
        AI-powered adventure generator for Daggerheart TTRPG
      </p>
    </main>
  );
}
```

**File 4: `src/lib/validators/env.ts`**

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Invalid environment configuration')
  }
}

if (typeof window === 'undefined') {
  validateEnv()
}
```

**File 5: `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Validation**:

```bash
ls src/app/layout.tsx src/app/providers.tsx src/app/page.tsx src/lib/validators/env.ts .env.example
```

---

### Task 10: Create Documentation

**What**: Copy main development docs

**Steps**:

```bash
# Copy CLAUDE.md
cp documentation/DaggerGM/CLAUDE.md ./CLAUDE.md
```

**File: `README.md`**

```markdown
# DaggerGM - AI Adventure Generator

Frame-aware adventure generation for Daggerheart TTRPG.

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Supabase (PostgreSQL + RLS + Auth)
- OpenAI GPT-4
- shadcn/ui + Tailwind CSS
- Zustand + React Query
- Vitest + Playwright (90% coverage)

## Quick Start

\`\`\`bash
npm install
cp .env.example .env.local

# Fill in .env.local

npx supabase start
npm run dev
\`\`\`

## Development

See [CLAUDE.md](./CLAUDE.md) for complete guide.

## Testing

\`\`\`bash
npm test # Watch mode
npm run test:coverage # With coverage
npm run test:e2e # E2E tests
\`\`\`
```

**Validation**:

```bash
ls CLAUDE.md README.md
```

---

### Task 11: Final Validation

**What**: Run all validation checks

**Steps**:

```bash
# TypeScript compiles
npm run typecheck

# Linting passes
npm run lint

# Tests run
npm run test -- --run

# Build succeeds
npm run build

# Dev server starts
npm run dev &
sleep 5
curl http://localhost:3000
killall node
```

**Expected Results**:

- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors/warnings
- ✅ Tests pass (may be 0 tests)
- ✅ Build succeeds
- ✅ Dev server responds

---

### Task 12: Commit Initial Setup

**What**: Commit Phase 0 completion

**Steps**:

```bash
git add .
git commit -m "chore: Phase 0 complete - project setup

- Initialize Next.js 15 + TypeScript
- Configure testing (Vitest + Playwright)
- Setup CI/CD (GitHub Actions)
- Configure Git hooks (Husky)
- Create project structure
- Add documentation (CLAUDE.md, README.md)

Coverage target: 90%
Zero tolerance: 0 test failures, 0 lint errors

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

**Validation**:

```bash
# Monitor CI run
gh run watch
```

Expected: All CI jobs pass (lint, test-unit, test-e2e, build, security)

---

## Success Criteria Checklist

Phase 0 is complete when:

### Infrastructure

- [ ] Next.js 15 initialized
- [ ] All dependencies installed (0 vulnerabilities)
- [ ] TypeScript strict mode configured
- [ ] ESLint configured (300-line limit enforced)

### Testing

- [ ] Vitest configured (90% threshold)
- [ ] Playwright configured
- [ ] MSW configured for LLM mocking
- [ ] Test database setup
- [ ] Smoke tests pass

### Automation

- [ ] Git hooks working (pre-commit)
- [ ] CI/CD pipeline configured
- [ ] GitHub secrets configured
- [ ] First CI run passes

### Structure

- [ ] Project structure created (src/, tests/)
- [ ] Initial files created (layout, providers, etc.)
- [ ] Documentation in place (CLAUDE.md, README.md)

### Validation

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test -- --run` passes
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts
- [ ] Git commit pushed
- [ ] CI pipeline green

---

## Next Steps After Phase 0

1. **Phase 1: Database Setup** (2-3 days)
   - Preserve existing database schema
   - Generate TypeScript types
   - Verify RLS policies
   - Create Supabase client helpers

2. **Phase 2: Core Features** (2-3 weeks)
   - Use `/execute-feature` for each feature
   - Start with: User Authentication
   - Follow TDD workflow (RED → GREEN → REFACTOR)
   - Maintain 90% coverage

---

## Troubleshooting

### Issue: npm install fails with peer dependencies

**Solution**:

```bash
npm install --legacy-peer-deps
```

### Issue: TypeScript errors in shadcn components

**Solution**: These are usually from tailwind.config.ts - safe to ignore initially.

### Issue: Husky hook doesn't run

**Solution**:

```bash
rm -rf .husky
npx husky init
cp documentation/DaggerGM/.husky/pre-commit ./.husky/pre-commit
chmod +x ./.husky/pre-commit
```

### Issue: CI fails on first run

**Solution**: Check all GitHub secrets are configured:

```bash
gh secret list
```

---

**Document Version**: 1.0.0
**Created**: 2025-10-18
**Estimated Time**: 2-4 hours
**Coverage Target**: N/A (infrastructure)
**Next Phase**: Phase 1 - Database Setup
