# Execute Phase 0: Project Setup

**Purpose**: Complete initial project setup for DaggerGM rebuild (Next.js 15 + TypeScript + Supabase).

**Estimated Time**: 2-4 hours

**Prerequisites**:

- [ ] You've reviewed `documentation/DaggerGM/README.md`
- [ ] You've read `documentation/DaggerGM/IMPLEMENTATION_CHECKLIST.md` Phase 0
- [ ] You're ready to start fresh (this will overwrite existing setup)

---

## What This Command Does

This command executes Phase 0 from the Implementation Checklist:

1. Initialize Next.js 15 project
2. Install core dependencies
3. Configure TypeScript (strict mode)
4. Configure ESLint (flat config with 300-line limit)
5. Setup testing infrastructure (Vitest + Playwright + MSW)
6. Configure Git hooks (Husky + lint-staged)
7. Setup CI/CD pipeline (GitHub Actions)
8. Create initial documentation structure

**Result**: Production-ready Next.js 15 project with testing, linting, and CI/CD configured.

---

## Safety Checks

### Before Proceeding

This command will:

- ⚠️ Create/overwrite `tsconfig.json`
- ⚠️ Create/overwrite `eslint.config.mjs`
- ⚠️ Create/overwrite `vitest.config.ts`
- ⚠️ Create/overwrite `playwright.config.ts`
- ⚠️ Install ~30 npm packages
- ⚠️ Create `.github/workflows/ci.yml`
- ⚠️ Create `.husky/pre-commit` hook

**Are you sure?** Type "yes" to proceed, or provide custom project name.

---

## Execution Steps

### Step 1: Project Initialization

#### 1.1 Check Current Directory

```bash
pwd  # Verify you're in /Users/jmfk/Repos/daggergm
```

#### 1.2 Backup Existing Configuration (if needed)

```bash
# Create backup of current config
mkdir -p .backups/phase-0-backup-$(date +%Y%m%d-%H%M%S)
cp -r package.json tsconfig.json eslint.config.* .backups/phase-0-backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
```

#### 1.3 Initialize Next.js 15

**Option A: Fresh Start (Recommended if starting over)**

```bash
# Remove existing Next.js files (CAREFUL!)
rm -rf .next app pages src components public styles

# Initialize Next.js 15
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*" \
  --use-npm

# Answer prompts:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - `src/` directory: Yes
# - App Router: Yes
# - Turbopack: No (not stable yet)
# - Import alias: @/* (default)
```

**Option B: Use Existing Next.js Project**

```bash
# Just update to latest Next.js 15
npm install next@latest react@latest react-dom@latest
```

**Validation**:

```bash
cat package.json | grep '"next":'  # Should show 15.x.x
```

---

### Step 2: Install Core Dependencies

#### 2.1 Database & Auth

```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```

#### 2.2 AI & Validation

```bash
npm install openai@latest zod@latest
```

#### 2.3 UI Components

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add core components
npx shadcn@latest add button card input textarea select label
```

#### 2.4 State Management

```bash
npm install zustand@latest @tanstack/react-query@latest
```

#### 2.5 Payments

```bash
npm install stripe@latest @stripe/stripe-js@latest
```

#### 2.6 Development Tools

```bash
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
```

**Validation**:

```bash
npm list --depth=0 | grep -E "(next|supabase|openai|vitest|playwright)"
```

---

### Step 3: Copy Configuration Files

#### 3.1 TypeScript Configuration

```bash
cp documentation/DaggerGM/tsconfig.json ./tsconfig.json
```

**Verify strict mode**:

```bash
cat tsconfig.json | grep '"strict"'  # Should show true
```

#### 3.2 ESLint Configuration

```bash
cp documentation/DaggerGM/eslint.config.mjs ./eslint.config.mjs
```

**Test linting**:

```bash
npm run lint
```

#### 3.3 Vitest Configuration

```bash
cp documentation/DaggerGM/vitest.config.ts ./vitest.config.ts
```

#### 3.4 Playwright Configuration

```bash
cp documentation/DaggerGM/playwright.config.ts ./playwright.config.ts
```

**Install browsers**:

```bash
npx playwright install chromium firefox
```

#### 3.5 Lint-Staged Configuration

```bash
cp documentation/DaggerGM/.lintstagedrc.json ./.lintstagedrc.json
```

---

### Step 4: Setup Testing Infrastructure

#### 4.1 Run Setup Command

Use the comprehensive setup-testing-infrastructure command:

```bash
# This will be executed by running another slash command
# For now, verify prerequisites:
which psql  # PostgreSQL should be installed
which docker  # OR Docker should be available
npx supabase --version  # Supabase CLI should be installed
```

**Then execute**:

```
/setup-testing-infrastructure
```

(This delegates to the comprehensive testing setup command we just enhanced)

---

### Step 5: Setup Git Hooks

#### 5.1 Initialize Husky

```bash
npx husky init
```

#### 5.2 Copy Pre-Commit Hook

```bash
cp documentation/DaggerGM/.husky/pre-commit ./.husky/pre-commit
chmod +x ./.husky/pre-commit
```

#### 5.3 Test Hook

```bash
# Create dummy file to test
echo "test" > test-file.ts
git add test-file.ts
git commit -m "test: verify pre-commit hook"
# Should run lint-staged and typecheck
rm test-file.ts
```

---

### Step 6: Setup CI/CD Pipeline

#### 6.1 Copy GitHub Actions Workflow

```bash
mkdir -p .github/workflows
cp documentation/DaggerGM/.github/workflows/ci.yml ./.github/workflows/ci.yml
```

#### 6.2 Setup GitHub Secrets

Follow the comprehensive guide:

**Read**: `documentation/DaggerGM/SECRETS_SETUP.md`

**Quick checklist**:

- [ ] Create Supabase test project
- [ ] Create Supabase production project
- [ ] Create Vercel project
- [ ] Add all secrets to GitHub
- [ ] Verify with: `gh secret list`

---

### Step 7: Create Project Structure

#### 7.1 Create Feature Directories

```bash
mkdir -p src/features/{adventure,generation,credits,frames,export,guest}
mkdir -p src/features/adventure/{components,actions,hooks,schemas}
mkdir -p src/features/generation/{services,prompts,validators}
mkdir -p src/features/credits/{actions,hooks}
mkdir -p src/features/frames/{components,data}
mkdir -p src/features/export/{services,templates}
mkdir -p src/features/guest/{actions,hooks}
```

#### 7.2 Create Lib Directories

```bash
mkdir -p src/lib/{supabase,openai,stripe,validators}
mkdir -p src/stores
mkdir -p src/components/ui
mkdir -p src/types
```

#### 7.3 Create Test Directories

```bash
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

### Step 8: Create Initial Files

#### 8.1 Create Root Layout

**File: `src/app/layout.tsx`**

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

#### 8.2 Create Providers

**File: `src/app/providers.tsx`**

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

#### 8.3 Create Home Page

**File: `src/app/page.tsx`**

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

#### 8.4 Create Environment Validator

**File: `src/lib/validators/env.ts`**

```typescript
import { z } from 'zod'

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // Server-only

  // OpenAI (required)
  OPENAI_API_KEY: z.string().startsWith('sk-'),

  // Stripe (required for production)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
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

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  validateEnv()
}
```

---

### Step 9: Create Documentation

#### 9.1 Copy Main CLAUDE.md

```bash
cp documentation/DaggerGM/CLAUDE.md ./CLAUDE.md
```

#### 9.2 Create README.md

**File: `README.md`**

```markdown
# DaggerGM - AI Adventure Generator

Frame-aware adventure generation for Daggerheart TTRPG.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Supabase (PostgreSQL + RLS + Auth)
- **AI**: OpenAI GPT-4
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand + React Query
- **Testing**: Vitest + Playwright (90% coverage target)
- **Payments**: Stripe

## Quick Start

\`\`\`bash

# Install dependencies

npm install

# Setup environment

cp .env.example .env.local

# Fill in .env.local with your secrets

# Start local Supabase

npx supabase start

# Run development server

npm run dev
\`\`\`

Visit http://localhost:3000

## Development

See [CLAUDE.md](./CLAUDE.md) for complete development guide.

## Testing

\`\`\`bash

# Run tests in watch mode

npm test

# Run with coverage

npm run test:coverage

# Run E2E tests

npm run test:e2e
\`\`\`

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Main development guide
- [documentation/DaggerGM/](./documentation/DaggerGM/) - Complete rebuild docs
- [documentation/DaggerGM/IMPLEMENTATION_CHECKLIST.md](./documentation/DaggerGM/IMPLEMENTATION_CHECKLIST.md) - Phase-by-phase guide

## License

Private - All Rights Reserved
```

#### 9.3 Create .env.example

**File: `.env.example`**

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
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

### Step 10: Final Validation

#### 10.1 Run All Checks

```bash
# TypeScript compiles
npm run typecheck

# Linting passes
npm run lint

# Tests run (might be 0 tests initially)
npm run test -- --run

# Build succeeds
npm run build

# Dev server starts
npm run dev &
sleep 5
curl http://localhost:3000
killall node
```

#### 10.2 Verify File Structure

```bash
# Should match this structure:
tree -L 2 -I 'node_modules|.next' .
```

Expected:

```
.
├── .github
│   └── workflows
├── .husky
│   └── pre-commit
├── documentation
│   └── DaggerGM
├── src
│   ├── app
│   ├── features
│   ├── lib
│   ├── stores
│   ├── components
│   └── types
├── tests
│   ├── integration
│   ├── e2e
│   └── helpers
├── CLAUDE.md
├── README.md
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

#### 10.3 Commit Initial Setup

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

#### 10.4 Trigger CI/CD

```bash
# Monitor first CI run
gh run watch
```

**Expected**: All jobs should pass (lint, test-unit, test-e2e, build, security)

---

## Success Criteria

Phase 0 is complete when:

- [✅] Next.js 15 project initialized
- [✅] All dependencies installed (0 vulnerabilities)
- [✅] TypeScript strict mode configured
- [✅] ESLint configured (300-line limit enforced)
- [✅] Testing infrastructure setup (Vitest + Playwright)
- [✅] Git hooks working (pre-commit runs lint + typecheck)
- [✅] CI/CD pipeline configured and passing
- [✅] Project structure created (features/, lib/, tests/)
- [✅] Documentation in place (CLAUDE.md, README.md)
- [✅] Development server runs: `npm run dev`
- [✅] Tests run: `npm test`
- [✅] Build succeeds: `npm run build`
- [✅] GitHub secrets configured
- [✅] First commit pushed and CI passes

---

## Next Steps

After Phase 0 completion:

1. **Phase 1: Database Setup** (2-3 days)
   - Preserve existing database schema
   - Generate TypeScript types
   - Verify RLS policies
   - Create Supabase client helpers

2. **Phase 2: Core Features** (2-3 weeks)
   - Use `/execute-feature` command for each feature
   - Follow TDD workflow (RED → GREEN → REFACTOR)
   - Maintain 90% coverage (100% for security-critical code)

3. **Phase 3: Integration & Polish** (1 week)
   - E2E tests
   - Performance optimization
   - Security audit

---

## Troubleshooting

### Issue: npm install fails with peer dependency errors

**Solution**:

```bash
npm install --legacy-peer-deps
```

### Issue: TypeScript errors in shadcn components

**Solution**: These are usually from tailwind.config.ts. Ignore for now, they'll be fixed when we add proper Tailwind setup.

### Issue: Husky hook doesn't run

**Solution**:

```bash
rm -rf .husky
npx husky init
cp documentation/DaggerGM/.husky/pre-commit ./.husky/pre-commit
chmod +x ./.husky/pre-commit
```

### Issue: CI fails on first run

**Solution**: Check GitHub secrets are all added:

```bash
gh secret list
```

---

**Command Version**: 1.0.0
**Last Updated**: 2025-10-18
**Estimated Time**: 2-4 hours
**Next Command**: `/setup-testing-infrastructure` (included in Phase 4 of this command)
