# Setup Testing Infrastructure

**Purpose**: Initialize complete testing infrastructure for DaggerGM with Vitest + Playwright + MSW + Test Database.

**When to use**:

- First time setting up the project
- After upgrading testing libraries
- When test infrastructure is broken
- Setting up a new development machine

**Estimated Time**: 30-45 minutes

---

## Prerequisites Check

Before starting, verify:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed or Docker available
- [ ] Supabase CLI installed (`npx supabase --version`)
- [ ] Project initialized with Next.js 15 (`package.json` exists)
- [ ] Git repository initialized (`git status` works)

---

## Phase 1: Install Dependencies

### 1.1 Check Existing Dependencies

```bash
npm list vitest @vitest/coverage-v8 playwright msw @testing-library/react @testing-library/jest-dom
```

### 1.2 Install Testing Packages

```bash
# Core testing
npm install -D vitest@^2.1.0 @vitest/coverage-v8@^2.1.0

# E2E testing
npm install -D playwright@^1.48.0 @playwright/test@^1.48.0

# API mocking
npm install -D msw@^2.4.0

# React testing
npm install -D @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.5.0 @testing-library/user-event@^14.5.2

# Utilities
npm install -D @vitejs/plugin-react@^4.3.0
```

### 1.3 Install Playwright Browsers

```bash
npx playwright install chromium firefox
```

**Validation**:

```bash
npx vitest --version   # Should show 2.1.0+
npx playwright --version   # Should show 1.48.0+
```

---

## Phase 2: Setup Test Database

### 2.1 Option A: Local PostgreSQL (Recommended)

**macOS (Homebrew)**:

```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create test database
createdb daggergm_test
```

**Linux (Ubuntu/Debian)**:

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql-14

# Start service
sudo service postgresql start

# Create test database
sudo -u postgres createdb daggergm_test
```

**Validation**:

```bash
psql -U postgres -d daggergm_test -c "SELECT version();"
```

### 2.2 Option B: Docker (Alternative)

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name daggergm-test-db \
  -e POSTGRES_PASSWORD=test_password \
  -e POSTGRES_DB=daggergm_test \
  -p 5433:5432 \
  supabase/postgres:15.1.0.117

# Verify running
docker ps | grep daggergm-test-db
```

**Validation**:

```bash
docker exec -it daggergm-test-db psql -U postgres -d daggergm_test -c "SELECT version();"
```

### 2.3 Create Test Environment File

**File: `.env.test.local`** (NOT committed to git)

```bash
# Test Database
DATABASE_URL=postgresql://postgres:test_password@localhost:5433/daggergm_test

# Test Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # From supabase status
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...      # From supabase status

# Mock API Keys (not real)
OPENAI_API_KEY=sk-test-mock-key
STRIPE_SECRET_KEY=sk_test_mock_key
```

**Add to `.gitignore`**:

```bash
echo ".env.test.local" >> .gitignore
```

### 2.4 Apply Database Schema

```bash
# Start local Supabase
npx supabase start

# Apply migrations to test database
DATABASE_URL=postgresql://postgres:test_password@localhost:5433/daggergm_test \
  npx supabase db push

# Verify tables created
psql -U postgres -h localhost -p 5433 -d daggergm_test -c "\dt"
```

**Expected**: Should show all tables (adventures, movements, etc.)

---

## Phase 3: Create Configuration Files

### 2. Create Test Setup Files

**File: `tests/setup.ts`**

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest'
import { llmServer } from './helpers/mockLLM'
import '@testing-library/jest-dom'

// Setup MSW for LLM mocking
beforeAll(() => {
  llmServer.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  llmServer.resetHandlers()
})

afterAll(() => {
  llmServer.close()
})

// Extend Vitest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
    }
  },
})
```

**File: `tests/helpers/mockLLM.ts`**
(See `documentation/TESTING_STRATEGY.md` for full implementation)

**File: `tests/helpers/testDb.ts`**
(Already created - see earlier in this checklist)

### 3. Create Playwright Global Setup

**File: `tests/e2e/global-setup.ts`**

```typescript
import { chromium, FullConfig } from '@playwright/test'
import { createTestUser } from '../helpers/testDb'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up Playwright test environment...')

  // Create a default test user for E2E tests
  const user = await createTestUser({
    email: 'e2e-test@example.com',
    credits: 100,
  })

  // Store user ID for tests to use
  process.env.E2E_TEST_USER_ID = user.id
  process.env.E2E_TEST_USER_EMAIL = user.email

  console.log('✅ Playwright test environment ready')
}

export default globalSetup
```

**File: `tests/e2e/helpers.ts`**

```typescript
import { Page } from '@playwright/test'
import { createTestAdventure as dbCreateAdventure } from '../helpers/testDb'

export async function login(page: Page, userId: string) {
  // Navigate to login page and authenticate
  await page.goto('/login')
  await page.fill('[name="email"]', process.env.E2E_TEST_USER_EMAIL!)
  await page.fill('[name="password"]', 'test-password-123')
  await page.click('[type="submit"]')
  await page.waitForURL('/adventures')
}

export async function createTestAdventure(options?: { userId?: string; movementCount?: number }) {
  return dbCreateAdventure({
    userId: options?.userId || process.env.E2E_TEST_USER_ID,
    movementCount: options?.movementCount || 3,
  })
}
```

### 4. Configure Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:affected": "vitest --changed",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

### 5. Verify Test Infrastructure

**Run basic test:**

```bash
npm run test -- --run
```

**Check coverage:**

```bash
npm run test:coverage
```

**Run E2E tests:**

```bash
npm run test:e2e
```

### 6. Create Sample Tests (Smoke Tests)

**File: `src/lib/utils/__tests__/sample.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'

describe('Test Infrastructure', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })
})
```

**File: `tests/e2e/smoke.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('should load homepage', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/DaggerGM/)
})
```

### 7. Validate Coverage Reporting

Run coverage and verify HTML report is generated:

```bash
npm run test:coverage
open coverage/index.html  # macOS
# OR
xdg-open coverage/index.html  # Linux
```

Verify coverage thresholds are enforced (90% minimum).

---

## Phase 4: Comprehensive Test Helpers

### 4.1 Create Advanced Test Database Helpers

**File: `tests/helpers/testDb.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Admin client (bypasses RLS for test setup)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Regular client (respects RLS)
export function getTestSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Create test user
export async function createTestUser(options?: { email?: string; credits?: number }) {
  const email = options?.email || `test-${Date.now()}@example.com`
  const password = 'test-password-123'

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    throw new Error('Failed to create test user: ' + authError?.message)
  }

  // Set credits
  if (options?.credits !== undefined) {
    await supabaseAdmin.from('user_credits').insert({
      user_id: authData.user.id,
      credits: options.credits,
    })
  }

  return {
    id: authData.user.id,
    email,
    password,
  }
}

// Create test adventure
export async function createTestAdventure(options?: {
  userId?: string
  guestToken?: string
  movementCount?: number
  title?: string
  frame?: string
}) {
  const userId = options?.userId || (await createTestUser()).id

  const { data: adventure, error } = await supabaseAdmin
    .from('adventures')
    .insert({
      user_id: options?.guestToken ? null : userId,
      tenant_id: options?.guestToken || userId,
      guest_token_id: options?.guestToken || null,
      title: options?.title || 'Test Adventure',
      frame: options?.frame || 'Witherwild',
    })
    .select()
    .single()

  if (error || !adventure) {
    throw new Error('Failed to create adventure: ' + error?.message)
  }

  // Create movements
  const movementCount = options?.movementCount || 3
  const movements = []

  for (let i = 0; i < movementCount; i++) {
    const { data: movement } = await supabaseAdmin
      .from('movements')
      .insert({
        adventure_id: adventure.id,
        tenant_id: adventure.tenant_id,
        order: i,
        description: `Test Movement ${i + 1}`,
      })
      .select()
      .single()

    if (movement) movements.push(movement)
  }

  return {
    adventure,
    movements,
    userId,
  }
}

// Create guest token
export async function createGuestToken() {
  const { data, error } = await supabaseAdmin
    .from('guest_tokens')
    .insert({
      credits_remaining: 1,
    })
    .select('token')
    .single()

  if (error || !data) {
    throw new Error('Failed to create guest token')
  }

  return { token: data.token }
}

// Cleanup functions
export async function cleanupTestData(userId: string) {
  // Delete in correct order (respect foreign keys)
  await supabaseAdmin.from('movements').delete().eq('tenant_id', userId)
  await supabaseAdmin.from('adventures').delete().eq('tenant_id', userId)
  await supabaseAdmin.from('user_credits').delete().eq('user_id', userId)
  await supabaseAdmin.auth.admin.deleteUser(userId)
}

export async function cleanupGuestToken(token: string) {
  await supabaseAdmin.from('adventures').delete().eq('guest_token_id', token)
  await supabaseAdmin.from('guest_tokens').delete().eq('token', token)
}
```

### 4.2 Verify Test Infrastructure End-to-End

Run comprehensive validation:

```bash
# 1. Database accessible
psql -U postgres -h localhost -p 5433 -d daggergm_test -c "SELECT version();"

# 2. Environment variables loaded
test -f .env.test.local && echo "✅ Test env configured"

# 3. Vitest runs
npm run test:run

# 4. TypeScript compiles
npm run typecheck

# 5. Linter passes
npm run lint

# 6. E2E tests run
npm run test:e2e

# 7. Coverage meets threshold (90%)
npm run test:coverage | grep "All files" | grep -E "9[0-9]\\.[0-9]+%"

# 8. Directory structure exists
test -d tests/integration && test -d tests/e2e && test -d tests/helpers && echo "✅ Structure complete"
```

---

## Validation Checklist

### Infrastructure

- [ ] PostgreSQL running (local or Docker)
- [ ] Test database `daggergm_test` created
- [ ] Schema applied to test database
- [ ] `.env.test.local` configured
- [ ] Supabase local running: `npx supabase status`

### Dependencies

- [ ] All test dependencies installed
- [ ] Playwright browsers installed
- [ ] MSW 2.4.0+ installed

### Configuration Files

- [ ] `vitest.config.ts` created (90% threshold)
- [ ] `playwright.config.ts` created
- [ ] `tests/setup.ts` created
- [ ] `.lintstagedrc.json` created
- [ ] `.husky/pre-commit` created

### Test Helpers

- [ ] `tests/helpers/testDb.ts` created
- [ ] `tests/helpers/mockLLM.ts` created
- [ ] Test helpers importable (no errors)

### Scripts

- [ ] `npm test` works (watch mode)
- [ ] `npm run test:coverage` works (generates report)
- [ ] `npm run test:e2e` works (Playwright)
- [ ] `npm run lint` works (ESLint)
- [ ] `npm run typecheck` works (TypeScript)

### Smoke Tests

- [ ] Unit test smoke test passes
- [ ] Integration test smoke test passes
- [ ] E2E smoke test passes
- [ ] Coverage meets 90% threshold

---

## Success Criteria

When setup is complete, you should see:

```bash
$ npm run test:coverage

 ✓ tests/smoke/infrastructure.test.ts (3 tests) 234ms
   ✓ Test Infrastructure
     ✓ should run basic test
     ✓ should have access to environment variables
     ✓ should connect to test database

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  1.2s

--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   92.5  |   88.3   |   94.1  |   92.8  |
--------------------|---------|----------|---------|---------|-------------------

✅ Coverage thresholds met (target: 90%)
```

---

## Next Steps

After successful setup:

1. **Run first feature** using `/execute-feature` command
2. **Write first integration test** for critical path (e.g., credit consumption)
3. **Verify RLS policies** using `/rls-verification` skill
4. **Set up CI/CD** with GitHub Actions (Phase 0.7)

---

## Common Issues

### Issue: PostgreSQL Connection Failed

**Symptom**: `Error: connect ECONNREFUSED`

**Solution**:

```bash
# macOS
brew services restart postgresql@14

# Linux
sudo service postgresql restart

# Docker
docker restart daggergm-test-db
```

### Issue: Supabase Migrations Not Applied

**Symptom**: Tables missing in test database

**Solution**:

```bash
# Verify migrations exist
ls supabase/migrations/

# Apply migrations
npx supabase db push

# If still failing, reset and re-apply
npx supabase db reset
```

### Issue: Vitest Can't Find Modules

**Symptom**: `Cannot find module '@/features/...'`

**Solution**: Verify `vitest.config.ts` has correct path aliases matching `tsconfig.json`.

### Issue: MSW Handlers Not Intercepting

**Symptom**: Real API calls happening in tests

**Solution**: Ensure `llmServer.listen()` is called in `tests/setup.ts` `beforeAll` hook.

---

**Command Version**: 2.0.0 (Enhanced from original 1.0.0)
**Last Updated**: 2025-10-18
**Estimated Time**: 30-45 minutes
**Difficulty**: Intermediate

---

## Troubleshooting

### Issue: Vitest can't find test files

**Solution**: Check `vitest.config.ts` `include` patterns match your test file locations.

### Issue: Playwright times out on startup

**Solution**: Increase `webServer.timeout` in `playwright.config.ts` or check if port 3000 is already in use.

### Issue: MSW handlers not intercepting LLM calls

**Solution**: Verify `llmServer.listen()` is called in `beforeAll` in `tests/setup.ts`.

### Issue: Database tests fail with RLS errors

**Solution**: Ensure you're using `supabaseAdmin` (service role key) for test setup, not `supabaseClient`.

---

**Command Version**: 1.0.0
**Last Updated**: 2025-10-18
**Maintainer**: DaggerGM Team
