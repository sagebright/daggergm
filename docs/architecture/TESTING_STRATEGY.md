# DaggerGM Testing Strategy

## Overview

**Target**: 99% code coverage (lines/functions/statements), 97% branches
**Distribution**: 80% Integration / 15% E2E / 5% Unit
**Philosophy**: Test behavior, not implementation

---

## Test Type Distribution

### Integration Tests (80% of tests)

**What**: Test features end-to-end within a single layer (e.g., Server Action + Database)
**Why**: Catches real-world bugs, validates RLS policies, ensures API contracts
**Tools**: Vitest + Real Supabase Test Database

#### Example: Credit Consumption (Integration Test)

```typescript
// src/features/credits/actions/__tests__/consumeCredit.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestUser, cleanupTestData } from '@/tests/helpers/testDb'
import { consumeCredit } from '../consumeCredit'
import { getSupabaseServer } from '@/lib/supabase/server'

describe('consumeCredit (Integration)', () => {
  let userId: string
  let supabase: ReturnType<typeof getSupabaseServer>

  beforeEach(async () => {
    // Create real test user with 5 credits
    const user = await createTestUser({ credits: 5 })
    userId = user.id
    supabase = getSupabaseServer()
  })

  afterEach(async () => {
    await cleanupTestData(userId)
  })

  it('should atomically consume 1 credit and prevent race conditions', async () => {
    // Simulate concurrent requests (real race condition test)
    const results = await Promise.allSettled([
      consumeCredit(userId),
      consumeCredit(userId),
      consumeCredit(userId),
    ])

    // All should succeed (5 credits available)
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3)

    // Verify final balance (should be exactly 2)
    const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single()

    expect(user?.credits).toBe(2) // 5 - 3 = 2 (atomic!)
  })

  it('should enforce RLS and prevent cross-tenant credit theft', async () => {
    const attackerUser = await createTestUser({ credits: 0 })

    // Attacker tries to consume victim's credits
    await expect(consumeCredit(userId, { actingUserId: attackerUser.id })).rejects.toThrow(
      'Insufficient credits',
    )

    // Victim's credits unchanged
    const { data: victim } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    expect(victim?.credits).toBe(5)

    await cleanupTestData(attackerUser.id)
  })
})
```

**Coverage**: Database schema, RLS policies, Server Actions, business logic

---

### E2E Tests (15% of tests)

**What**: Test complete user flows in a real browser
**Why**: Validates UX, catches integration bugs between frontend/backend
**Tools**: Playwright

#### Example: Focus Mode Navigation (E2E Test)

```typescript
// tests/e2e/focus-mode.spec.ts
import { test, expect } from '@playwright/test'
import { createTestAdventure, login } from './helpers'

test.describe('Focus Mode', () => {
  test('should collapse other movements when focusing one', async ({ page }) => {
    // Setup: Create adventure with 3 movements
    const { adventureId, userId } = await createTestAdventure({
      movementCount: 3,
    })

    await login(page, userId)
    await page.goto(`/adventures/${adventureId}/edit`)

    // Initially all movements expanded
    await expect(page.locator('[data-testid^="movement-"]')).toHaveCount(3)

    // Click to focus Movement 2
    await page.locator('[data-testid="movement-2"]').click()

    // Movement 2 expanded, others collapsed
    await expect(page.locator('[data-testid="movement-2-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="movement-1-content"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="movement-3-content"]')).not.toBeVisible()

    // Headers still visible
    await expect(page.locator('[data-testid="movement-1-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="movement-3-header"]')).toBeVisible()
  })

  test('should sync focus state to URL', async ({ page }) => {
    const { adventureId, userId } = await createTestAdventure()
    await login(page, userId)

    // Focus Movement 2
    await page.goto(`/adventures/${adventureId}/edit`)
    await page.locator('[data-testid="movement-2"]').click()

    // URL updates
    await expect(page).toHaveURL(/focus=movement-2/)

    // Browser back button restores state
    await page.goBack()
    await expect(page).not.toHaveURL(/focus=/)
    await expect(page.locator('[data-testid="movement-2-content"]')).toBeVisible()
  })

  test('should handle mobile swipe gestures', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test')

    const { adventureId, userId } = await createTestAdventure()
    await login(page, userId)
    await page.goto(`/adventures/${adventureId}/edit`)

    // Swipe left on Movement 1 to collapse
    const movement = page.locator('[data-testid="movement-1"]')
    await movement.swipe({ direction: 'left', distance: 200 })

    await expect(page.locator('[data-testid="movement-1-content"]')).not.toBeVisible()
  })
})
```

**Coverage**: User interactions, responsive design, browser navigation

---

### Unit Tests (5% of tests)

**What**: Test isolated pure functions with no external dependencies
**Why**: Fast feedback for complex logic (e.g., Zod validators, formatters)
**Tools**: Vitest

#### Example: LLM Response Validator (Unit Test)

```typescript
// src/features/generation/validators/__tests__/validateScaffold.test.ts
import { describe, it, expect } from 'vitest'
import { validateScaffold } from '../validateScaffold'

describe('validateScaffold (Unit)', () => {
  it('should accept valid scaffold from GPT-4', () => {
    const input = {
      overview: 'A mysterious corruption spreads through the Witherwild...',
      hooks: ['Villagers report strange dreams', 'Animals fleeing the forest'],
      complications: ['The source is a revered sacred site'],
    }

    const result = validateScaffold(input)
    expect(result).toEqual(input)
  })

  it('should reject scaffold with missing required fields', () => {
    const input = {
      overview: 'A story...',
      // Missing hooks and complications
    }

    expect(() => validateScaffold(input)).toThrow('hooks: Required')
  })

  it('should sanitize HTML in overview to prevent XSS', () => {
    const input = {
      overview: 'A <script>alert("xss")</script> corruption spreads...',
      hooks: ['Hook 1'],
      complications: ['Complication 1'],
    }

    const result = validateScaffold(input)
    expect(result.overview).not.toContain('<script>')
    expect(result.overview).toContain('A  corruption spreads')
  })
})
```

**Coverage**: Pure functions, edge cases, input validation

---

## Test Organization & Naming

### File Structure

```
src/features/adventure/
├── actions/
│   ├── createAdventure.ts
│   └── __tests__/
│       └── createAdventure.test.ts      # Integration test
├── components/
│   ├── AdventureCard.tsx
│   └── __tests__/
│       └── AdventureCard.test.tsx       # Component test (integration-style)
└── schemas/
    ├── adventure.ts
    └── __tests__/
        └── adventure.test.ts             # Unit test
```

### Naming Conventions

#### Test Suites

```typescript
// ✅ GOOD: Descriptive suite names
describe('consumeCredit (Integration)', () => { ... });
describe('FocusModeLayout (Component)', () => { ... });
describe('validateScaffold (Unit)', () => { ... });

// ❌ BAD: Vague names
describe('tests', () => { ... });
describe('credit stuff', () => { ... });
```

#### Test Cases

```typescript
// ✅ GOOD: Behavior-focused
it('should atomically consume 1 credit and prevent race conditions', ...);
it('should reject scaffold with missing required fields', ...);
it('should sync focus state to URL', ...);

// ❌ BAD: Implementation-focused
it('calls supabase.rpc with correct params', ...);
it('returns 200 status code', ...);
```

---

## Mocking Strategy

### 🎯 Mock External Services, Test Real Database

```typescript
// ✅ GOOD: Real database, mock LLM
import { mockOpenAI } from '@/tests/helpers/mockLLM'

it('should generate adventure with mocked LLM', async () => {
  mockOpenAI.mockScaffoldResponse({
    overview: 'Test overview...',
    hooks: ['Hook 1'],
    complications: ['Complication 1'],
  })

  const result = await generateAdventure({
    frame: 'Witherwild',
    difficulty: 'medium',
  })

  // Real database insert happened
  const { data } = await supabase.from('adventures').select().eq('id', result.id).single()

  expect(data?.scaffold.overview).toBe('Test overview...')
})

// ❌ BAD: Mock database (misses RLS bugs)
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => ({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: '123' } }),
    }),
  }),
}))
```

### MSW for LLM Mocking

```typescript
// tests/helpers/mockLLM.ts
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const llmHandlers = [
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()
    const messages = body.messages

    // Detect prompt type from system message
    const systemMessage = messages.find((m) => m.role === 'system')?.content

    if (systemMessage?.includes('scaffold')) {
      return HttpResponse.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overview: 'A mysterious corruption spreads...',
                hooks: ['Villagers report strange dreams'],
                complications: ['The source is a sacred site'],
              }),
            },
          },
        ],
      })
    }

    // Default response
    return HttpResponse.json({
      choices: [{ message: { content: 'Default LLM response' } }],
    })
  }),
]

export const llmServer = setupServer(...llmHandlers)
```

---

## Coverage Enforcement

### CI/CD Gates

```yaml
# .github/workflows/ci.yml
- name: Enforce Coverage Threshold
  run: |
    if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 99 ]; then
      echo "❌ Coverage below 99% threshold"
      exit 1
    fi
```

### Local Development

```bash
# Automatically fail if coverage drops
npm run test:coverage

# Watch mode for TDD
npm run test:watch
```

### Coverage Reports

- **HTML Report**: `coverage/index.html` (drill down to uncovered lines)
- **LCOV**: `coverage/lcov.info` (for IDE integrations)
- **JSON**: `coverage/coverage-summary.json` (for scripts)

---

## TDD Workflow (RED → GREEN → REFACTOR)

### Example: Implementing `regenerateMovement` Server Action

#### 1. RED (Write failing test first)

```typescript
// src/features/adventure/actions/__tests__/regenerateMovement.test.ts
import { describe, it, expect } from 'vitest'
import { regenerateMovement } from '../regenerateMovement'

describe('regenerateMovement (Integration)', () => {
  it('should regenerate movement with new LLM content', async () => {
    const { adventureId, movementId } = await createTestAdventure()

    mockOpenAI.mockMovementResponse({
      description: 'NEW DESCRIPTION',
      npcs: [{ name: 'New NPC' }],
    })

    const result = await regenerateMovement(movementId)

    expect(result.description).toBe('NEW DESCRIPTION')
    expect(result.npcs[0].name).toBe('New NPC')
  })
})
```

**Run**: `npm run test:watch`
**Result**: ❌ Test fails (function doesn't exist yet)

#### 2. GREEN (Minimal implementation)

```typescript
// src/features/adventure/actions/regenerateMovement.ts
'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { generateMovement } from '@/features/generation/services/movementGenerator'

export async function regenerateMovement(movementId: string) {
  const supabase = getSupabaseServer()

  // Fetch existing movement
  const { data: movement } = await supabase
    .from('movements')
    .select('*, adventure:adventures(*)')
    .eq('id', movementId)
    .single()

  if (!movement) {
    throw new Error('Movement not found')
  }

  // Generate new content
  const newContent = await generateMovement({
    frame: movement.adventure.frame,
    previousMovements: [], // TODO: Get previous movements
  })

  // Update database
  const { data: updated } = await supabase
    .from('movements')
    .update(newContent)
    .eq('id', movementId)
    .select()
    .single()

  return updated
}
```

**Run**: `npm run test:watch`
**Result**: ✅ Test passes

#### 3. REFACTOR (Improve without breaking tests)

- Add error handling for missing adventure
- Implement `previousMovements` lookup
- Add optimistic locking (prevent concurrent regeneration)
- Improve type safety

**Run**: `npm run test:watch` (after each refactor)
**Result**: ✅ All tests still pass

---

## Testing Checklist (For Each Feature)

### Before Writing Code

- [ ] Write failing integration test for happy path
- [ ] Write failing tests for error cases
- [ ] Run `npm run test:watch` to see RED

### During Implementation

- [ ] Implement minimal code to make tests GREEN
- [ ] Refactor while keeping tests GREEN
- [ ] Add edge case tests as discovered

### Before Committing

- [ ] Run `npm run test:coverage` (must be ≥99%)
- [ ] Run `npm run test:e2e` (if UI changed)
- [ ] Check coverage report for untested branches

### Code Review Checklist

- [ ] All tests follow naming conventions
- [ ] Integration tests use real database
- [ ] External services mocked with MSW
- [ ] E2E tests cover critical user flows
- [ ] No implementation details tested (test behavior)

---

## Common Pitfalls & Solutions

### ❌ Pitfall: Testing Implementation Details

```typescript
// BAD: Tests internal state
it('should call setState with correct value', () => {
  const { result } = renderHook(() => useFocusMode());
  result.current.focusMovement('movement-1');
  expect(mockSetState).toHaveBeenCalledWith({ activeMovementId: 'movement-1' });
});

// GOOD: Tests observable behavior
it('should expand focused movement and collapse others', () => {
  const { getByTestId } = render(<FocusModeLayout movements={mockMovements} />);
  fireEvent.click(getByTestId('movement-1'));
  expect(getByTestId('movement-1-content')).toBeVisible();
  expect(getByTestId('movement-2-content')).not.toBeVisible();
});
```

### ❌ Pitfall: Mocking Everything

```typescript
// BAD: Mock hides RLS bug
vi.mock('@/lib/supabase/server');

// GOOD: Real database catches RLS bug
const supabase = getSupabaseServer();
const { error } = await supabase.from('adventures').insert({ ... });
expect(error).toBeNull();
```

### ❌ Pitfall: Flaky E2E Tests

```typescript
// BAD: Race condition
await page.click('[data-testid="submit"]')
expect(page.locator('[data-testid="success"]')).toBeVisible() // Might fail!

// GOOD: Wait for element
await page.click('[data-testid="submit"]')
await expect(page.locator('[data-testid="success"]')).toBeVisible() // Waits up to 5s
```

---

## Performance Guidelines

### Target Times

- **Unit tests**: <100ms per test
- **Integration tests**: <500ms per test (with real DB)
- **E2E tests**: <5s per test

### Optimization Strategies

- **Parallel execution**: Vitest runs tests in parallel by default
- **Database cleanup**: Use `beforeEach` instead of `afterAll` (faster)
- **Shared fixtures**: Cache test users/adventures across tests
- **Selective test runs**: `npm run test:affected` for changed files only

---

**Version**: 2025-10-18
**Owner**: DaggerGM Team
**Next Review**: After first 100 tests written
