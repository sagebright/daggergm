# First Integration Test - User Authentication

**Slash Command**: `/execute-feature FEATURE_first_integration_test` (use existing command)
**Type**: Feature Implementation with TDD
**Purpose**: Write your first integration test following TDD principles
**Duration**: 1 hour
**Prerequisites**: SETUP_testing_infrastructure.md completed

---

## 🎯 **Objective**

Write your first integration test that validates the complete user authentication flow:

- User signup with email/password
- Email validation
- Password hashing
- Database record creation
- RLS policy enforcement

This test will establish patterns for all future integration tests.

---

## 📋 **Success Criteria**

- ✅ Integration test written FIRST (RED phase)
- ✅ Test fails initially (no implementation exists)
- ✅ Implementation makes test pass (GREEN phase)
- ✅ Code refactored while keeping test green (REFACTOR phase)
- ✅ Test uses real database (not mocked)
- ✅ Test validates complete user journey
- ✅ Coverage naturally high (no forced unit tests)

---

## 🔴 **Phase 1: RED - Write Failing Test**

### **Task 1.1: Create Integration Test File**

**File**: `tests/integration/auth/signup.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'vitest'
import { testClient } from '@/tests/helpers/testDatabase'
import { createTestUser } from '@/tests/helpers/testAuth'

describe('User Signup Integration', () => {
  describe('POST /auth/signup', () => {
    test('should create user with valid email and password', async () => {
      // Arrange
      const email = `test-${Date.now()}@example.com`
      const password = 'SecurePassword123!'

      // Act
      const { user, session } = await createTestUser({ email, password })

      // Assert - User created
      expect(user).toBeDefined()
      expect(user.email).toBe(email)
      expect(user.id).toBeDefined()

      // Assert - Session created
      expect(session).toBeDefined()
      expect(session.access_token).toBeDefined()

      // Assert - User exists in database
      const { data: profile } = await testClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      expect(profile).toBeDefined()
      expect(profile?.email).toBe(email)
    })

    test('should reject invalid email format', async () => {
      // Arrange
      const invalidEmail = 'not-an-email'
      const password = 'SecurePassword123!'

      // Act & Assert
      await expect(createTestUser({ email: invalidEmail, password })).rejects.toThrow(
        /invalid.*email/i,
      )
    })

    test('should reject weak password', async () => {
      // Arrange
      const email = `test-${Date.now()}@example.com`
      const weakPassword = '123' // Too short

      // Act & Assert
      await expect(createTestUser({ email, password: weakPassword })).rejects.toThrow(
        /password.*weak|short/i,
      )
    })

    test('should prevent duplicate email registration', async () => {
      // Arrange
      const email = `test-${Date.now()}@example.com`
      const password = 'SecurePassword123!'

      // Create first user
      await createTestUser({ email, password })

      // Act & Assert - Try to create duplicate
      await expect(createTestUser({ email, password })).rejects.toThrow(
        /already.*exists|duplicate/i,
      )
    })

    test('should initialize user with free credits', async () => {
      // Arrange
      const email = `test-${Date.now()}@example.com`
      const password = 'SecurePassword123!'

      // Act
      const { user } = await createTestUser({ email, password })

      // Assert - User has 1 free credit
      const { data: credits } = await testClient
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single()

      expect(credits).toBeDefined()
      expect(credits?.adventure_credits).toBe(1)
      expect(credits?.total_purchased).toBe(0)
    })
  })

  describe('RLS Policy Enforcement', () => {
    test('should only allow users to read their own profile', async () => {
      // Arrange - Create two users
      const { user: user1 } = await createTestUser()
      const { user: user2, session: session2 } = await createTestUser()

      // Create authenticated client for user2
      const user2Client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${session2.access_token}`,
            },
          },
        },
      )

      // Act - User2 tries to read User1's profile
      const { data, error } = await user2Client
        .from('profiles')
        .select('*')
        .eq('id', user1.id)
        .single()

      // Assert - Should be denied by RLS
      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error?.message).toMatch(/denied|not found/i)
    })

    test('should allow users to update their own profile', async () => {
      // Arrange
      const { user, session } = await createTestUser()

      const authenticatedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        },
      )

      // Act
      const { data, error } = await authenticatedClient
        .from('profiles')
        .update({ display_name: 'Test User' })
        .eq('id', user.id)
        .select()
        .single()

      // Assert
      expect(error).toBeNull()
      expect(data?.display_name).toBe('Test User')
    })
  })
})
```

### **Task 1.2: Run Test (Should Fail)**

```bash
npm test -- tests/integration/auth/signup.test.ts

# Expected output:
# ❌ FAIL tests/integration/auth/signup.test.ts
# ✗ should create user with valid email and password
#   Expected: user to be defined
#   Received: undefined
```

**Why it fails**: No implementation exists yet. This is correct TDD!

---

## 🟢 **Phase 2: GREEN - Implement to Pass**

### **Task 2.1: Create Database Schema**

**File**: `supabase/migrations/20250101000001_create_profiles_and_credits.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (synced with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User credits table
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  adventure_credits INTEGER NOT NULL DEFAULT 1,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  last_free_credit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO user_credits (user_id, adventure_credits)
  VALUES (NEW.id, 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Apply Migration**:

```bash
# Apply to test database
DATABASE_URL=postgresql://postgres:test_password@localhost:5433/daggergm_test \
  npx supabase db push

# Generate TypeScript types
npm run db:types
```

### **Task 2.2: Update Test Helpers**

**File**: `tests/helpers/testAuth.ts` (already created, verify it works)

```typescript
// Should already exist from SETUP_testing_infrastructure.md
// Verify createTestUser() works with new schema
```

### **Task 2.3: Run Tests Again (Should Pass)**

```bash
npm test -- tests/integration/auth/signup.test.ts

# Expected output:
# ✅ PASS tests/integration/auth/signup.test.ts (5 tests)
#   ✓ should create user with valid email and password
#   ✓ should reject invalid email format
#   ✓ should reject weak password
#   ✓ should prevent duplicate email registration
#   ✓ should initialize user with free credits
```

---

## 🔄 **Phase 3: REFACTOR - Clean Up**

### **Task 3.1: Extract Common Test Setup**

**File**: `tests/integration/auth/signup.test.ts` (refactored)

```typescript
import { describe, test, expect, beforeEach } from 'vitest'
import { testClient } from '@/tests/helpers/testDatabase'
import { createTestUser } from '@/tests/helpers/testAuth'
import { createClient } from '@supabase/supabase-js'

// Helper to create authenticated client
function createAuthenticatedClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  )
}

describe('User Signup Integration', () => {
  // Tests remain the same, but now use helper
})
```

**Move helper to shared file**:

**File**: `tests/helpers/testAuth.ts` (add function)

```typescript
// ... existing code ...

export function createAuthenticatedClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  )
}
```

### **Task 3.2: Add Test Documentation**

```typescript
/**
 * Integration tests for user authentication flow
 *
 * Tests cover:
 * - User signup with email/password
 * - Email and password validation
 * - Duplicate email prevention
 * - Automatic free credit initialization
 * - RLS policy enforcement
 *
 * Philosophy: Integration-first testing
 * - Uses real database (not mocked)
 * - Tests complete user journey
 * - Validates business requirements
 */
describe('User Signup Integration', () => {
  // ...
})
```

### **Task 3.3: Verify Tests Still Pass**

```bash
npm test -- tests/integration/auth/signup.test.ts

# ✅ All tests should still pass after refactoring
```

---

## 📊 **Validation**

### **Coverage Check**

```bash
npm run test:coverage -- tests/integration/auth/signup.test.ts

# Expected coverage (naturally high from integration test):
# ✅ Statements: 99%+
# ✅ Branches: 97%+
# ✅ Functions: 99%+
# ✅ Lines: 99%+
```

**Why coverage is high**:

- Integration test exercises complete flow
- Tests database triggers, RLS policies, validation
- No need for separate unit tests for each piece

### **Test Quality Checklist**

- [x] Tests what code **DOES** (user can sign up), not **HOW** (which functions are called)
- [x] Uses real database (not mocked)
- [x] Tests complete user journey (signup → profile created → credits initialized)
- [x] Validates business requirements (1 free credit, RLS policies)
- [x] No over-mocking (only external APIs would be mocked, none here)
- [x] Clear test names describe behavior
- [x] Follows RED → GREEN → REFACTOR cycle

---

## 🎓 **Key Lessons**

### **What Makes This Integration-First**

1. **Real Database**: Uses actual Supabase/PostgreSQL, not mocks
2. **Complete Flow**: Tests entire signup journey, not isolated pieces
3. **Business Value**: Validates requirements (free credit, RLS policies)
4. **High Coverage**: 99% coverage from one integration test
5. **Refactor-Safe**: Can change implementation without breaking tests

### **Common Mistakes Avoided**

❌ **Don't do this**:

```typescript
// Bad: Testing implementation details
test('should call createUser function', () => {
  const spy = vi.spyOn(authService, 'createUser')
  // ...
  expect(spy).toHaveBeenCalled() // Breaks on refactor!
})
```

✅ **Do this instead**:

```typescript
// Good: Testing behavior
test('should create user with valid email and password', async () => {
  const { user } = await createTestUser({ email, password })
  expect(user.email).toBe(email) // Tests what matters!
})
```

---

## 📚 **Next Steps**

Now that you have your first integration test:

1. **FEATURE_adventure_creation_test.md** - Test adventure creation flow
2. **FEATURE_credit_consumption_test.md** - Test credit atomicity
3. **CONTRACT_openai_scaffold_test.md** - Test OpenAI contract (15% bucket)

---

## 🚨 **Troubleshooting**

### Tests Fail with "relation does not exist"

```bash
# Schema not applied to test database
DATABASE_URL=postgresql://postgres:test_password@localhost:5433/daggergm_test \
  npx supabase db push
```

### Tests Fail with "RLS policy violation"

```bash
# Check RLS policies are created:
psql -U postgres -h localhost -p 5433 -d daggergm_test \
  -c "SELECT * FROM pg_policies WHERE tablename = 'profiles';"
```

### Tests Pass but Coverage is Low

```bash
# This shouldn't happen with integration tests!
# If it does, you might be over-mocking. Check:
# 1. Are you using real database?
# 2. Are you mocking your own code?
# 3. Are you testing implementation details?
```

---

**Version**: 1.0
**Created**: 2025-10-16
**Estimated Time**: 1 hour
**Difficulty**: Moderate
**Pattern**: Integration-First TDD
