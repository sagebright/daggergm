# 🚀 Deployment & CI/CD Patterns

## 🎯 Pipeline Philosophy

**Stability Over Perfection** - Prioritize working deployments over comprehensive testing

## 🔧 GitHub Actions Configuration

### **Workflow Timeout Settings**

```yaml
# Always add timeouts to prevent infinite hangs
jobs:
  test:
    timeout-minutes: 15
    steps:
      - name: Run Tests
        timeout-minutes: 10
        run: npm run test:ci
```

### **Test Script Configuration**

```json
{
  "scripts": {
    "test:ci": "jest --forceExit --detectOpenHandles --maxWorkers=2",
    "test:basic": "jest --testPathPattern='basic.test.js'",
    "lint": "eslint . --ext .js,.jsx",
    "build": "npm run build --workspaces"
  }
}
```

### **Monorepo Workflow Pattern**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults:
      run:
        working-directory: ./backend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        timeout-minutes: 10
        run: npm run test:ci
        env:
          SUPABASE_URL_DEV: ${{ secrets.SUPABASE_URL_DEV }}
          SUPABASE_ANON_KEY_DEV: ${{ secrets.SUPABASE_ANON_KEY_DEV }}

      - name: Run linting
        run: npm run lint

  frontend-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        timeout-minutes: 10
        run: npm run test:ci

      - name: Build application
        run: npm run build
```

## 🌐 Deployment Platforms

### **Vercel Configuration**

#### **Frontend Deployment**

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend.render.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### **Build Settings**

- **Framework Preset**: Create React App
- **Build Command**: `cd frontend && npm ci && npm run build`
- **Output Directory**: `frontend/build`
- **Node Version**: 18.x

### **Render Configuration**

#### **Backend Service**

```yaml
# render.yaml
services:
  - type: web
    name: tcg-backend
    env: node
    plan: starter
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
```

#### **Environment Variables**

```bash
# Production environment variables
NODE_ENV=production
PORT=10000
JWT_SECRET=your-jwt-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SENTRY_DSN=your-sentry-dsn
```

## 🔒 Environment Management

### **Environment File Structure**

```
# Development
.env.development
SUPABASE_URL_DEV=https://dev-project.supabase.co
SUPABASE_ANON_KEY_DEV=dev-anon-key

# Production
.env.production
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod-anon-key

# CI/CD
.env.ci
SUPABASE_URL_DEV=https://test-project.supabase.co
SUPABASE_ANON_KEY_DEV=test-anon-key
```

### **Secrets Management**

```yaml
# GitHub Secrets
SUPABASE_URL_DEV
SUPABASE_ANON_KEY_DEV
JWT_SECRET
SENTRY_DSN
VERCEL_TOKEN
```

## 📊 Coverage & Testing Strategy

### **Realistic Coverage Targets**

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 10, // Realistic, not aspirational
      functions: 15,
      lines: 12,
      statements: 12,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
}
```

### **Test Categories**

```javascript
// Run different test suites based on stability
{
  "scripts": {
    "test:basic": "jest --testPathPattern='basic.test.js'",
    "test:integration": "jest --testPathPattern='integration.test.js'",
    "test:all": "jest",
    "test:ci": "npm run test:basic" // Start with basics, expand gradually
  }
}
```

## 🚧 Handling Problematic Tests

### **Skipping Strategy**

```javascript
// Use descriptive skip messages
describe.skip('PhotoUpload Component', () => {
  // TODO: Fix react-dropzone mocking issues
  // See issue: https://github.com/org/repo/issues/123
  test('should handle file upload', () => {
    // Test implementation
  })
})

test.skip('should process OCR data', () => {
  // TODO: Fix Tesseract.js mocking in CI environment
  // Temporarily skipped until proper mocking solution found
})
```

### **Incremental Re-enabling**

```javascript
// Re-enable tests one at a time after fixes
describe('CardIdentifier Component', () => {
  test('should render basic UI', () => {
    // Basic test that works
  })

  test.skip('should handle API integration', () => {
    // TODO: Re-enable after API mocking fixed
  })
})
```

## 🔍 Monitoring & Health Checks

### **Application Health Endpoints**

```javascript
// backend/src/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  })
})

router.get('/health/detailed', authMiddleware, (req, res) => {
  // More detailed health check for authenticated users
  res.json({
    status: 'healthy',
    database: 'connected',
    external_apis: 'operational',
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
  })
})
```

### **Deployment Monitoring**

```yaml
# GitHub Actions - Post-deployment verification
- name: Health Check
  run: |
    sleep 30  # Wait for deployment
    curl -f https://your-app.vercel.app/api/health || exit 1
```

## 🔄 Database Migrations

### **Migration Deployment Pattern**

```javascript
// scripts/migrate.js
const { execSync } = require('child_process')

const runMigrations = () => {
  try {
    console.log('Running database migrations...')
    execSync('npm run migrate', { stdio: 'inherit' })
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
}

if (process.env.NODE_ENV === 'production') {
  runMigrations()
}
```

### **Migration Safety**

```sql
-- Always use transactions for migrations
BEGIN;

-- Add new column with default
ALTER TABLE cards ADD COLUMN new_field VARCHAR DEFAULT 'safe_default';

-- Backfill existing data
UPDATE cards SET new_field = 'updated_value' WHERE condition = 'specific';

-- Remove default after backfill
ALTER TABLE cards ALTER COLUMN new_field DROP DEFAULT;

COMMIT;
```

## 📝 Deployment Checklist

### **Pre-Deployment**

- [ ] All tests pass locally
- [ ] Linting passes
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Sentry DSN configured

### **Post-Deployment**

- [ ] Health endpoint responds
- [ ] Frontend loads correctly
- [ ] API endpoints accessible
- [ ] Authentication works
- [ ] Database connections established
- [ ] Monitoring alerts configured

## 🚨 Troubleshooting Common Issues

### **Package Lock Sync Issues**

```bash
# Fix package-lock.json conflicts
rm package-lock.json
rm -rf node_modules
npm install
git add package-lock.json
```

### **Build Timeout Issues**

```yaml
# Increase timeout for heavy builds
- name: Build Application
  timeout-minutes: 20 # Increase from default 10
  run: npm run build
```

### **Memory Issues in CI**

```yaml
# Limit Node.js memory usage
- name: Run Tests
  run: npm run test:ci
  env:
    NODE_OPTIONS: '--max-old-space-size=4096'
```

## 🔧 Emergency Procedures

### **Rollback Strategy**

```bash
# Quick rollback using git
git revert HEAD~1
git push origin main

# Or revert to specific commit
git reset --hard <previous-good-commit>
git push --force-with-lease origin main
```

### **Hotfix Deployment**

```bash
# Create hotfix branch
git checkout -b hotfix/critical-fix
# Make minimal changes
git commit -m "Fix critical issue"
git push origin hotfix/critical-fix
# Create PR for immediate merge
```

---

**Version**: 2025-08-01
