---
name: 'Vitest Test Patterns'
description: 'Enforce Vitest testing patterns for DaggerGM with 90% coverage target and integration-first approach'
---

# Vitest Testing Patterns (DaggerGM)

Auto-activates: Test files, test writing, coverage gaps.

**Coverage Target**: 90% overall, 99% for security-critical code

## TEST WRITING SEQUENCE (Execute in Order)

```bash
# 1️⃣  BEFORE writing code - Write failing test
npm test -- [feature].test.ts

# Expected: ❌ RED (test fails)

# 2️⃣  Write minimal code to pass
# [implement feature]

# 3️⃣  Verify test passes
npm test -- [feature].test.ts

# Expected: ✅ GREEN (test passes)

# 4️⃣  Check coverage
npm run test:coverage

# Expected: 90%+ lines/functions/statements, 99% for security code

# 5️⃣  Refactor if needed (keep tests green)
```

---

## INTEGRATION TEST PATTERN (80% of tests)

```typescript
// tests/features/adventures/create.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { createTestUser, cleanupTestData } from '@/tests/helpers'
import { createAdventure } from '@/features/adventures/actions'

describe('Adventure Creation Integration', () => {
  let userId: string

  beforeEach(async () => {
    // ✅ Setup: Create isolated test user
    const user = await createTestUser()
    userId = user.id
  })

  afterEach(async () => {
    // ✅ Cleanup: Remove test data
    await cleanupTestData(userId)
  })

  // ✅ Test: Happy path
  test('should create adventure successfully', async () => {
    const formData = new FormData()
    formData.append('title', 'Test Adventure')
    formData.append('frame', 'witherwild')

    const result = await createAdventure(formData)

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
    expect(result.data?.title).toBe('Test Adventure')
    expect(result.data?.user_id).toBe(userId)
  })

  // ✅ Test: User isolation (REQUIRED)
  test('should not access other user data', async () => {
    // Create adventure for user1
    const formData = new FormData()
    formData.append('title', 'User1 Adventure')
    const result1 = await createAdventure(formData)

    // Create different user2
    const user2 = await createTestUser()

    // Try to access with user2's context
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', result1.data?.id)
      .eq('user_id', user2.id) // Wrong user

    // ✅ MUST return empty (RLS blocks access)
    expect(data).toHaveLength(0)

    await cleanupTestData(user2.id)
  })

  // ✅ Test: Authentication required
  test('should reject unauthenticated requests', async () => {
    // Mock unauthenticated state
    const formData = new FormData()
    formData.append('title', 'Test')

    const result = await createAdventure(formData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  // ✅ Test: Validation errors
  test('should validate required fields', async () => {
    const formData = new FormData()
    // Missing required fields

    const result = await createAdventure(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('required')
  })
})
```

---

## TEST HELPERS PATTERN

```typescript
// tests/helpers/database.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Create isolated test user
 */
export async function createTestUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'test-password-123',
  })

  if (error) throw error
  return user!
}

/**
 * Create test adventure for user
 */
export async function createTestAdventure(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('adventures')
    .insert({
      title: `Test Adventure ${Date.now()}`,
      user_id: userId,
      frame: 'witherwild',
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cleanup ALL test data for user (prevent leakage)
 */
export async function cleanupTestData(userId: string) {
  const supabase = await createClient()

  // Delete in reverse dependency order
  await supabase.from('scenes').delete().eq('user_id', userId)
  await supabase.from('adventures').delete().eq('user_id', userId)
  await supabase.auth.admin.deleteUser(userId)
}
```

---

## MSW PATTERN (OpenAI Mocking)

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock OpenAI completions
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              title: 'Test Adventure',
              description: 'A test adventure in the Witherwild...',
              frame: 'witherwild',
              scenes: [
                {
                  title: 'Opening Scene',
                  description: 'The adventure begins...',
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

  // Mock Stripe checkout
  http.post('https://api.stripe.com/v1/checkout/sessions', () => {
    return HttpResponse.json({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    })
  }),
]
```

```typescript
// tests/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

const server = setupServer(...handlers)

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Cleanup after all tests
afterAll(() => server.close())
```

---

## E2E TEST PATTERN (15% of tests)

```typescript
// tests/e2e/adventures/create-adventure.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Adventure Creation Flow', () => {
  test('should create adventure from start to finish', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navigate to create
    await page.goto('/adventures/new')

    // Fill form
    await page.fill('[name="title"]', 'My Test Adventure')
    await page.selectOption('[name="frame"]', 'witherwild')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page).toHaveURL(/\/adventures\/[a-z0-9-]+/)
    await expect(page.locator('h1')).toContainText('My Test Adventure')
  })
})
```

---

## UNIT TEST PATTERN (5% of tests)

```typescript
// tests/unit/utils/validation.test.ts
import { describe, test, expect } from 'vitest'
import { validateAdventureTitle } from '@/lib/validators/adventure'

describe('validateAdventureTitle', () => {
  test('should accept valid titles', () => {
    expect(validateAdventureTitle('My Adventure')).toBe(true)
    expect(validateAdventureTitle('A'.repeat(100))).toBe(true)
  })

  test('should reject invalid titles', () => {
    expect(validateAdventureTitle('')).toBe(false)
    expect(validateAdventureTitle('ab')).toBe(false) // Too short
    expect(validateAdventureTitle('A'.repeat(101))).toBe(false) // Too long
  })
})
```

---

## SUCCESS CRITERIA (Binary)

```bash
# All must exit 0:

# 1. Coverage ≥90% (lines, functions, statements), 99% for security
npm run test:coverage | grep "All files" | \
  awk '{exit !($4>=90 && $5>=90 && $6>=90)}'

# 2. All tests pass
npm test
# Exit 0 = PASS ✅

# 3. No .only() or .skip()
! grep -r "\.only\|\.skip" tests --include="*.test.ts" --include="*.test.tsx" 2>/dev/null

# 4. All integration tests have cleanup
grep -c "afterEach.*cleanup" tests/features/**/*.test.ts 2>/dev/null | \
  awk '{exit !($1>=1)}'

# 5. All integration tests have user isolation test
grep -c "user.*isolation\|cross.*user" tests/features/**/*.test.ts 2>/dev/null | \
  awk '{exit !($1>=1)}'
```

**If ANY fails → Tests are incomplete → Fix before commit**

---

## COVERAGE REQUIREMENTS

### Overall Project:

- **Lines**: 90%
- **Functions**: 90%
- **Statements**: 90%
- **Branches**: 90%

### Security-Critical Code (99% Required):

- `features/credits/` - Credit system
- `features/auth/` - Authentication
- `lib/supabase/` - Database clients
- Any file with `user_id` filtering
- Guest token handling

### Test Distribution:

- **80%** Integration tests (real database, Server Actions)
- **15%** E2E tests (Playwright, full user flows)
- **5%** Unit tests (pure functions only)

---

**Reference**: CLAUDE.md "Testing Requirements" section
**Integration Ratio**: 80% integration, 15% E2E, 5% unit
**Coverage Target**: 90% overall, 99% security-critical
**Test Framework**: Vitest + Playwright
**Mocking**: MSW for external APIs (OpenAI, Stripe), NEVER mock Supabase
