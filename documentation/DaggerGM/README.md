# DaggerGM Rebuild Documentation

**Version**: 1.0.0 | **Date**: 2025-10-18

This directory contains the complete implementation guide for rebuilding DaggerGM from scratch using Next.js 15 + TypeScript + Supabase.

---

## 📚 Documentation Index

### 🎯 Start Here

**[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - **READ THIS FIRST**

- Complete phase-by-phase rebuild roadmap
- Technology stack validation and justification
- Timeline: 6-8 weeks for MVP
- Includes code examples for every phase

---

### 🔧 Configuration Files (Copy These)

**Core Setup**:

- `tsconfig.json` - TypeScript strict mode configuration
- `eslint.config.mjs` - ESLint 9 flat config with DaggerGM rules
- `vitest.config.ts` - Vitest configuration (90% coverage target, 100% for security code)
- `playwright.config.ts` - Playwright E2E testing configuration
- `.lintstagedrc.json` - Pre-commit linting configuration

**Git Hooks**:

- `.husky/pre-commit` - Pre-commit validation script

**CI/CD**:

- `.github/workflows/ci.yml` - GitHub Actions pipeline

**Environment Validation**:

- `src/lib/validators/env.ts` - Runtime environment variable validation

---

### 📖 Technical Guides

**[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - Testing Philosophy & Patterns

- 80/15/5 distribution (Integration/E2E/Unit)
- TDD workflow (RED → GREEN → REFACTOR)
- Code examples for all test types
- MSW mocking patterns for LLM
- RLS testing methodology

**[STATE_MANAGEMENT_DECISION.md](./STATE_MANAGEMENT_DECISION.md)** - Zustand vs Jotai

- Why Zustand for Focus Mode
- Code examples for both approaches
- When to use each pattern

**[CLAUDE.md](./CLAUDE.md)** - Main Development Guide

- Tech stack overview
- Quick patterns (security, UI, code quality)
- Essential commands
- Common pitfalls (Next.js 15)
- Learning resources

---

### 🤖 Automation & Commands

**`.claude/commands/` - Executable Workflows**:

**[setup-testing-infrastructure.md](./.claude/commands/setup-testing-infrastructure.md)**

- Initialize Vitest + Playwright + MSW
- Create test setup files
- Verify infrastructure works

**[execute-feature.md](./.claude/commands/execute-feature.md)**

- TDD workflow for new features
- Step-by-step RED → GREEN → REFACTOR
- Coverage verification

**`.claude/skills/` - Reusable Testing Patterns**:

**[rls-verification/SKILL.md](./.claude/skills/rls-verification/SKILL.md)**

- Automated RLS policy testing
- Cross-tenant isolation verification
- Security audit scripts

---

### 🧪 Test Helpers

**[tests/helpers/testDb.ts](./tests/helpers/testDb.ts)**

- Database test utilities
- User/adventure creation helpers
- Cleanup functions
- RLS assertion helpers

**[tests/setup.ts](./tests/setup.ts)** (create this from template)

- MSW server setup
- Global test configuration
- Custom matchers

---

## 🚀 Quick Start Guide

### Step 1: Technology Validation

Read **IMPLEMENTATION_CHECKLIST.md** Section: "Executive Summary: Technology Stack Validation"

**Decision**: ✅ Proceed with Next.js 15 + TypeScript + Supabase (NO changes needed)

---

### Step 2: Phase 0 - Project Setup (2-4 hours)

**Option A: Automated (Recommended)**

```
/execute-phase-0
```

This slash command will:

- Initialize Next.js 15 project
- Install all dependencies (~30 packages)
- Configure TypeScript, ESLint, testing
- Setup Git hooks and CI/CD
- Create project structure
- Validate complete setup

**Option B: Manual**
Follow **IMPLEMENTATION_CHECKLIST.md** Phase 0:

1. Initialize Next.js 15 project
2. Install dependencies
3. Copy configuration files from this directory
4. Setup testing infrastructure
5. Configure Git hooks
6. Setup CI/CD pipeline

**Validation**:

```bash
npm run lint        # ✅ No errors
npm run test        # ✅ Tests pass
npx tsc --noEmit    # ✅ TypeScript compiles
```

---

### Step 3: Phase 1 - Database Setup (2-3 days)

Follow **IMPLEMENTATION_CHECKLIST.md** Phase 1:

1. Start Supabase locally
2. Migrate existing schema (PRESERVE exactly from current project)
3. Generate TypeScript types
4. Create Supabase client helpers
5. Run RLS audit

**Validation**:

```bash
npm run db:types             # ✅ Types generated
npx tsx scripts/audit-rls.ts # ✅ RLS audit passes
```

---

### Step 4: Phase 2 - Core Features (2-3 weeks)

For EACH feature, follow **`.claude/commands/execute-feature.md`**:

**Feature Order** (from IMPLEMENTATION_CHECKLIST.md Phase 2):

1. User Authentication
2. Guest System
3. Credit System
4. Frame Management
5. LLM Integration
6. Adventure Generation
7. Focus Mode
8. Adventure Editing
9. Export

**TDD Workflow for Each**:

1. **RED**: Write failing integration tests
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve code quality
4. **VERIFY**: Coverage ≥99%

**Example Command**:

```bash
# Start watch mode for TDD
npm run test:watch

# Check coverage after implementation
npm run test:coverage
```

---

### Step 5: Phase 3 - Integration & Polish (1 week)

Follow **IMPLEMENTATION_CHECKLIST.md** Phase 3:

1. Write E2E tests (Playwright)
2. Performance optimization (bundle size, Lighthouse)
3. Security audit (RLS verification, env validation)

**Validation**:

```bash
npm run test:e2e              # ✅ E2E tests pass
npm run build                 # ✅ Bundle size <300KB
npx lighthouse http://localhost:3000 # ✅ Score >90
```

---

### Step 6: Phase 4 - Documentation (2-3 days)

Update documentation based on learnings:

1. Customize CLAUDE.md for your project
2. Create feature documentation
3. Write deployment guide

---

### Step 7: Phase 5 - Deployment (1 day)

Follow **IMPLEMENTATION_CHECKLIST.md** Phase 5:

1. Setup production Supabase
2. Deploy to Vercel
3. Configure Stripe webhooks

---

## 📋 Key Decisions Summary

### Technology Stack

| Component | Choice              | Alternative Considered | Why Chosen                                         |
| --------- | ------------------- | ---------------------- | -------------------------------------------------- |
| Framework | Next.js 15          | Remix                  | Better docs, more mature for first Next.js project |
| Language  | TypeScript (strict) | JavaScript             | Type safety critical for Supabase + LLM            |
| Backend   | Server Actions      | Express                | Simpler, built-in with Next.js                     |
| Database  | Supabase            | Prisma + Postgres      | RLS handles multi-tenancy automatically            |
| State     | Zustand             | Jotai, Redux           | Right balance for Focus Mode complexity            |
| Testing   | Vitest + Playwright | Jest + Cypress         | Modern, faster, better DX                          |
| UI        | shadcn/ui           | Tailwind UI            | Free, composable, customizable                     |

### Architecture Patterns

- **Mutations**: Server Actions only (NO `/api` routes)
- **State Management**: Zustand (Focus Mode) + React Query (server state)
- **File Organization**: Feature-based (not layer-based)
- **File Size Limit**: 300 lines (ESLint enforced)
- **Test Coverage**: 99% lines/functions/statements, 97% branches
- **Test Distribution**: 80% integration / 15% E2E / 5% unit

### Security

- **RLS**: Enabled on ALL data tables
- **Tenant Isolation**: `tenant_id` on every query
- **API Keys**: Server-only (validated at runtime)
- **Guest Tokens**: 24-hour expiry, single-use

---

## 🎓 Learning Path (First Next.js/TypeScript Project)

### Week 1: Next.js 15 Fundamentals

- [ ] Read Next.js 15 docs: https://nextjs.org/docs
- [ ] Complete tutorial: https://nextjs.org/learn
- [ ] Understand App Router vs Pages Router
- [ ] Learn Server Components vs Client Components
- [ ] Master Server Actions pattern

### Week 2: TypeScript Strict Mode

- [ ] Read TypeScript Handbook: https://www.typescriptlang.org/docs/
- [ ] Understand Zod validation: https://zod.dev/
- [ ] Practice with Supabase type generation
- [ ] Learn to read TypeScript errors (they're verbose!)

### Week 3: Testing Philosophy

- [ ] Read TESTING_STRATEGY.md in this directory
- [ ] Set up Vitest: https://vitest.dev/
- [ ] Set up Playwright: https://playwright.dev/
- [ ] Practice TDD workflow (RED → GREEN → REFACTOR)

### Week 4: DaggerGM Domain

- [ ] Understand Frame-aware generation
- [ ] Design Focus Mode UX
- [ ] Plan LLM integration strategy
- [ ] Review guest user system requirements

---

## 🔍 Common Pitfalls & Solutions

### Pitfall 1: Server Component vs Client Component Confusion

**Symptom**: "You're importing a component that needs useState..."

**Solution**: Add `'use client'` directive at top of file

```typescript
'use client' // <-- Add this

import { useState } from 'react'
```

### Pitfall 2: Environment Variables Not Available

**Symptom**: `process.env.MY_VAR` is undefined in browser

**Solution**: Use `NEXT_PUBLIC_` prefix for client-side vars

```bash
NEXT_PUBLIC_SUPABASE_URL=...  # ✅ Available in browser
SUPABASE_SERVICE_ROLE_KEY=... # ❌ Server-only
```

### Pitfall 3: Tests Pass Locally but Fail in CI

**Symptom**: Tests pass on Mac but fail in GitHub Actions

**Solution**: Common causes:

- Timezone differences (use UTC in tests)
- Race conditions (use `waitFor` in React Testing Library)
- Database state (ensure cleanup in `afterEach`)

See **IMPLEMENTATION_CHECKLIST.md** Section: "Common Pitfalls" for full list.

---

## 📊 Progress Tracking Template

Use this to track your implementation progress:

### Phase 0: Project Setup

- [ ] Next.js 15 initialized
- [ ] Dependencies installed
- [ ] TypeScript configured (strict mode)
- [ ] ESLint configured
- [ ] Testing infrastructure setup
- [ ] Git hooks configured
- [ ] CI/CD pipeline setup

### Phase 1: Database Setup

- [ ] Supabase running locally
- [ ] Schema migrated (preserved from current project)
- [ ] TypeScript types generated
- [ ] Supabase client helpers created
- [ ] RLS audit passing

### Phase 2: Core Features (Track per feature)

- [ ] User Authentication (3 days)
- [ ] Guest System (2 days)
- [ ] Credit System (3 days)
- [ ] Frame Management (1 day)
- [ ] LLM Integration (4 days)
- [ ] Adventure Generation (5 days)
- [ ] Focus Mode (4 days)
- [ ] Adventure Editing (3 days)
- [ ] Export (3 days)

### Phase 3: Integration & Polish

- [ ] E2E tests written
- [ ] Performance optimized (Lighthouse >90)
- [ ] Security audit passed (RLS verified)

### Phase 4: Documentation

- [ ] CLAUDE.md customized
- [ ] Feature docs written
- [ ] Deployment guide created

### Phase 5: Deployment

- [ ] Production Supabase setup
- [ ] Vercel deployment configured
- [ ] Stripe webhooks configured
- [ ] Monitoring setup (Sentry, etc.)

---

## 🆘 Getting Help

### Documentation Issues

If something in this documentation is unclear:

1. Check **IMPLEMENTATION_CHECKLIST.md** for detailed examples
2. Review **TESTING_STRATEGY.md** for testing patterns
3. Check **CLAUDE.md** for quick reference patterns

### Technical Issues

- **Next.js**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Supabase**: https://supabase.com/docs
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

### Community Support

- **Next.js Discord**: https://nextjs.org/discord
- **Supabase Discord**: https://supabase.com/discord

---

## 📦 Deliverables Checklist

Before considering the rebuild complete:

### Code

- [ ] All features implemented per requirements
- [ ] TDD workflow followed for all features
- [ ] Coverage ≥99%
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All files <300 lines

### Testing

- [ ] Unit tests pass (5% of coverage)
- [ ] Integration tests pass (80% of coverage)
- [ ] E2E tests pass (15% of coverage)
- [ ] RLS tests pass (security critical)
- [ ] CI/CD pipeline green

### Performance

- [ ] Lighthouse scores >90 (all categories)
- [ ] Bundle size <300KB
- [ ] Database indexes optimized
- [ ] LLM costs monitored

### Security

- [ ] RLS audit passed
- [ ] Environment variables validated
- [ ] API keys server-only
- [ ] No npm audit vulnerabilities

### Documentation

- [ ] CLAUDE.md complete
- [ ] Feature docs written
- [ ] Deployment guide written
- [ ] API reference complete

---

## 🎉 Success Criteria

The rebuild is successful when:

1. **Functionality**: All features from original DaggerGM work correctly
2. **Quality**: 99% test coverage achieved
3. **Performance**: Lighthouse score >90, bundle size <300KB
4. **Security**: RLS audit passes, no vulnerabilities
5. **Maintainability**: All files <300 lines, TypeScript strict mode
6. **Deployment**: Successfully deployed to production

**Estimated Timeline**: 6-8 weeks for MVP with one developer

---

## 📞 Contact

**Documentation Maintainer**: Claude (Anthropic)
**Version**: 1.0.0
**Last Updated**: 2025-10-18
**Next Review**: After Phase 2 completion (capture lessons learned)

---

**Good luck with the rebuild!** 🚀

This is your first Next.js + TypeScript project, and you've chosen the RIGHT stack. Follow the checklist phase by phase, use TDD rigorously, and you'll have a production-ready DaggerGM in 6-8 weeks.

Remember: **Quality over speed**. The 99% coverage target and strict TypeScript mode will pay dividends in maintainability.

You've got this! 💪
