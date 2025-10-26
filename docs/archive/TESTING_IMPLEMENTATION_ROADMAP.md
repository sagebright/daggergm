# Testing Implementation Roadmap

## Integration-First Strategy for DaggerGM

**Created**: 2025-10-16
**Purpose**: Guide for implementing battle-tested integration-first testing infrastructure
**Philosophy**: 80% Integration, 15% Contract, 5% Unit

---

## 📚 **Documents Created**

### Setup & Infrastructure

1. **SETUP_testing_infrastructure.md**
   - **Command**: `/setup-testing-infrastructure`
   - **Purpose**: Complete testing foundation setup
   - **Duration**: 2-3 hours
   - **Deliverables**: Local PostgreSQL, Vitest, MSW, test helpers, CI/CD

2. **INTEGRATION_FIRST_TESTING_STRATEGY.md** (Reference)
   - **Location**: `CLAUDE/Canarie Docs/`
   - **Purpose**: Philosophy and patterns documentation
   - **Source**: Battle-tested from production multi-tenant SaaS

### Feature Implementation

3. **FEATURE_first_integration_test.md**
   - **Command**: `/execute-feature FEATURE_first_integration_test`
   - **Purpose**: Write your first integration test (user auth)
   - **Duration**: 1 hour
   - **Pattern**: TDD (RED → GREEN → REFACTOR)

---

## 🤖 **Agents Created**

### Testing Specialist

**integration-test-specialist**

- **File**: `.claude/agents/testing/integration-test-specialist.md`
- **Use When**: Writing ANY feature tests
- **Invocation**: "Use integration-test-specialist to test [feature]"
- **Expertise**:
  - Integration-first patterns (80%)
  - RLS policy testing
  - Credit consumption testing
  - LLM integration (with MSW mocks)
  - Server Action testing
  - TDD workflow enforcement

---

## ⚡ **Slash Commands Created**

### 1. /setup-testing-infrastructure

**File**: `.claude/commands/setup-testing-infrastructure.md`

**Usage**:

```bash
/setup-testing-infrastructure
# OR
/setup-testing-infrastructure documentation/SETUP_testing_infrastructure.md
```

**What it does**:

- Checks prerequisites
- Sets up local PostgreSQL test database
- Configures Vitest for Next.js
- Creates test helpers (testDatabase, testAuth, testAdventures)
- Sets up MSW for OpenAI mocking
- Creates test directory structure
- Configures CI/CD with auto-retry
- Creates documentation

**Validation**: Complete checklist at end

---

### 2. /test-integration

**File**: `.claude/commands/test-integration.md`

**Usage**:

```bash
/test-integration user-signup
/test-integration adventure-creation
/test-integration credit-consumption
```

**What it does**:

- Enforces TDD workflow (RED → GREEN → REFACTOR)
- Guides test type selection (integration/contract/unit)
- Creates integration test with real database
- Implements minimal solution
- Refactors while keeping tests green
- Validates coverage (99%+ naturally)

**Philosophy**: Test what code DOES, not HOW

---

## 🎯 **Implementation Sequence**

### Week 1: Infrastructure (DO FIRST)

```bash
# Step 1: Set up testing infrastructure
/setup-testing-infrastructure

# Deliverables:
✅ Local PostgreSQL running on port 5433
✅ Vitest configured
✅ MSW for OpenAI mocking
✅ Test helpers created
✅ CI/CD workflow configured
✅ Documentation complete
```

**Validation Checklist**:

- [ ] PostgreSQL running: `pg_isready -h localhost -p 5433`
- [ ] Test database exists: `psql -U postgres -h localhost -p 5433 -l | grep daggergm_test`
- [ ] Vitest works: `npm test -- --version`
- [ ] Can import helpers: `import { testClient } from '@/tests/helpers/testDatabase'`
- [ ] Directory structure created: `ls tests/{integration,contract,unit}`

---

### Week 1-2: First Integration Test

```bash
# Step 2: Write first integration test
/execute-feature FEATURE_first_integration_test

# Deliverables:
✅ User signup integration test
✅ Database schema (profiles, user_credits)
✅ RLS policies tested
✅ TDD workflow demonstrated
✅ 99% coverage from integration test
```

**Validation**:

```bash
npm test -- tests/integration/auth/signup.test.ts
# Expected: ✅ All 5 tests passing

npm run test:coverage -- tests/integration/auth
# Expected: 99%+ coverage
```

---

### Week 2+: Feature Development with TDD

For EVERY new feature, use TDD:

```bash
# Pattern for each feature:

# 1. Write integration test first (RED)
/test-integration [feature-name]

# 2. Implement to pass (GREEN)
# Write minimal code to make test pass

# 3. Refactor (REFACTOR)
# Clean up code while keeping tests green

# 4. Validate
npm test -- tests/integration/[feature]
npm run test:coverage
```

**Example Flow**:

```bash
# Adventure Creation
/test-integration adventure-creation
# → Write test for createAdventure()
# → Implement Server Action
# → Refactor
# → Verify coverage 99%+

# Credit Consumption
/test-integration credit-consumption
# → Write test for atomic credit consumption
# → Implement credit check and decrement
# → Refactor
# → Verify no race conditions

# LLM Integration (Contract Test)
/test-integration scaffold-generation
# → Write test with MSW mocking OpenAI
# → Implement LLM service adapter
# → Test error scenarios
# → Verify contract compliance
```

---

## 📊 **Quality Standards**

### Coverage Targets (Naturally Achieved)

From integration tests alone:

- ✅ **Lines**: 99%
- ✅ **Functions**: 99%
- ✅ **Statements**: 99%
- ✅ **Branches**: 97%

**Why naturally high**: Integration tests exercise complete flows including:

- Authentication
- Validation
- Database operations
- Business logic
- Error handling
- RLS policies

### Test Distribution (80/15/5)

**Integration Tests (80%)**:

```
tests/integration/
├── auth/               # User signup, login, session
├── adventures/         # Create, generate, lock, export
└── credits/           # Consumption, purchase, validation
```

**Contract Tests (15%)**:

```
tests/contract/
└── openai/            # Scaffold, expansion, errors, streaming
```

**Unit Tests (5%)**:

```
tests/unit/
└── utils/             # Formatting, validation (pure functions only)
```

### Performance Targets

**Local Development**:

- Individual test: < 100ms
- Integration test: < 500ms
- Full suite: < 60 seconds
- Pass rate: 96-98% (acceptable with known flaky tests)

**CI/CD**:

- Duration: 2-4 minutes
- Pass rate: 98%+ (with --retry=2)
- Auto-retry for flaky tests

---

## 🚨 **Critical Success Factors**

### DO ✅

1. **Write tests FIRST** (TDD)
   - RED: Write failing test
   - GREEN: Implement minimal solution
   - REFACTOR: Clean up while tests stay green

2. **Use real database** (not mocked)
   - Test database: Local PostgreSQL
   - Real Supabase client
   - Real RLS policies

3. **Test user behavior** (not implementation)
   - Test WHAT code does
   - Not HOW it does it
   - Tests survive refactoring

4. **Mock external APIs only** (OpenAI)
   - Use MSW for OpenAI
   - Never mock your own services
   - Test real integration

5. **Let coverage emerge naturally**
   - Integration tests → 99% coverage
   - No need to force unit tests
   - Business requirements validated

### DON'T ❌

1. **Don't mock your own code**

   ```typescript
   // ❌ Bad
   vi.mock('@/lib/database')
   vi.mock('@/app/actions/adventures')
   ```

2. **Don't test implementation details**

   ```typescript
   // ❌ Bad
   expect(spy).toHaveBeenCalledWith(/* args */)

   // ✅ Good
   expect(adventure.title).toBe('Test Adventure')
   ```

3. **Don't write unit tests for database operations**

   ```typescript
   // ❌ Bad: Unit test for DB operation
   test('createAdventure inserts into database', () => {
     // Mock database, test function
   })

   // ✅ Good: Integration test
   test('should create adventure in database', async () => {
     const adventure = await createAdventure(config)
     const { data } = await testClient
       .from('adventures')
       .select('*')
       .eq('id', adventure.id)
       .single()
     expect(data).toBeDefined()
   })
   ```

4. **Don't skip TDD phases**
   - Must write test FIRST (RED)
   - Must verify test fails
   - Must implement to pass (GREEN)
   - Must refactor (REFACTOR)

5. **Don't create unnecessary test data**

   ```typescript
   // ❌ Bad: Create what you don't use
   beforeEach(async () => {
     await createThousandsOfRecords()
   })

   // ✅ Good: Create what you need
   test('specific test', async () => {
     const user = await createTestUser() // Only this
   })
   ```

---

## 🎓 **Key Learnings from Canarie Strategy**

### What Makes This Strategy Successful

1. **Integration-first naturally achieves 99% coverage**
   - One integration test exercises entire flow
   - Covers auth, validation, DB, business logic
   - No need for dozens of unit tests

2. **Real services catch real bugs**
   - Database constraints
   - RLS policies
   - Validation logic
   - Integration issues

3. **Tests survive refactoring**
   - Test behavior, not implementation
   - Change HOW it works without breaking tests
   - Confident refactoring

4. **Fast feedback despite real database**
   - Local PostgreSQL is fast (< 10ms queries)
   - Transaction-based cleanup (< 10ms)
   - Parallel execution (60s for full suite)

5. **Pragmatic quality standards**
   - 96-98% pass rate locally (acceptable)
   - CI/CD auto-retry handles flaky tests
   - Fast feedback > perfect consistency

### Proven Results (from Canarie)

- **224 tests** in 75-85 seconds locally
- **99% coverage** from integration tests
- **96-98% pass rate** locally (with known flaky tests)
- **98%+ CI/CD** with --retry=2 auto-retry
- **70% reduction** in CI/CD minutes (smart workflows)

---

## 📚 **Additional Documents Needed**

### Coming Soon

1. **FEATURE_adventure_creation_test.md**
   - Test adventure creation flow
   - Frame validation
   - Status transitions

2. **FEATURE_credit_consumption_test.md**
   - Atomic credit consumption
   - Insufficient credits handling
   - Race condition prevention

3. **CONTRACT_openai_scaffold_test.md**
   - OpenAI contract testing
   - Error scenarios
   - Streaming responses

4. **FEATURE_focus_mode_test.md**
   - Movement locking
   - Regeneration with locked content
   - State persistence

5. **FEATURE_export_test.md**
   - Markdown export
   - PDF export (future)
   - Offline functionality

---

## 🔄 **Continuous Improvement**

### After Each Feature

- [ ] Review test coverage (should be 99%+)
- [ ] Document any new patterns discovered
- [ ] Update test helpers if needed
- [ ] Add to known flaky tests list (if applicable)

### Weekly

- [ ] Review test suite performance
- [ ] Optimize slow tests (> 500ms)
- [ ] Clean up test database
- [ ] Update documentation

### Monthly

- [ ] Audit test distribution (80/15/5)
- [ ] Review coverage trends
- [ ] Update testing strategy based on learnings
- [ ] Share best practices with team

---

## 🚀 **Getting Started**

### Immediate Next Steps

```bash
# 1. Set up testing infrastructure (2-3 hours)
/setup-testing-infrastructure

# 2. Verify setup
npm test
npm run test:ui

# 3. Write first integration test (1 hour)
/execute-feature FEATURE_first_integration_test

# 4. Continue with TDD for every feature
/test-integration [feature-name]
```

### Success Checklist

After infrastructure setup:

- [ ] Can run tests: `npm test`
- [ ] Can see coverage: `npm run test:coverage`
- [ ] Can use test helpers: `import { createTestUser } from '@/tests/helpers/testAuth'`
- [ ] MSW mocks OpenAI: Check `tests/mocks/handlers.ts`
- [ ] CI/CD configured: Check `.github/workflows/test.yml`

After first test:

- [ ] Tests pass: `npm test -- tests/integration/auth/signup.test.ts`
- [ ] Coverage high: 99%+ from one integration test
- [ ] Followed TDD: RED → GREEN → REFACTOR
- [ ] Committed in phases: test commit, implementation commit, refactor commit

---

## 📖 **Resources**

**Internal Documentation**:

- [Integration-First Strategy](../CLAUDE/Canarie Docs/INTEGRATION_FIRST_TESTING_STRATEGY.md)
- [CLAUDE.md Testing Section](../CLAUDE.md#testing-standards)
- [Test README](../tests/README.md)

**External Resources**:

- [Vitest Documentation](https://vitest.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Version**: 1.0
**Last Updated**: 2025-10-16
**Next Review**: After MVP implementation
**Status**: Ready for implementation

---

## 🎉 **Quick Start Command**

```bash
# One command to start:
/setup-testing-infrastructure

# Then follow with:
/execute-feature FEATURE_first_integration_test

# For each new feature:
/test-integration [feature-name]
```

**Remember**: Test what your code **DOES**, not **HOW** it does it. Use real database. Let coverage emerge naturally. Ship with confidence. 🚀
