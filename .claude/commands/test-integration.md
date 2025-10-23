# Test Integration (TDD Workflow)

**Purpose**: Write integration-first tests using TDD approach (RED → GREEN → REFACTOR)

## Feature: $ARGUMENTS

**Usage Examples**:

- `/test-integration user-signup`
- `/test-integration adventure-creation`
- `/test-integration credit-consumption`

---

## 🎯 **Philosophy: Integration-First TDD**

This command enforces Test-Driven Development with integration tests (not unit tests):

1. **RED**: Write failing integration test FIRST
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Clean up while keeping tests green

**Key Principles**:

- Test what code **DOES**, not **HOW** it does it
- Use real database (not mocked)
- Test complete user journeys
- 99% coverage emerges naturally

---

## 🚀 **Phase 1: RED - Write Failing Test**

### 1.1 Understand Feature Requirements

```
✅ REQUIREMENTS ANALYSIS:
□ What is the user journey being tested?
□ What is the expected behavior?
□ What edge cases must be handled?
□ What business rules must be validated?
□ What external services are involved?
```

### 1.2 Determine Test Type (80/15/5 Rule)

**Integration Test (80%)** - Use when:

- ✅ Testing complete API endpoint
- ✅ Testing user workflow (signup, create adventure, export)
- ✅ Testing database operations
- ✅ Testing Server Actions
- ✅ Testing RLS policies

**Contract Test (15%)** - Use when:

- ✅ Testing external API boundaries (OpenAI)
- ✅ Testing service adapter logic
- ✅ Testing error handling from external services

**Unit Test (5%)** - Use when:

- ✅ Testing pure calculation functions
- ✅ Testing validation logic (no I/O)
- ✅ Testing data transformations

### 1.3 Create Test File

**Location based on type**:

```bash
# Integration test (most common)
tests/integration/[feature]/[test-name].test.ts

# Contract test
tests/contract/[service]/[test-name].test.ts

# Unit test (rare)
tests/unit/[category]/[test-name].test.ts
```

### 1.4 Write Failing Test

**Integration Test Pattern**:

```typescript
import { describe, test, expect } from 'vitest'
import { createTestSession } from '@/tests/helpers/testAuth'
import { testClient } from '@/tests/helpers/testDatabase'

describe('[Feature] Integration', () => {
  test('should [expected behavior]', async () => {
    // Arrange - Set up test data
    const { user, token } = await createTestSession()

    // Act - Perform the action
    const response = await fetch('http://localhost:3000/api/endpoint', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        /* data */
      }),
    })

    // Assert - Verify expected outcome
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toMatchObject({
      // expected structure
    })

    // Assert - Verify database state
    const { data: dbRecord } = await testClient.from('table').select('*').eq('id', data.id).single()

    expect(dbRecord).toBeDefined()
  })
})
```

### 1.5 Run Test (Should Fail)

```bash
npm test -- tests/integration/[feature]/[test-name].test.ts

# Expected: ❌ Test fails because implementation doesn't exist
# This is CORRECT behavior in TDD!
```

**Validation**:

- [ ] Test is written before implementation
- [ ] Test describes expected behavior clearly
- [ ] Test uses real database (not mocked)
- [ ] Test fails for the right reason (not implementation exists)

---

## 🟢 **Phase 2: GREEN - Implement to Pass**

### 2.1 Implement Minimal Solution

**For Server Actions** (Next.js):

```typescript
// app/actions/[feature].ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function performAction(data: any) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Perform database operation
  const { data: result, error } = await supabase
    .from('table')
    .insert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single()

  if (error) throw error

  // Revalidate if needed
  revalidatePath('/path')

  return result
}
```

**For API Routes** (if not using Server Actions):

```typescript
// app/api/[feature]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request
  const body = await request.json()

  // Business logic
  const { data, error } = await supabase
    .from('table')
    .insert({ user_id: user.id, ...body })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### 2.2 Run Tests Frequently

```bash
# Watch mode for fast feedback
npm test -- tests/integration/[feature] --watch

# Make small changes, verify test progresses toward passing
```

### 2.3 Implement Edge Cases

Add validation, error handling:

```typescript
// Validation
if (!data.required_field) {
  throw new Error('Required field missing')
}

// Error handling
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Failed to perform action')
}
```

### 2.4 Verify All Tests Pass

```bash
npm test -- tests/integration/[feature]/[test-name].test.ts

# Expected: ✅ All tests pass
```

**Validation**:

- [ ] All tests pass (green)
- [ ] Implementation is minimal (no over-engineering)
- [ ] Edge cases handled
- [ ] Error messages are clear

---

## 🔄 **Phase 3: REFACTOR - Clean Up**

### 3.1 Identify Refactoring Opportunities

**Common patterns to extract**:

- Duplicate code → Shared functions
- Complex logic → Separate functions
- Magic values → Named constants
- Repeated test setup → Test helpers

### 3.2 Refactor Implementation

**Example: Extract validation**:

Before:

```typescript
export async function createAdventure(data: any) {
  if (!data.title) throw new Error('Title required')
  if (!data.frame) throw new Error('Frame required')
  if (data.title.length < 3) throw new Error('Title too short')
  // ...
}
```

After:

```typescript
function validateAdventureInput(data: any) {
  if (!data.title) throw new Error('Title required')
  if (!data.frame) throw new Error('Frame required')
  if (data.title.length < 3) throw new Error('Title too short')
}

export async function createAdventure(data: any) {
  validateAdventureInput(data)
  // ...
}
```

### 3.3 Refactor Tests

**Example: Extract test setup**:

Before:

```typescript
test('test 1', async () => {
  const { user, token } = await createTestSession()
  const client = createAuthenticatedClient(token)
  // ...
})

test('test 2', async () => {
  const { user, token } = await createTestSession()
  const client = createAuthenticatedClient(token)
  // ...
})
```

After:

```typescript
describe('Feature Tests', () => {
  let user, token, client

  beforeEach(async () => {
    ;({ user, token } = await createTestSession())
    client = createAuthenticatedClient(token)
  })

  test('test 1', async () => {
    // Use client directly
  })

  test('test 2', async () => {
    // Use client directly
  })
})
```

### 3.4 Keep Tests Green

```bash
# Run tests after EVERY refactoring change
npm test -- tests/integration/[feature]

# ✅ Tests should still pass after refactoring
```

**Critical Rule**: Never refactor without green tests!

### 3.5 Check Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Coverage (should be naturally high)
npm run test:coverage -- tests/integration/[feature]
```

**Validation**:

- [ ] Code is cleaner and more readable
- [ ] No duplication
- [ ] Tests still pass
- [ ] Linting passes
- [ ] Type checking passes

---

## ✅ **Phase 4: Verification & Commit**

### 4.1 Final Validation

```bash
# Run full test suite
npm test

# Expected pass rate: 96-98% locally (acceptable)
# Some tests may be flaky in parallel execution (documented)
```

### 4.2 Coverage Check

```bash
npm run test:coverage -- tests/integration/[feature]

# Expected (from integration test):
# ✅ Statements: 99%+
# ✅ Branches: 97%+
# ✅ Functions: 99%+
# ✅ Lines: 99%+
```

**Why coverage is high**: Integration test exercises complete flow, including:

- Authentication
- Validation
- Database operations
- Business logic
- Error handling
- RLS policies

### 4.3 Commit Changes

**Three commits (TDD pattern)**:

```bash
# Commit 1: RED phase
git add tests/integration/[feature]/[test-name].test.ts
git commit -m "test: Add [feature] integration test (RED)

- Write failing integration test for [expected behavior]
- Test validates [business requirement]
- Uses real database, tests complete flow"

# Commit 2: GREEN phase
git add app/actions/[feature].ts tests/
git commit -m "feat: Implement [feature] (GREEN)

- Implement [feature] to pass integration tests
- Add validation for [edge cases]
- Handle errors gracefully
- All tests passing"

# Commit 3: REFACTOR phase (if applicable)
git add app/actions/[feature].ts tests/
git commit -m "refactor: Clean up [feature] implementation (REFACTOR)

- Extract [extracted function]
- Remove duplication
- Improve readability
- Tests still green"
```

---

## 📊 **Success Metrics**

### Quality Checklist

- [x] Tests written FIRST (RED phase)
- [x] Tests use real database (not mocked)
- [x] Tests validate business requirements
- [x] Implementation passes all tests (GREEN phase)
- [x] Code refactored for clarity (REFACTOR phase)
- [x] Coverage naturally high (99%+)
- [x] No over-mocking (only external APIs)
- [x] Tests survive refactoring

### Anti-Pattern Detection

**❌ Bad Signs** (fix if found):

- Testing implementation details (function calls, internal state)
- Mocking your own services
- Low coverage despite integration tests
- Tests break when refactoring
- Multiple concerns in one test

**✅ Good Signs**:

- Tests describe user behavior
- Tests use real database
- High coverage from few tests
- Tests survive refactoring
- Clear test names

---

## 🎓 **Common Scenarios**

### Scenario 1: Testing Server Action

```typescript
// tests/integration/adventures/create.test.ts
import { createAdventure } from '@/app/actions/adventures'

test('should create adventure with valid config', async () => {
  const { user } = await createTestSession()

  const adventure = await createAdventure({
    title: 'Test Adventure',
    frame: 'witherwild',
    config: {
      /* ... */
    },
  })

  expect(adventure.user_id).toBe(user.id)
  expect(adventure.status).toBe('draft')
})
```

### Scenario 2: Testing RLS Policies

```typescript
test('should prevent cross-user data access', async () => {
  const { user: user1 } = await createTestUser()
  const { user: user2, session: session2 } = await createTestUser()

  // User1 creates adventure
  const adventure = await createTestAdventure(user1.id)

  // User2 tries to access
  const client2 = createAuthenticatedClient(session2.access_token)
  const { data, error } = await client2
    .from('adventures')
    .select('*')
    .eq('id', adventure.id)
    .single()

  expect(data).toBeNull()
  expect(error).toBeDefined() // RLS blocks access
})
```

### Scenario 3: Testing Credit Consumption

```typescript
test('should consume one credit when generating adventure', async () => {
  const { user } = await createTestSession()

  // Check initial credits
  const { data: before } = await testClient
    .from('user_credits')
    .select('adventure_credits')
    .eq('user_id', user.id)
    .single()

  expect(before.adventure_credits).toBe(1)

  // Generate adventure
  await generateAdventure(/* config */)

  // Check credits consumed
  const { data: after } = await testClient
    .from('user_credits')
    .select('adventure_credits')
    .eq('user_id', user.id)
    .single()

  expect(after.adventure_credits).toBe(0)
})
```

---

## 🚨 **Troubleshooting**

### Test Fails in RED Phase

**Expected**: Test should fail because implementation doesn't exist.

**Unexpected failures**:

- Import errors → Fix file paths
- Database connection errors → Check test database is running
- Syntax errors → Fix test code

### Test Won't Pass in GREEN Phase

**Debug steps**:

1. Check error message carefully
2. Add console.log to see what's happening
3. Verify database state manually
4. Check authentication is working
5. Verify RLS policies allow operation

### Tests Flaky (Pass Sometimes)

**Common causes**:

- Race conditions in parallel execution (acceptable 2-5 failures locally)
- Database cleanup not complete
- Timing issues
- Shared test data

**Solutions**:

- Run test in isolation: `npm test -- [test-file]`
- Add await to async operations
- Use unique test data (timestamps, UUIDs)
- Document known flaky tests

---

## 📚 **Next Steps**

After completing TDD cycle:

1. **Write more tests** for edge cases
2. **Continue with next feature** using same TDD approach
3. **Run full test suite** to ensure no regressions
4. **Push to CI/CD** for automated validation
5. **Review coverage** (should be 99%+ naturally)

---

**Version**: 1.0
**Created**: 2025-10-16
**Usage**: `/test-integration [feature-name]`
**Pattern**: RED → GREEN → REFACTOR
**Philosophy**: Integration-First, Real Services, Business Value
