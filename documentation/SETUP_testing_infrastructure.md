# Testing Infrastructure Setup

**Slash Command**: `/setup-testing-infrastructure` (to be created)
**Type**: Infrastructure Setup
**Purpose**: Establish complete integration-first testing foundation for DaggerGM
**Duration**: 2-3 hours
**Prerequisites**: Next.js 14 project initialized, Supabase project created

---

## 🎯 **Objective**

Set up a battle-tested integration-first testing infrastructure that enables:

- 80% integration tests with real database
- 15% contract tests for external APIs (OpenAI)
- 5% unit tests for pure logic
- 99% code coverage emerging naturally
- Fast feedback loop (< 60 seconds locally)

---

## 📋 **Success Criteria**

By completion, you should have:

- ✅ Vitest configured for Next.js App Router + integration tests
- ✅ Local PostgreSQL test database running
- ✅ Test helpers for database cleanup and factories
- ✅ MSW configured for OpenAI API mocking
- ✅ Transaction-based test isolation working
- ✅ First integration test passing
- ✅ CI/CD workflow with auto-retry configured
- ✅ Documentation for testing patterns

---

## 🏗️ **Implementation Tasks**

### **Task 1: Local Test Database Setup**

**Objective**: Set up local PostgreSQL database for integration tests

**Steps**:

1. **Install PostgreSQL locally** (if not already installed):

   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Or use Docker
   docker run -d \
     --name daggergm-test-db \
     -e POSTGRES_PASSWORD=test_password \
     -e POSTGRES_DB=daggergm_test \
     -p 5433:5432 \
     postgres:14
   ```

2. **Create test database**:

   ```bash
   createdb daggergm_test

   # Or with Docker:
   docker exec -it daggergm-test-db psql -U postgres -c "CREATE DATABASE daggergm_test;"
   ```

3. **Add test database URL to `.env.test.local`**:

   ```bash
   # .env.test.local (git ignored)
   DATABASE_URL=postgresql://postgres:test_password@localhost:5433/daggergm_test
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...test-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...test-service-key

   # OpenAI (will be mocked in tests)
   OPENAI_API_KEY=sk-test-key-not-used-in-tests
   ```

4. **Run Supabase migrations on test database**:
   ```bash
   # Apply schema to test database
   DATABASE_URL=postgresql://postgres:test_password@localhost:5433/daggergm_test \
     npx supabase db push
   ```

**Validation**:

```bash
# Verify test database exists
psql -U postgres -d daggergm_test -c "\dt"

# Should show your tables (users, adventures, etc)
```

---

### **Task 2: Vitest Configuration**

**Objective**: Configure Vitest for Next.js integration tests

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // Use 'jsdom' for React component tests
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'out'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**', 'lib/**'],
      exclude: ['app/**/*.test.ts', 'app/**/*.test.tsx', 'lib/**/*.test.ts'],
      // Integration-first targets
      lines: 99,
      functions: 99,
      branches: 97,
      statements: 99,
    },
    // Performance optimization
    poolOptions: {
      threads: {
        singleThread: false, // Parallel execution
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Pragmatic quality standards
    retry: 0, // No retry locally (use CI for retry)
    testTimeout: 10000, // 10s timeout for integration tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/app': resolve(__dirname, './app'),
      '@/lib': resolve(__dirname, './lib'),
      '@/types': resolve(__dirname, './types'),
      '@/tests': resolve(__dirname, './tests'),
    },
  },
})
```

**File**: `tests/setup.ts`

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest'
import { config } from 'dotenv'
import { cleanDatabase } from './helpers/testDatabase'

// Load test environment variables
config({ path: '.env.test.local' })

// Global setup
beforeAll(async () => {
  console.log('🧪 Test suite starting...')

  // Verify test database connection
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl || !dbUrl.includes('daggergm_test')) {
    throw new Error('❌ Test database not configured! Check .env.test.local')
  }

  console.log('✅ Connected to test database')
})

// Clean database after each test
afterEach(async () => {
  await cleanDatabase()
})

// Global teardown
afterAll(async () => {
  console.log('🧹 Test suite complete. Database cleaned.')
})
```

**Validation**:

```bash
npm install -D vitest @vitejs/plugin-react @vitest/ui
npm test -- --version
```

---

### **Task 3: Test Helper Utilities**

**Objective**: Create reusable test helpers for database operations

**File**: `tests/helpers/testDatabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client for test database operations
export const testClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Clean all test data from database
 * Uses CASCADE delete to handle foreign keys
 */
export async function cleanDatabase() {
  const tables = ['adventure_movements', 'adventures', 'user_credits', 'profiles']

  for (const table of tables) {
    const { error } = await testClient
      .from(table as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error && !error.message.includes('No rows found')) {
      console.error(`Failed to clean ${table}:`, error)
    }
  }
}

/**
 * Begin transaction for test isolation (advanced)
 * Note: Supabase JS client doesn't support transactions directly
 * Use this pattern for future optimization if needed
 */
export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  // For now, just execute callback
  // TODO: Implement transaction-based isolation if performance issues arise
  return await callback()
}
```

**File**: `tests/helpers/testAuth.ts`

```typescript
import { testClient } from './testDatabase'
import { User } from '@supabase/supabase-js'

/**
 * Create test user with authentication
 */
export async function createTestUser(
  overrides: Partial<{ email: string; password: string }> = {},
): Promise<{ user: User; session: any }> {
  const email = overrides.email || `test-${Date.now()}@example.com`
  const password = overrides.password || 'test-password-123'

  const { data, error } = await testClient.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  if (!data.user) throw new Error('Failed to create test user')

  return { user: data.user, session: data.session }
}

/**
 * Create test session token for API requests
 */
export async function createTestSession(): Promise<{
  user: User
  token: string
}> {
  const { user, session } = await createTestUser()

  if (!session?.access_token) {
    throw new Error('Failed to create session token')
  }

  return {
    user,
    token: session.access_token,
  }
}

/**
 * Create guest user token (for free adventure feature)
 */
export function createGuestToken(): string {
  // Generate guest token (implement based on your guest token strategy)
  const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return Buffer.from(JSON.stringify({ guestId, type: 'guest' })).toString('base64')
}
```

**File**: `tests/helpers/testAdventures.ts`

```typescript
import { testClient } from './testDatabase'
import { Database } from '@/types/database.generated'

type Adventure = Database['public']['Tables']['adventures']['Insert']

/**
 * Create test adventure with default values
 */
export async function createTestAdventure(
  userId: string,
  overrides: Partial<Adventure> = {},
): Promise<Database['public']['Tables']['adventures']['Row']> {
  const adventure: Adventure = {
    user_id: userId,
    title: 'Test Adventure',
    frame: 'witherwild',
    config: {
      length: 'one_shot',
      party_size: 4,
      party_level: 3,
      difficulty: 'standard',
      stakes: 'personal',
      motifs: {
        primary: 'mystery',
        secondary: 'exploration',
      },
    },
    scaffold: null,
    status: 'draft',
    ...overrides,
  }

  const { data, error } = await testClient.from('adventures').insert(adventure).select().single()

  if (error) throw error
  return data
}

/**
 * Create adventure with scaffold
 */
export async function createAdventureWithScaffold(
  userId: string,
): Promise<Database['public']['Tables']['adventures']['Row']> {
  return createTestAdventure(userId, {
    status: 'scaffolded',
    scaffold: {
      title: 'The Mysterious Forest',
      hook: 'A strange mist has descended...',
      movements: [
        {
          id: '1',
          title: 'Into the Mist',
          summary: 'Party enters the mysterious forest',
          type: 'exploration',
        },
        {
          id: '2',
          title: 'The Clearing',
          summary: 'A strange clearing appears',
          type: 'combat',
        },
        {
          id: '3',
          title: 'Resolution',
          summary: 'The mystery is revealed',
          type: 'social',
        },
      ],
    },
  })
}
```

**Validation**:

```bash
# Create a simple test to verify helpers work
# tests/helpers/testHelpers.test.ts
```

---

### **Task 4: MSW Setup for OpenAI Mocking**

**Objective**: Mock OpenAI API calls for contract tests

**File**: `tests/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'

/**
 * Mock OpenAI API responses for testing
 * Only mock EXTERNAL APIs - never mock your own code!
 */
export const handlers = [
  // OpenAI Chat Completion (non-streaming)
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()

    // Return mock scaffold generation
    return HttpResponse.json({
      id: 'chatcmpl-test-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              title: 'Test Adventure Title',
              hook: 'A test hook for the adventure...',
              movements: [
                {
                  id: '1',
                  title: 'First Movement',
                  summary: 'Test summary',
                  type: 'exploration',
                },
              ],
            }),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    })
  }),

  // OpenAI Chat Completion (streaming) - for future
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()

    if (body.stream) {
      // TODO: Implement streaming mock when needed
      return new HttpResponse(null, { status: 501 })
    }
  }),

  // OpenAI Error Scenarios (for contract tests)
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const testScenario = request.headers.get('X-Test-Scenario')

    if (testScenario === 'rate_limit') {
      return HttpResponse.json(
        { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
        { status: 429 },
      )
    }

    if (testScenario === 'invalid_api_key') {
      return HttpResponse.json(
        { error: { message: 'Invalid API key', type: 'invalid_request_error' } },
        { status: 401 },
      )
    }

    if (testScenario === 'timeout') {
      // Simulate timeout by delaying response
      await new Promise((resolve) => setTimeout(resolve, 11000))
      return new HttpResponse(null, { status: 504 })
    }
  }),
]
```

**File**: `tests/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create MSW server for Node.js tests
export const server = setupServer(...handlers)

// Start server before all tests
export function setupMSW() {
  server.listen({
    onUnhandledRequest: 'warn', // Warn on unmocked requests
  })
}

// Reset handlers between tests
export function resetMSW() {
  server.resetHandlers()
}

// Clean up after all tests
export function teardownMSW() {
  server.close()
}
```

**Update**: `tests/setup.ts`

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest'
import { config } from 'dotenv'
import { cleanDatabase } from './helpers/testDatabase'
import { setupMSW, resetMSW, teardownMSW } from './mocks/server'

// Load test environment variables
config({ path: '.env.test.local' })

// Setup MSW
beforeAll(async () => {
  setupMSW()
  console.log('🧪 Test suite starting with MSW...')
})

// Clean database and reset MSW after each test
afterEach(async () => {
  await cleanDatabase()
  resetMSW()
})

// Teardown
afterAll(async () => {
  teardownMSW()
  console.log('🧹 Test suite complete.')
})
```

**Install Dependencies**:

```bash
npm install -D msw@latest
```

**Validation**:

```bash
# Test MSW setup works
# Will create in next document: FEATURE_first_integration_test.md
```

---

### **Task 5: Directory Structure**

**Objective**: Create organized test directory structure

**Structure**:

```
tests/
├── setup.ts                    # Global test setup
├── helpers/                    # Test utilities
│   ├── testDatabase.ts        # Database helpers
│   ├── testAuth.ts            # Auth helpers
│   └── testAdventures.ts      # Adventure factories
├── mocks/                      # MSW mocks
│   ├── handlers.ts            # API mock handlers
│   └── server.ts              # MSW server setup
├── integration/                # 80% of tests go here
│   ├── auth/
│   │   └── signup.test.ts
│   ├── adventures/
│   │   ├── create.test.ts
│   │   ├── generate.test.ts
│   │   └── export.test.ts
│   └── credits/
│       └── consumption.test.ts
├── contract/                   # 15% - External services
│   └── openai/
│       ├── scaffold.test.ts
│       └── errors.test.ts
└── unit/                       # 5% - Pure logic only
    └── utils/
        └── formatting.test.ts
```

**Create Structure**:

```bash
mkdir -p tests/{helpers,mocks,integration/{auth,adventures,credits},contract/openai,unit/utils}
```

---

### **Task 6: CI/CD Configuration**

**Objective**: GitHub Actions workflow with auto-retry

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: ['**']
    paths-ignore:
      - '**.md'
      - 'documentation/**'
      - 'CLAUDE/**'

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: daggergm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Database Migrations
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5433/daggergm_test
        run: |
          npx supabase db push

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run typecheck

      - name: Run Tests (with Auto-Retry)
        timeout-minutes: 10
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:test_password@localhost:5433/daggergm_test
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
        run: |
          npm test -- --run --retry=2 --reporter=verbose

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/coverage-final.json
```

**Add to `package.json`**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

---

### **Task 7: Documentation**

**Objective**: Document testing patterns for team

**File**: `tests/README.md`

````markdown
# DaggerGM Testing Guide

## Philosophy: Integration-First (80/15/5)

We follow an integration-first testing strategy:

- **80% Integration Tests**: Full API workflows with real database
- **15% Contract Tests**: External service boundaries (OpenAI)
- **5% Unit Tests**: Pure business logic only

### Why Integration-First?

- ✅ Test what code **DOES**, not **HOW** it does it
- ✅ 99% coverage emerges naturally
- ✅ Refactor freely without breaking tests
- ✅ Catch integration bugs immediately
- ✅ Ship with confidence

## Running Tests

\`\`\`bash

# Watch mode (development)

npm test

# Run once (CI)

npm run test:run

# With coverage

npm run test:coverage

# UI mode

npm run test:ui
\`\`\`

## Writing Tests

### Integration Test (80% of tests)

Test complete user journeys with real database:

\`\`\`typescript
// tests/integration/adventures/create.test.ts
import { describe, test, expect } from 'vitest';
import { createTestSession } from '@/tests/helpers/testAuth';
import { testClient } from '@/tests/helpers/testDatabase';

describe('POST /api/adventures', () => {
test('should create adventure with authentication', async () => {
const { user, token } = await createTestSession();

    const response = await fetch('http://localhost:3000/api/adventures', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Adventure',
        frame: 'witherwild',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user_id).toBe(user.id);

});
});
\`\`\`

### Contract Test (15% of tests)

Test external service boundaries:

\`\`\`typescript
// tests/contract/openai/scaffold.test.ts
import { describe, test, expect } from 'vitest';
import { generateScaffold } from '@/lib/llm/scaffold';

describe('OpenAI Scaffold Generation Contract', () => {
test('should handle successful response format', async () => {
const scaffold = await generateScaffold({
frame: 'witherwild',
length: 'one_shot',
});

    expect(scaffold).toMatchObject({
      title: expect.any(String),
      hook: expect.any(String),
      movements: expect.any(Array),
    });

});
});
\`\`\`

### Unit Test (5% of tests)

Only for pure functions:

\`\`\`typescript
// tests/unit/utils/formatting.test.ts
import { describe, test, expect } from 'vitest';
import { formatAdventureTitle } from '@/lib/utils/formatting';

describe('formatAdventureTitle', () => {
test('should capitalize first letter', () => {
expect(formatAdventureTitle('test')).toBe('Test');
});
});
\`\`\`

## Anti-Patterns

❌ **Don't mock your own services**
❌ **Don't test implementation details**
❌ **Don't create unnecessary test data**
❌ **Don't test multiple concerns in one test**

✅ **Do use real database**
✅ **Do test user behavior**
✅ **Do mock external APIs only**
✅ **Do write one test per concern**

## Performance

- Local: < 60 seconds
- CI: 2-4 minutes with auto-retry
- Pass rate: 96-98% locally acceptable
- CI uses --retry=2 for flaky tests

## Questions?

See `documentation/INTEGRATION_FIRST_TESTING_STRATEGY.md` for full philosophy.
\`\`\`

---

## 🎯 **Validation Checklist**

After completing all tasks:

- [ ] Local PostgreSQL database running on port 5433
- [ ] Test database has schema applied (tables visible)
- [ ] `.env.test.local` configured with correct DATABASE_URL
- [ ] Vitest runs without errors: `npm test -- --version`
- [ ] Test helpers can be imported: `import { testClient } from '@/tests/helpers/testDatabase'`
- [ ] MSW setup complete: `import { server } from '@/tests/mocks/server'`
- [ ] Directory structure created under `tests/`
- [ ] GitHub Actions workflow added to `.github/workflows/test.yml`
- [ ] `tests/README.md` created with examples
- [ ] Ready to write first integration test

---

## 📚 **Next Steps**

Once infrastructure is complete:

1. **FEATURE_first_integration_test.md** - Write your first integration test (user signup)
2. **FEATURE_integration_test_helpers.md** - Expand test helpers
3. **FEATURE_adventure_generation_tests.md** - Test core adventure workflow

---

## 🚨 **Troubleshooting**

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5433

# Check database exists
psql -U postgres -h localhost -p 5433 -l | grep daggergm_test

# Reset test database
dropdb daggergm_test && createdb daggergm_test
```
````

### Vitest Not Finding Modules

```bash
# Check tsconfig.json has correct paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/tests/*": ["./tests/*"]
    }
  }
}
```

### MSW Not Mocking Requests

```bash
# Check MSW is initialized in tests/setup.ts
# Check handlers are matching the correct URL
# Check MSW version is latest (v2.0+)
```

---

**Version**: 1.0
**Created**: 2025-10-16
**Estimated Time**: 2-3 hours
**Difficulty**: Moderate
