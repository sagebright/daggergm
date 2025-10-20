# 🎯 CLAUDE.md - DaggerGM AI Development Guide

## 🚨 CRITICAL - READ FIRST

### Development Workflow (MANDATORY):

```bash
☐ Work in feature/* branches
☐ Write tests BEFORE code (TDD: RED → GREEN → REFACTOR)
☐ Run npm run test:watch during development
☐ Verify coverage: npm run test:coverage (must be ≥90%)
☐ Push to GitHub for CI/CD validation
☐ Monitor with: gh run watch
```

### Tech Stack (First Next.js + TypeScript Project!)

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript (strict mode)
- **Backend**: Next.js Server Actions (NO separate Express server)
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **AI**: OpenAI GPT-4 (structured outputs with Zod validation)
- **UI**: shadcn/ui components
- **State**: Zustand (Focus Mode) + React Query (server state)
- **Testing**: Vitest (80% integration) + Playwright (15% E2E) + 5% unit
- **Payments**: Stripe (one-time credit purchases)

---

## 🔄 Project Context

**DaggerGM** is an AI-powered adventure generator for Daggerheart TTRPG

- **Domain**: Frame-aware adventure generation with Focus Mode editing
- **Users**: Game Masters creating 1-3 hour sessions
- **Business Model**: Credits (not subscriptions) - 1 credit = 1 adventure
- **Architecture**: Multi-tenant with guest access (no auth required for first adventure)
- **Target Coverage**: 90% lines/functions/statements/branches (100% for security-critical code)

---

## 🚦 TASK ROUTING

### 🏗️ Development Workflows

- **Test-Driven Development** → `documentation/TESTING_STRATEGY.md`
- **Focus Mode Implementation** → `documentation/FOCUS_MODE.md`
- **LLM Integration** → `documentation/LLM_INTEGRATION.md`
- **RLS Security** → `.claude/skills/rls-verification/SKILL.md`

### 📚 Technical References

- **Architecture Overview** → `documentation/ARCHITECTURE.md`
- **Server Actions Patterns** → `documentation/SERVER_ACTIONS.md`
- **State Management (Zustand)** → `documentation/STATE_MANAGEMENT_DECISION.md`
- **Type Generation** → `.claude/commands/generate-types.md`

### 🤖 Slash Commands (Automation)

- `/setup-testing` → Initialize test infrastructure
- `/execute-feature` → Implement feature with TDD workflow
- `/verify-rls` → Audit RLS policies for security
- `/generate-types` → Regenerate TypeScript types from Supabase schema

### ⚡ Claude Code Skills (Auto-Applied)

Skills are located in `.claude/skills/` and provide reusable testing/validation patterns:

- **llm-integration/** → MSW mocking patterns for OpenAI
- **rls-verification/** → Automated RLS policy testing
- **focus-mode-testing/** → E2E patterns for Focus Mode UX

---

## ⚡ QUICK PATTERNS (Critical Rules)

### 🔐 Security & Multi-tenancy (ALWAYS):

- **All database queries**: Include `tenant_id` filter (tenant = user in DaggerGM)
- **All mutations**: Use Server Actions (NEVER client-side fetch to /api)
- **API keys**: Server-only (validate with `src/lib/validators/env.ts`)
- **Guest tokens**: 24-hour expiry, single-use, no PII storage
- **RLS testing**: Required for every new database operation

### 🎨 UI Component Standards:

- **Components**: Use shadcn/ui exclusively (no custom HTML)
- **State**: Zustand for Focus Mode, React Query for server data
- **Responsive**: Mobile-first (card resellers use phones/tablets)
- **Accessibility**: ARIA labels, keyboard navigation
- **File limit**: 300 lines max (refactor beyond this)

### 📏 Code Quality (ENFORCE):

- **TypeScript**: Strict mode (see `tsconfig.json`)
- **File size**: 300 lines max (ESLint enforced)
- **Test coverage**: 90% minimum (CI blocks merge if below)
- **Security-critical**: 100% coverage (credits, RLS, guest tokens)
- **Zero tolerance**: 0 test failures, 0 lint errors/warnings
- **Imports**: Use path aliases (`@/features`, `@/lib`, etc.)
- **Naming**: `camelCase` for variables, `PascalCase` for components/types

### 🧪 Testing Requirements (TDD):

- **Write tests FIRST**: RED → GREEN → REFACTOR
- **Distribution**: 80% integration / 15% E2E / 5% unit
- **Real database**: Always use test Supabase instance (never mock DB)
- **Mock LLM**: Use MSW to mock OpenAI responses
- **Coverage gate**: CI fails if coverage < 90%
- **Security code**: 100% coverage required (credits, RLS, auth)
- **Quick validation**: `npm run test:watch` during development

### 🤖 LLM Integration:

- **Structured outputs**: Always use Zod schemas for validation
- **Temperature settings**:
  - Scaffold: 0.7 (creative but coherent)
  - Combat: 0.5 (mechanical accuracy)
  - Dialogue: 0.9 (personality)
  - Description: 0.8 (vivid)
- **Cost management**: Cache prompts, monitor token usage
- **Error handling**: Retry with exponential backoff (3 attempts max)
- **Validation**: Never trust LLM output without Zod validation

### ⚠️ Next.js Specific Gotchas:

- **Server Components**: Default in App Router (no `useState`, `useEffect`)
- **Client Components**: Add `'use client'` directive at top of file
- **Server Actions**: Add `'use server'` directive at top of file
- **Environment vars**: `NEXT_PUBLIC_` prefix for client-side access
- **Middleware**: Runs on Edge runtime (limited Node.js APIs)
- **Streaming**: Use `<Suspense>` for progressive rendering

---

## 🔧 ESSENTIAL COMMANDS

### Development Workflow:

```bash
npm run dev                 # Start Next.js dev server (port 3000)
npm run test:watch          # Watch mode for TDD (auto-runs affected tests)
npm run test:coverage       # Full coverage report (must be ≥90%)
npm run test:e2e            # Run Playwright E2E tests
npm run lint                # ESLint + TypeScript check
npm run format              # Prettier format all files
```

### Database Management:

```bash
npm run db:start            # Start local Supabase (Docker)
npm run db:migrate          # Run migrations
npm run db:seed             # Seed test data
npm run db:reset            # Reset test database
npm run db:types            # Generate TypeScript types from schema
```

### CI/CD Workflow:

```bash
git checkout -b feature/[description]    # Create feature branch
npm run test:coverage                    # Verify tests pass
git push origin feature/[description]    # Trigger CI/CD
gh run watch                             # Monitor GitHub Actions
```

---

## 📚 DETAILED REFERENCES

### File Organization (Feature-Based):

```
src/
├── app/                     # Next.js App Router (routes)
├── features/                # Feature modules (self-contained)
│   ├── adventure/           # Adventure CRUD + Focus Mode
│   ├── generation/          # LLM generation logic
│   ├── credits/             # Credit system
│   ├── frames/              # Frame management
│   ├── export/              # PDF/Markdown export
│   └── guest/               # Guest user flows
├── lib/                     # Shared utilities
│   ├── supabase/            # Database clients
│   ├── openai/              # LLM client + retry logic
│   ├── stripe/              # Payment processing
│   └── validators/          # Runtime validation (env, Zod)
├── stores/                  # Zustand stores
├── components/              # Shared UI components
└── types/                   # Global TypeScript types
```

### Critical Project Alerts:

- **First Next.js project**: Expect learning curve with App Router
- **First TypeScript project**: Strict mode is challenging but worth it
- **Server Actions**: Replaces traditional API routes (different mental model)
- **Focus Mode complexity**: Most sophisticated UX feature (needs E2E tests)
- **Guest system**: Requires careful token management (security risk if wrong)

### Common Pitfalls (Next.js):

1. **Using client hooks in Server Components** → Add `'use client'` directive
2. **Accessing `window` in Server Actions** → Server-only code (no browser APIs)
3. **Forgetting NEXT*PUBLIC* prefix** → Env vars won't be exposed to client
4. **Mocking database in tests** → Always use real test database (catches RLS bugs)
5. **Not validating LLM output** → AI can return malformed data (use Zod!)

---

## 🎯 Development Approach

### When Starting a New Feature:

1. **Understand requirements** → Ask questions if unclear
2. **Write failing test first** → TDD workflow (RED)
3. **Implement minimal code** → Make test pass (GREEN)
4. **Refactor** → Improve while keeping tests green
5. **Verify coverage** → `npm run test:coverage` (must be ≥90%)
6. **Push to CI/CD** → GitHub Actions validates everything

### When Debugging:

1. **Check TypeScript errors** → `npx tsc --noEmit`
2. **Review test failures** → `npm run test:watch`
3. **Inspect database** → Supabase Studio (http://localhost:54323)
4. **Check RLS policies** → Use `/verify-rls` command
5. **Review LLM calls** → Check MSW mock handlers

### When Stuck:

- **TypeScript errors** → Check `tsconfig.json` and path aliases
- **Database errors** → Verify RLS policies with `assertRlsBlocks` helper
- **LLM errors** → Validate response with Zod schema
- **Test failures** → Check if mocking external services (not DB!)
- **Build errors** → Verify environment variables (`src/lib/validators/env.ts`)

---

## 📋 DOCUMENTATION UPDATES

When updating documentation:

1. Update version date at bottom of file
2. Create backup: `documentation/archive/FILENAME_YYYY-MM-DD.md`
3. Update this hub if routing changes
4. Run `/verify-docs` command to check broken links

---

## 🎓 LEARNING RESOURCES

### Next.js 15 (App Router):

- Official Docs: https://nextjs.org/docs
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Streaming: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

### TypeScript (Strict Mode):

- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Zod Validation: https://zod.dev/

### Supabase + Next.js:

- Integration Guide: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security

### Testing:

- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- MSW (API Mocking): https://mswjs.io/

---

**Version**: 2025-10-18
**Project Phase**: Rebuild from scratch
**Team Experience**: First Next.js project, first TypeScript project
**Previous Version**: N/A (new project)

**Major Decisions**:

- Next.js 15 over Express (simplifies stack)
- TypeScript strict mode (quality over speed)
- Server Actions over API routes (Next.js best practice)
- Zustand over Context API (Focus Mode complexity)
- 90% coverage target with zero tolerance (realistic for first Next.js/TypeScript project)
