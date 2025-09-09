# 🧪 Testing Strategy & Guidelines

## 🎯 Testing Philosophy

**99% Coverage for New Code** - New code should have 99% unit test coverage for Lines and Functions, 97% for Branches
**Pragmatic Maintenance** - Existing code improved incrementally while maintaining CI/CD stability

## 🏗️ Test Structure

### Backend (Node.js/Express)

```
/tests
├── routes/           # Mirror routes/ structure
├── services/         # Mirror services/ structure
└── integration/      # End-to-end API tests
```

**Test Pattern for Services/Routes:**

- ✅ **One success case** (e.g., successful card identification)
- ✅ **One failure case** (e.g., invalid image upload)
- ✅ **One edge case** (e.g., unrecognizable card, rate limit exceeded)

### Frontend (React)

```
/src/components
└── ComponentName/
    ├── ComponentName.jsx
    └── __tests__/
        └── ComponentName.test.jsx
```

## 🚀 CI/CD Testing

### GitHub Actions Configuration

```yaml
- name: Run Tests
  timeout-minutes: 15 # Prevent infinite hangs
  run: npm run test:ci
```

### Test Scripts

```json
{
  "test:ci": "jest --forceExit --detectOpenHandles --maxWorkers=2"
}
```

### Coverage Targets

- **New Code**: 99% Lines/Functions, 97% Branches (enforced for new implementations)
- **Overall Project**: 85% target (current CI threshold: 8-15% while improving incrementally)
- **Legacy Code**: Improved during maintenance, not blocking deployments

## 🎭 Mocking Strategy

### External Dependencies

```javascript
// Mock external services comprehensively
jest.mock('winston')
jest.mock('sharp')
jest.mock('tesseract.js')
jest.mock('axios')
jest.mock('node-fetch')
```

### Database Mocking

```javascript
// Mock Supabase operations
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  })),
}
```

## 🚧 **FRONTEND ENVIRONMENT DEBUGGING**

### **Environment Mismatch Investigation Protocol**

```
🔍 SYSTEMATIC INVESTIGATION CHECKLIST:
□ Compare jest.config.js local vs CI configuration
□ Verify setupTests.js environment setup differences
□ Check Node.js/npm version alignment (local vs CI)
□ Validate test timeout configurations match
□ Review package.json test scripts for flag differences
□ Check for environment-specific dependency versions
□ Verify mock configurations work in both environments
```

### **Hanging Tests Diagnosis**

```bash
# Step-by-step hanging test investigation:

# 1. Check for infinite loops
npm test -- --verbose --detectOpenHandles

# 2. Force test exit to identify stuck processes
npm test -- --forceExit --maxWorkers=1

# 3. Increase timeout for environment differences
npm test -- --testTimeout=30000

# 4. Run specific test suites to isolate issues
npm test -- src/components/[ComponentName] --verbose

# 5. Check for async operations not completing
npm test -- --detectOpenHandles --forceExit
```

### **Environment Alignment Commands**

```bash
# Local vs CI environment comparison:
node --version                    # Verify Node.js version
npm --version                     # Verify npm version
npm ls                           # Check dependency versions
npm test -- --verbose --detectOpenHandles  # Detect hanging resources

# CI simulation flags:
npm test -- --forceExit --detectOpenHandles --maxWorkers=2 --testTimeout=15000
```

### **Mock Cleanup Verification**

```javascript
// Ensure proper mock cleanup between tests:
describe('Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    // Clear any component state
  })

  afterEach(() => {
    jest.restoreAllMocks()
    cleanup() // From @testing-library/react
    // Close any open connections
  })

  afterAll(() => {
    jest.resetModules()
    // Final cleanup
  })
})
```

### **Temporarily Skipped Tests**

```javascript
// Use these patterns for problematic tests
describe.skip('PhotoUpload', () => {
  // TODO: Fix react-dropzone mocking
})

test.skip('should handle file upload', () => {
  // TODO: Fix component mocking
})
```

### **Current Skipped Areas & Resolutions**

- **PhotoUpload**: File upload and camera mocking → Check FormData/File API mocks
- **CardIdentifier**: API integration complexity → Verify axios interceptor mocking
- **CardList**: Infinite loop detection → Check useEffect dependency arrays
- **Navigation**: react-router-dom mocking → Verify MemoryRouter setup
- **Error Boundaries**: React 18 compatibility → Check ErrorBoundary test patterns

### **Environment-Specific Debugging**

```javascript
// Environment detection in tests:
const isCI = process.env.CI === 'true'
const testTimeout = isCI ? 30000 : 15000

describe('Environment-sensitive tests', () => {
  beforeEach(() => {
    if (isCI) {
      // CI-specific setup
      jest.setTimeout(testTimeout)
    }
  })
})
```

## ✅ Testing Checklist

### **Before Committing (MANDATORY SEQUENCE)**

```bash
# Execute in exact order:
npm run lint --fix                    # Fix style issues first
npm test -- --verbose                 # All tests must pass
npm run build                         # Verify build succeeds
npm test -- --coverage               # Check coverage impact
```

### **CI/CD Readiness Checklist**

- [ ] `npm run test:ci` passes (CI environment simulation)
- [ ] `npm run lint` passes without errors
- [ ] No console.errors or warnings in test output
- [ ] Mock external APIs (OCR, pricing services) properly
- [ ] Tests pass with --forceExit --detectOpenHandles flags
- [ ] No hanging tests or infinite loops detected
- [ ] Environment alignment verified (Node.js/npm versions)

### New Feature Testing

- [ ] Component renders without crashing
- [ ] Happy path works
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Network failures graceful

## 🔄 Test Improvement Strategy

### Phase 1: Foundation (COMPLETED ✅)

**Target: 25% coverage**

1. ✅ Test critical utility functions (imageUtils, helpers)
2. ✅ Test authentication service (useAuth hook)
3. ✅ Test API error handling (interceptors)

**Results:**

- **imageUtils.js**: 32 comprehensive tests covering URL construction, environment handling, edge cases
- **helpers.js**: 58 tests for utility functions (currency formatting, JWT parsing, validation)
- **useAuth.js**: 45 tests for authentication flows, token refresh, role-based access
- **api.js**: 51 tests for interceptors, error handling (401/403/422/429/500), concurrent requests
- **Total**: 186+ new tests with comprehensive mocking and error scenarios

### Phase 2: Core Business Logic (NEXT)

**Target: 50% coverage**

1. Card processing workflows
2. OCR service testing (critical patterns)
3. Pricing calculations
4. Quote management flows

### Phase 3: UI Components

**Target: 70% coverage**

1. Re-enable skipped component tests
2. Fix mocking issues individually
3. Add integration tests

### Phase 4: Integration & Edge Cases

**Target: 80%+ coverage**

1. End-to-end workflow testing
2. Performance and load testing
3. Error boundary testing

## 📊 Current Test Coverage Status

### Completed (Phase 1 + Stabilization) ⭐ **UPDATED**

- **Utility Functions**: ~60% coverage (up from 4%) with helpers.js and imageUtils.js fully tested
- **Authentication**: 90%+ coverage with useAuth hook comprehensive testing
- **API Service**: 70%+ coverage with interceptors and error handling
- **Core Components**: 50%+ coverage with Navigation, Dashboard, Admin components stable
- **Total Tests Passing**: 105+ tests with zero flaky failures ⭐ **NEW**
- **Code Quality**: ESLint compliant across all tested components ⭐ **NEW**

### Test Infrastructure Achievements ⭐ **UPDATED**

- **Zero Flaky Tests**: Consistent test execution with no random failures
- **Comprehensive Mocking**: DOM APIs, Date objects, localStorage, axios interceptors
- **Testing Library Compliance**: No direct DOM access or multiple waitFor assertions
- **React Hook Standards**: All useCallback and useEffect dependencies properly configured
- **Theme System Clean**: Complete removal of ThemeContext dependencies
- **Error Scenario Coverage**: Network failures, validation errors, timeout handling

### Resolved Issues (August 9, 2025) ✅ **COMPLETE**

- ✅ lodash-es import issues with @vibe/core (fixed with transformIgnorePatterns update)
- ✅ ThemeContext removal completed across all test files and setupTests.js
- ✅ DOM mocking standardized for downloadFile, copyToClipboard, createElement functions
- ✅ API interceptor tests simplified to avoid axios.create timing issues
- ✅ Navigation component tests fixed with proper hasRole/isSuperAdmin mocking
- ✅ Dashboard component tests fixed by eliminating multiple waitFor assertions
- ✅ useAuth tests streamlined for hook lifecycle management
- ✅ React Hook dependency warnings resolved in Admin components
- ✅ Testing Library violations eliminated (direct DOM access, conditional expects)
- ✅ Console statement cleanup completed across all components

## 📋 New Code Testing Requirements

### Implementation Standards

When implementing new features or significant changes:

1. **Pre-implementation**: Write failing tests first (TDD approach recommended)
2. **During implementation**: Maintain 99% line and function coverage
3. **Branch coverage**: Target 97% branch coverage for all conditional logic
4. **Error handling**: Test all error scenarios and edge cases
5. **Mocking**: Mock all external dependencies and side effects

### Enforcement

- All new code must pass these coverage thresholds before code review
- Use `npm run test:coverage -- --collectCoverageFrom="path/to/new/code/**/*.{js,jsx}"` to verify
- Legacy code improvements are welcome but not required to meet these standards

---

**Version**: 2025-08-22 | **Previous**: 2025-08-09 | **Major Changes**: Added comprehensive frontend environment debugging protocols, hanging test diagnosis procedures, and systematic CI/CD environment alignment strategies
