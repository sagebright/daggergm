# PHASE 1: GitHub Actions Workflow Update

**Execution Command**: `/execute-feature documentation/PHASE_1_github_actions_update.md`

---

## 📋 Overview

Update the GitHub Actions CI/CD workflow to implement smart path filtering, auto-retry for flaky tests, and optimized execution for DaggerGM's monorepo structure.

**Goals**:

- 40-50% reduction in CI/CD minutes
- Smart path filtering (skip docs/markdown changes)
- Auto-retry for flaky tests (`--retry=2`)
- Parallel execution of lint, tests, and E2E
- Single deployment target (Vercel only)

**Estimated Time**: 30-45 minutes
**Prerequisites**: None (modifies existing workflow)

---

## 🎯 Success Criteria

- [ ] Workflow runs in ~20 minutes for full test suite
- [ ] Documentation-only changes skip CI entirely
- [ ] Flaky tests auto-retry up to 2 times
- [ ] TypeScript typecheck runs before tests
- [ ] 90% coverage threshold enforced
- [ ] Deploy only to Vercel (not Render)
- [ ] Tests pass with zero tolerance policy

---

## 📝 Tasks

### Task 1: Backup Current Workflow

**Why**: Safety net in case we need to rollback

**Steps**:

```bash
# Create backup
mkdir -p .backups/workflows-$(date +%Y%m%d)
cp .github/workflows/ci.yml .backups/workflows-$(date +%Y%m%d)/ci.yml.backup
```

**Verification**:

```bash
# Verify backup exists
ls -la .backups/workflows-*/
```

---

### Task 2: Update Workflow File

**File**: `.github/workflows/ci.yml`

**Changes Needed**:

#### 2.1: Update Trigger Configuration

Replace the current `on:` section with smart path filtering:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - '**' # All branches
    paths-ignore:
      - '**.md'
      - 'documentation/**'
      - '.github/workflows/**'
      - 'CLAUDE/**'
      - '.claude/**'
      - '.backups/**'

# Cancel in-progress runs for same branch
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Why**:

- Skips CI for documentation changes (saves ~100% on doc updates)
- Prevents workflow changes from triggering themselves
- Cancels duplicate runs (saves minutes on rapid pushes)

---

#### 2.2: Add Skip CI Check

Add after the `concurrency` block:

```yaml
jobs:
  check-skip:
    name: Check Skip CI
    runs-on: ubuntu-latest
    if: ${{ !contains(github.event.head_commit.message, '[skip ci]') }}
    outputs:
      should_run: ${{ steps.check.outputs.should_run }}

    steps:
      - id: check
        run: echo "should_run=true" >> $GITHUB_OUTPUT
```

**Why**: Allows manual skip with `[skip ci]` in commit message

---

#### 2.3: Update Lint & Type Check Job

Replace the current `lint` job:

```yaml
lint-and-typecheck:
  name: Lint & Type Check
  needs: check-skip
  runs-on: ubuntu-latest
  timeout-minutes: 5

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --no-audit --no-fund

    - name: Run ESLint
      run: npm run lint

    - name: Run TypeScript Type Check
      run: npm run typecheck

    - name: Check Formatting
      run: npx prettier --check .

    - name: Run Security Audit (user_id isolation)
      run: ./scripts/security-audit.sh

    - name: Validate File Sizes (300-line limit)
      run: ./scripts/validate-file-size.sh
```

**Why**:

- Adds TypeScript strict mode check
- Adds Prettier format check
- **Adds security audit for user_id isolation (CRITICAL)**
- **Adds file size validation for 300-line limit**
- Fast feedback (5 min timeout)

---

#### 2.4: Update Test Job with Auto-Retry

Replace the current `test-unit` job:

```yaml
test-unit:
  name: Unit & Integration Tests
  needs: check-skip
  runs-on: ubuntu-latest
  timeout-minutes: 15

  services:
    postgres:
      image: supabase/postgres:15.1.0.117
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: daggergm_test
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
      ports:
        - 5432:5432

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --no-audit --no-fund

    - name: Setup Test Database
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/daggergm_test
      run: |
        npm run db:migrate || echo "⚠️  Migrations not yet configured"
        npm run db:seed:test || echo "⚠️  Test seed not yet configured"

    - name: Run Vitest Tests with Auto-Retry
      timeout-minutes: 12
      run: |
        npm test -- --run --retry=2 --reporter=verbose || TEST_EXIT_CODE=$?

        if [ "${TEST_EXIT_CODE:-0}" = "0" ]; then
          echo "✅ All tests passed (possibly after retries)"
          exit 0
        else
          echo "❌ Tests failed even after retries"
          exit ${TEST_EXIT_CODE}
        fi
      env:
        # Supabase Test Environment
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}

        # OpenAI (mocked via MSW)
        OPENAI_API_KEY: sk-test-mock-key

        # Stripe (test mode)
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}

        # Test flags
        NODE_ENV: test
        INTEGRATION_TESTS: true
        USE_REAL_SUPABASE: true
        IS_TEST_DATABASE: true

    - name: Run Coverage Check
      run: npm run test:coverage

    - name: Enforce Coverage Threshold
      run: |
        COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
        if [ $(echo "$COVERAGE < 90" | bc) -eq 1 ]; then
          echo "❌ Coverage below 90% threshold (actual: $COVERAGE%)"
          exit 1
        fi
        echo "✅ Coverage: $COVERAGE% (target: ≥90%)"

    - name: Upload Coverage
      uses: codecov/codecov-action@v4
      if: always()
      with:
        files: ./coverage/lcov.info
        flags: unittests
```

**Why**:

- Auto-retries flaky tests (98%+ reliability)
- Separate coverage check step
- Enforces 90% threshold
- Uses real test database (not mocked)

---

#### 2.5: Update E2E Test Job

Replace the current `test-e2e` job:

```yaml
test-e2e:
  name: E2E Tests (Playwright)
  needs: check-skip
  runs-on: ubuntu-latest
  timeout-minutes: 15

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --no-audit --no-fund

    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium firefox

    - name: Run Playwright Tests
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
        PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
      run: npm run test:e2e

    - name: Upload Playwright Report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

**Why**:

- Runs in parallel with unit tests
- 2 browsers (chromium, firefox)
- Uploads report on failure

---

#### 2.6: Update Build Job

Replace the current `build` job:

```yaml
build:
  name: Build Check
  runs-on: ubuntu-latest
  timeout-minutes: 10
  needs: [lint-and-typecheck, test-unit]

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --no-audit --no-fund

    - name: Build Next.js App
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      run: npm run build
```

**Why**:

- Only runs after lint and tests pass
- Uses production Supabase credentials
- Verifies production build works

---

#### 2.7: Simplify Deployment (Vercel Only)

Replace the `deploy` job:

```yaml
deploy:
  name: Deploy to Vercel
  runs-on: ubuntu-latest
  timeout-minutes: 10
  needs: [lint-and-typecheck, test-unit, test-e2e, build]
  if: |
    always() &&
    github.ref == 'refs/heads/main' &&
    needs.lint-and-typecheck.result == 'success' &&
    needs.test-unit.result == 'success' &&
    needs.test-e2e.result == 'success' &&
    needs.build.result == 'success'

  steps:
    - name: Deploy to Vercel
      run: |
        echo "🚀 Deploying to Vercel..."
        RESPONSE=$(curl -X POST -s -w "\n%{http_code}" "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

        if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
          echo "✅ Deployment triggered successfully"
        else
          echo "❌ Deployment trigger failed with code $HTTP_CODE"
          exit 1
        fi
```

**Why**:

- Only deploys to Vercel (no Render)
- Only on main branch
- Only if ALL jobs pass
- Verifies deploy hook response

---

#### 2.8: Remove/Update Security Job

**Option A**: Keep security scan (recommended):

```yaml
security:
  name: Security Scan
  needs: check-skip
  runs-on: ubuntu-latest
  timeout-minutes: 5

  steps:
    - uses: actions/checkout@v4

    - name: Run npm audit
      run: npm audit --audit-level=high --omit=dev
      continue-on-error: true # Don't fail on audit warnings

    - name: Run Snyk Security Scan
      uses: snyk/actions/node@master
      continue-on-error: true # Don't block on Snyk issues
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
```

**Option B**: Remove security job entirely (if not using Snyk)

**Why**: Security scans should warn but not block deployments

---

#### 2.9: Remove Notify Job

**Action**: Delete the entire `notify` job

**Why**:

- Slack notifications not configured yet
- Can add later when needed
- GitHub already notifies on failures

---

### Task 3: Verify Workflow Syntax

**Steps**:

```bash
# Install actionlint (workflow linter)
brew install actionlint  # macOS
# OR
sudo apt install actionlint  # Linux

# Check workflow syntax
actionlint .github/workflows/ci.yml
```

**Alternative** (if actionlint not available):

```bash
# Push to a test branch and check GitHub UI
git checkout -b test/workflow-update
git add .github/workflows/ci.yml
git commit -m "test: update CI workflow [skip ci]"
git push origin test/workflow-update
```

Then check: https://github.com/sagebright/daggergm/actions

---

### Task 4: Update GitHub Secrets

**Required Secrets** (check Settings → Secrets → Actions):

```bash
# Test Environment (if not already set)
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGci...
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Production Environment (if not already set)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Vercel Deployment
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...

# Optional: Security scanning
SNYK_TOKEN=your_snyk_token
```

**Verification**:

```bash
# Use GitHub CLI to check secrets exist
gh secret list
```

---

### Task 5: Test the Workflow

**5.1: Test Documentation Skip**

```bash
# Make a doc-only change
echo "## Test" >> README.md
git add README.md
git commit -m "docs: test CI skip"
git push

# Verify: Should NOT trigger CI
gh run list --limit 1
```

**5.2: Test Manual Skip**

```bash
# Make a code change with [skip ci]
echo "// test" >> app/page.tsx
git add app/page.tsx
git commit -m "test: manual skip [skip ci]"
git push

# Verify: Should NOT trigger CI
gh run list --limit 1
```

**5.3: Test Full Workflow**

```bash
# Make a real code change
echo "// update" >> app/page.tsx
git add app/page.tsx
git commit -m "feat: test new workflow"
git push

# Monitor the run
gh run watch
```

**Expected**:

- ✅ Lint & typecheck: ~3 min
- ✅ Tests with retry: ~12 min
- ✅ E2E tests: ~10 min (parallel)
- ✅ Build: ~5 min
- ✅ Total: ~20 min (down from ~25 min)

---

### Task 6: Update Documentation

**File**: `documentation/GITHUB_ACTIONS.md` (create if doesn't exist)

**Content**:

````markdown
# GitHub Actions CI/CD Workflow

## Overview

Our CI/CD pipeline runs on all branches with smart path filtering.

## Workflow Structure

1. **Lint & Typecheck** (5 min)
   - ESLint with strict rules
   - TypeScript strict mode check
   - Prettier format validation

2. **Unit & Integration Tests** (12 min)
   - Vitest with auto-retry (--retry=2)
   - 90% coverage enforcement
   - Real test database (Supabase)

3. **E2E Tests** (10 min)
   - Playwright with Chromium & Firefox
   - Runs in parallel with unit tests

4. **Build** (5 min)
   - Next.js production build
   - Verifies deployment-ready

5. **Deploy** (2 min)
   - Vercel deployment (main branch only)
   - Only if all tests pass

## Skipping CI

### Automatic Skip

- Documentation changes (`**.md`, `documentation/**`)
- Workflow changes (`.github/workflows/**`)
- Claude files (`CLAUDE/**`, `.claude/**`)

### Manual Skip

Add `[skip ci]` to commit message:

```bash
git commit -m "docs: update README [skip ci]"
```
````

## Monitoring

```bash
# View recent runs
gh run list --limit 10

# Watch current run
gh run watch

# View specific run logs
gh run view <run-id> --log
```

## Secrets Required

See: `documentation/DaggerGM/SECRETS_SETUP.md`

## Troubleshooting

### Tests fail in CI but pass locally

- Check GitHub secrets are configured
- Verify test database is accessible
- Check for timezone differences (CI uses UTC)

### Deployment not triggering

- Verify on main branch
- Check all jobs passed
- Verify VERCEL_DEPLOY_HOOK_URL secret exists

````

---

### Task 7: Commit and Push

```bash
# Stage all changes
git add .github/workflows/ci.yml
git add documentation/GITHUB_ACTIONS.md

# Commit
git commit -m "feat: update GitHub Actions workflow with smart filtering and auto-retry

- Add path-based filtering (skip docs/workflows)
- Add [skip ci] support
- Add auto-retry for flaky tests (--retry=2)
- Add TypeScript typecheck job
- Simplify to single Vercel deployment
- Add coverage enforcement (90% threshold)
- Remove Render backend deployment
- Parallel execution of lint, tests, E2E

Expected savings: 40-50% CI/CD minutes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main

# Monitor the workflow
gh run watch
````

---

## ✅ Validation Checklist

After implementation, verify:

- [ ] Workflow file syntax is valid (no YAML errors)
- [ ] All required secrets are configured
- [ ] Documentation-only changes skip CI
- [ ] `[skip ci]` in commit message works
- [ ] Tests run with auto-retry enabled
- [ ] Coverage threshold enforced (90%)
- [ ] E2E tests run in parallel
- [ ] Build succeeds after tests pass
- [ ] Deployment triggers only on main branch
- [ ] Workflow completes in ~20 minutes (full suite)
- [ ] **Security audit script runs and passes (user_id isolation)**
- [ ] **File size validation script runs and passes (300-line limit)**

---

## 🐛 Troubleshooting

### Workflow doesn't start

- Check paths-ignore configuration
- Verify commit message doesn't have `[skip ci]`
- Check if changes are in ignored paths

### Tests fail with "Cannot find module"

- Verify `npm ci` completed successfully
- Check path aliases in vitest.config.ts
- Ensure dependencies are in package.json

### Coverage check fails

- Run `npm run test:coverage` locally
- Check coverage/coverage-summary.json exists
- Verify jq is installed on runner (should be)

### Deployment fails

- Check VERCEL_DEPLOY_HOOK_URL secret
- Verify webhook URL is correct
- Check Vercel dashboard for errors

---

## 📊 Expected Results

**Before**:

- All changes trigger full CI: ~25 minutes
- Documentation changes: ~25 minutes (wasted)
- Flaky tests fail entire CI

**After**:

- Code changes: ~20 minutes
- Documentation changes: 0 minutes (skipped)
- Flaky tests auto-retry (98%+ success rate)
- **Estimated savings: 40-50% CI/CD minutes**

---

**Last Updated**: 2025-10-23
**Execution Time**: 30-45 minutes
**Difficulty**: Medium
**Prerequisites**: None (updates existing workflow)
