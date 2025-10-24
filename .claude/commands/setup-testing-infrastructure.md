# Setup Testing Infrastructure

**Purpose**: One-command setup of complete integration-first testing foundation for DaggerGM

## Document: $ARGUMENTS

**Default**: If no argument provided, use `documentation/SETUP_testing_infrastructure.md`

---

## 🎯 **Execution Strategy**

This command sets up the testing infrastructure in a systematic, validated way:

1. Read and understand the setup document
2. Verify prerequisites (Next.js project, Supabase configured)
3. Execute each task sequentially with validation
4. Create all necessary files and directories
5. Verify complete setup works end-to-end

---

## 🚀 **Phase 1: Prerequisites Check**

### 1.1 Verify Environment

```bash
# Check Node.js version
node --version  # Should be 18+ or 20+

# Check package.json exists
test -f package.json && echo "✅ Next.js project exists" || echo "❌ Not a Next.js project"

# Check Supabase configuration
test -d supabase && echo "✅ Supabase initialized" || echo "⚠️  Supabase not initialized"

# Check git repository
git status > /dev/null 2>&1 && echo "✅ Git repository" || echo "❌ Not a git repository"
```

### 1.2 Read Setup Document

```
✅ MANDATORY READS:
□ Read target document: $ARGUMENTS or documentation/SETUP_testing_infrastructure.md
□ Understand each task and its validation steps
□ Note prerequisites for each task
□ Identify files to create
□ Plan execution order
```

---

## 🔧 **Phase 2: Task Execution**

### Use TodoWrite for Progress Tracking

```
Create comprehensive task list from document:
□ Task 1: Local Test Database Setup
□ Task 2: Vitest Configuration
□ Task 3: Test Helper Utilities
□ Task 4: MSW Setup for OpenAI Mocking
□ Task 5: Directory Structure
□ Task 6: CI/CD Configuration
□ Task 7: Documentation
```

### Execute Each Task Sequentially

For each task:

1. Mark as `in_progress` in TodoWrite
2. Create/modify files as specified
3. Run validation commands
4. Verify success before proceeding
5. Mark as `completed` in TodoWrite
6. Commit changes with descriptive message

---

## 📋 **Task 1: Local Test Database Setup**

### 1.1 Check PostgreSQL Installation

```bash
# Check if PostgreSQL is installed
psql --version

# If not installed:
# macOS: brew install postgresql@14
# Ubuntu: sudo apt-get install postgresql-14
```

### 1.2 Use Supabase Local Database

```bash
# Start Supabase local development
npx supabase start

# This automatically creates a test database with:
# - PostgreSQL on port 54322
# - Supabase Studio on port 54323
# - API on port 54321
```

### 1.3 Verify Database Running

```bash
# Check Supabase status
npx supabase status

# You should see all services running
```

### 1.4 Create .env.test.local

Create file with test database credentials:

```bash
# .env.test.local
# Get these values from: npx supabase status
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from supabase status - anon key]
SUPABASE_SERVICE_ROLE_KEY=[from supabase status - service_role key]
OPENAI_API_KEY=sk-test-key-not-used-in-tests
```

**Add to .gitignore**:

```bash
echo ".env.test.local" >> .gitignore
```

### 1.5 Apply Schema to Test Database

```bash
# Apply Supabase migrations to local database
npx supabase db push
```

### 1.6 Validation

```bash
# Verify database is accessible and has schema
npx supabase db diff

# View in Supabase Studio
open http://127.0.0.1:54323
```

**✅ Checkpoint**: Database created and accessible

---

## 📋 **Task 2: Vitest Configuration**

### 2.1 Install Dependencies

```bash
npm install -D vitest @vitejs/plugin-react @vitest/ui
```

### 2.2 Create vitest.config.ts

Use exact configuration from setup document.

### 2.3 Create tests/setup.ts

Use exact setup from document with:

- dotenv config loading
- Database cleanup hooks
- MSW setup (will add in Task 4)

### 2.4 Validation

```bash
# Verify Vitest is installed
npx vitest --version

# Try running (will fail gracefully, no tests yet)
npx vitest run --reporter=verbose
```

**✅ Checkpoint**: Vitest configured and runnable

---

## 📋 **Task 3: Test Helper Utilities**

### 3.1 Create Directory Structure

```bash
mkdir -p tests/helpers
```

### 3.2 Create Test Helper Files

Create each file from document:

- `tests/helpers/testDatabase.ts`
- `tests/helpers/testAuth.ts`
- `tests/helpers/testAdventures.ts`

### 3.3 Validation

```bash
# Verify imports work
npx tsc --noEmit --skipLibCheck

# Or create simple test file to verify
cat > tests/helpers.test.ts << 'EOF'
import { test, expect } from 'vitest';
import { testClient } from './helpers/testDatabase';

test('testClient is defined', () => {
  expect(testClient).toBeDefined();
});
EOF

npx vitest run tests/helpers.test.ts
rm tests/helpers.test.ts
```

**✅ Checkpoint**: Test helpers created and importable

---

## 📋 **Task 4: MSW Setup**

### 4.1 Install MSW

```bash
npm install -D msw@latest
```

### 4.2 Create MSW Files

```bash
mkdir -p tests/mocks
```

Create:

- `tests/mocks/handlers.ts`
- `tests/mocks/server.ts`

### 4.3 Update tests/setup.ts

Add MSW initialization as shown in document.

### 4.4 Validation

```bash
# Create simple test to verify MSW works
cat > tests/msw.test.ts << 'EOF'
import { test, expect } from 'vitest';

test('MSW server is initialized', () => {
  // MSW setup happens in tests/setup.ts
  expect(true).toBe(true);
});
EOF

npx vitest run tests/msw.test.ts
rm tests/msw.test.ts
```

**✅ Checkpoint**: MSW configured for API mocking

---

## 📋 **Task 5: Directory Structure**

### 5.1 Create Test Directories

```bash
mkdir -p tests/{integration/{auth,adventures,credits},contract/openai,unit/utils}
```

### 5.2 Create Placeholder README Files

```bash
# Add README to each directory explaining its purpose
cat > tests/integration/README.md << 'EOF'
# Integration Tests (80%)

Full API endpoint tests with real database.
Test complete user journeys from request to response.
EOF

cat > tests/contract/README.md << 'EOF'
# Contract Tests (15%)

External service boundary tests.
Mock external APIs (OpenAI), test our adapter logic.
EOF

cat > tests/unit/README.md << 'EOF'
# Unit Tests (5%)

Pure business logic functions only.
No database, no external services.
EOF
```

### 5.3 Validation

```bash
# Verify structure
tree tests/ -L 2

# Expected output:
# tests/
# ├── contract/
# │   ├── README.md
# │   └── openai/
# ├── helpers/
# │   ├── testAdventures.ts
# │   ├── testAuth.ts
# │   └── testDatabase.ts
# ├── integration/
# │   ├── README.md
# │   ├── adventures/
# │   ├── auth/
# │   └── credits/
# ├── mocks/
# │   ├── handlers.ts
# │   └── server.ts
# ├── setup.ts
# └── unit/
#     ├── README.md
#     └── utils/
```

**✅ Checkpoint**: Directory structure created

---

## 📋 **Task 6: CI/CD Configuration**

### 6.1 Create GitHub Actions Workflow

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/test.yml` with exact config from document.

### 6.2 Add Test Scripts to package.json

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

### 6.3 Add GitHub Secrets (Manual Step)

**Document for user**:

```
⚠️  MANUAL STEP REQUIRED:

Add these secrets to GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - TEST_SUPABASE_ANON_KEY
   - TEST_SUPABASE_SERVICE_KEY

These should match your .env.test.local values.
```

### 6.4 Validation

```bash
# Verify workflow file is valid YAML
npx js-yaml .github/workflows/test.yml > /dev/null && echo "✅ Valid YAML" || echo "❌ Invalid YAML"

# Verify scripts added
npm run test:run --version
```

**✅ Checkpoint**: CI/CD configured

---

## 📋 **Task 7: Documentation**

### 7.1 Create tests/README.md

Use exact content from setup document.

### 7.2 Update Root README (if exists)

Add testing section:

```markdown
## Testing

This project uses an integration-first testing strategy (80/15/5).

### Running Tests

\`\`\`bash

# Watch mode

npm test

# Run once

npm run test:run

# With coverage

npm run test:coverage

# UI mode

npm run test:ui
\`\`\`

See [tests/README.md](tests/README.md) for full testing guide.
```

### 7.3 Validation

```bash
# Verify README exists and is readable
test -f tests/README.md && echo "✅ Test README exists"
```

**✅ Checkpoint**: Documentation complete

---

## ✅ **Phase 3: Final Validation**

### 3.1 Run Complete Validation Suite

```bash
# 1. Supabase running
npx supabase status

# 2. Environment variables loaded
test -f .env.test.local && echo "✅ Test env configured"

# 3. Vitest runs
npm run test:run

# 4. TypeScript compiles
npm run typecheck

# 5. Linter passes
npm run lint

# 6. Directory structure exists
test -d tests/integration && test -d tests/contract && test -d tests/unit && echo "✅ Structure complete"

# 7. Test helpers importable
node -e "require('./tests/helpers/testDatabase')" 2>/dev/null && echo "✅ Helpers work"
```

### 3.2 Validation Checklist

Present to user:

```
🎉 Testing Infrastructure Setup Complete!

✅ Validation Results:
- [ ] Supabase local running on port 54321/54322
- [ ] Local database schema applied
- [ ] .env.test.local configured
- [ ] Vitest installed and configured
- [ ] Test helpers created (testDatabase, testAuth, testAdventures)
- [ ] MSW configured for API mocking
- [ ] Directory structure created (integration/contract/unit)
- [ ] GitHub Actions workflow created
- [ ] tests/README.md documentation created
- [ ] package.json scripts added

📚 Next Steps:
1. Run: /execute-feature FEATURE_first_integration_test
2. Write your first integration test
3. Follow TDD: RED → GREEN → REFACTOR
```

---

## 🚨 **Error Recovery**

### Database Connection Failed

```bash
# Check Supabase is running
npx supabase status

# If not running, start it:
npx supabase start

# If stuck, try resetting:
npx supabase stop
npx supabase start
```

### Vitest Import Errors

```bash
# Regenerate tsconfig paths
# Ensure vitest.config.ts has correct resolve.alias
# Ensure tsconfig.json has correct paths
```

### MSW Not Working

```bash
# Verify MSW version
npm list msw

# Should be v2.0+ for Node 18+
# If old version:
npm install -D msw@latest
```

---

## 📊 **Completion Report**

After successful setup, generate report:

```markdown
# Testing Infrastructure Setup - Completion Report

**Date**: [timestamp]
**Duration**: [time taken]

## Summary

Successfully set up integration-first testing infrastructure for DaggerGM.

## Components Installed

- Supabase local (ports 54321-54323)
- Vitest test runner
- MSW for API mocking
- Test helper utilities
- GitHub Actions CI/CD

## Metrics

- Files created: ~15
- Dependencies installed: 4
- Test coverage target: 99%
- Expected test runtime: < 60s

## Ready For

✅ Writing first integration test
✅ TDD development workflow
✅ CI/CD automated testing

## Next Command

\`\`\`bash
/execute-feature FEATURE_first_integration_test
\`\`\`
```

---

**Version**: 1.0
**Created**: 2025-10-16
**Usage**: `/setup-testing-infrastructure [document-path]`
**Estimated Time**: 2-3 hours
**Automation Level**: High (90% automated, 10% validation)
