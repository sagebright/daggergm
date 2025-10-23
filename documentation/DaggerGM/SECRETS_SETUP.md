# GitHub Secrets Setup Guide

**Purpose**: Complete guide for setting up all required GitHub secrets for CI/CD pipeline.

**Required Before**: Phase 0.7 (CI/CD Pipeline setup)

---

## Overview

The DaggerGM CI/CD pipeline requires **9 secrets** for full functionality:

| Secret                           | Required    | Purpose                      | Where to Get          |
| -------------------------------- | ----------- | ---------------------------- | --------------------- |
| `TEST_SUPABASE_URL`              | ✅ Yes      | Test database URL            | Supabase test project |
| `TEST_SUPABASE_ANON_KEY`         | ✅ Yes      | Test database anon key       | Supabase test project |
| `TEST_SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes      | Test database admin key      | Supabase test project |
| `NEXT_PUBLIC_SUPABASE_URL`       | ✅ Yes      | Production database URL      | Supabase prod project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | ✅ Yes      | Production database anon key | Supabase prod project |
| `VERCEL_TOKEN`                   | ✅ Yes      | Deploy to Vercel             | Vercel dashboard      |
| `VERCEL_ORG_ID`                  | ✅ Yes      | Vercel organization          | Vercel dashboard      |
| `VERCEL_PROJECT_ID`              | ✅ Yes      | Vercel project               | Vercel dashboard      |
| `SNYK_TOKEN`                     | ⚠️ Optional | Security scanning            | Snyk dashboard        |
| `SLACK_WEBHOOK_URL`              | ⚠️ Optional | Failure notifications        | Slack workspace       |

---

## Step-by-Step Setup

### 1. Supabase Test Project

**Purpose**: Dedicated Supabase project for running tests in CI/CD.

#### Create Test Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `daggergm-test`
   - **Database Password**: Generate strong password (save in password manager!)
   - **Region**: Choose closest to CI/CD runner (typically `us-east-1`)
   - **Pricing Plan**: **Free** (sufficient for tests)
4. Click **"Create New Project"**
5. Wait ~2 minutes for provisioning

#### Get Test Project Secrets

1. In test project dashboard, go to **Settings → API**
2. Copy these values:

   **`TEST_SUPABASE_URL`**:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   ```

   **`TEST_SUPABASE_ANON_KEY`**:

   ```
   anon / public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **`TEST_SUPABASE_SERVICE_ROLE_KEY`** (⚠️ **SECRET - NEVER COMMIT**):

   ```
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Apply Database Schema to Test Project

```bash
# Link to test project
npx supabase link --project-ref xxxxxxxxxxxxx

# Apply migrations
npx supabase db push

# Verify tables created
npx supabase db inspect
```

---

### 2. Supabase Production Project

**Purpose**: Production database for live application.

#### Create Production Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `daggergm-production`
   - **Database Password**: Generate strong password (different from test!)
   - **Region**: Choose closest to users (typically `us-east-1` or `eu-west-1`)
   - **Pricing Plan**: **Pro** (for production workloads, ~$25/month)
4. Click **"Create New Project"**

#### Get Production Project Secrets

1. In production project dashboard, go to **Settings → API**
2. Copy these values:

   **`NEXT_PUBLIC_SUPABASE_URL`**:

   ```
   Project URL: https://yyyyyyyyyyyyy.supabase.co
   ```

   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**:

   ```
   anon / public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **Note**: Production `service_role` key is NOT added to GitHub secrets (only test environment uses it).

#### Apply Schema to Production

```bash
# Link to production project
npx supabase link --project-ref yyyyyyyyyyyyy

# Apply migrations (CAREFULLY - this is production!)
npx supabase db push

# Verify RLS policies
npx tsx scripts/audit-rls.ts
```

---

### 3. Vercel Deployment

**Purpose**: Deploy Next.js app to Vercel on every merge to `main`.

#### Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
5. Click **"Deploy"** (first deployment)

#### Get Vercel Secrets

##### `VERCEL_TOKEN`

1. In Vercel dashboard, click your profile (bottom left)
2. Go to **Settings → Tokens**
3. Click **"Create Token"**
4. Fill in:
   - **Name**: `github-actions-daggergm`
   - **Scope**: Full Account
   - **Expiration**: No expiration (or 1 year if you prefer)
5. Click **"Create Token"**
6. Copy token immediately (shown only once!)

##### `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

1. In your project root, run:
   ```bash
   npx vercel link
   ```
2. Follow prompts to link to your Vercel project
3. After linking, check `.vercel/project.json`:
   ```json
   {
     "orgId": "team_xxxxxxxxxxxxx",
     "projectId": "prj_yyyyyyyyyyyyy"
   }
   ```
4. Copy `orgId` → `VERCEL_ORG_ID`
5. Copy `projectId` → `VERCEL_PROJECT_ID`

⚠️ **Important**: Add `.vercel/` to `.gitignore` (don't commit these values!).

---

### 4. Snyk Security Scanning (Optional)

**Purpose**: Scan dependencies for known vulnerabilities.

#### Create Snyk Account

1. Go to https://snyk.io/
2. Sign up with GitHub (free for open source)
3. Import your `daggergm` repository

#### Get Snyk Token

1. In Snyk dashboard, click your name (top right)
2. Go to **Account Settings**
3. Copy **API Token** from General section

   **`SNYK_TOKEN`**:

   ```
   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

⚠️ **Note**: If you skip Snyk, comment out the `security` job in `.github/workflows/ci.yml`.

---

### 5. Slack Notifications (Optional)

**Purpose**: Get notified in Slack when CI/CD fails.

#### Create Slack Webhook

1. In Slack workspace, go to https://api.slack.com/apps
2. Click **"Create New App" → "From scratch"**
3. Fill in:
   - **App Name**: `DaggerGM CI/CD`
   - **Workspace**: Your workspace
4. Click **"Create App"**
5. In app settings, go to **Incoming Webhooks**
6. Toggle **"Activate Incoming Webhooks"** to ON
7. Click **"Add New Webhook to Workspace"**
8. Select channel (e.g., `#dev-alerts`)
9. Copy **Webhook URL**:

   **`SLACK_WEBHOOK_URL`**:

   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
   ```

⚠️ **Note**: If you skip Slack, comment out the `notify` job in `.github/workflows/ci.yml`.

---

## Adding Secrets to GitHub

### Via GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. For each secret:
   - **Name**: Exact name from table above (e.g., `TEST_SUPABASE_URL`)
   - **Value**: Paste the value
   - Click **"Add secret"**

### Via GitHub CLI (Faster)

```bash
# Install GitHub CLI if needed
brew install gh

# Authenticate
gh auth login

# Add all secrets (one command per secret)
gh secret set TEST_SUPABASE_URL --body "https://xxxxxxxxxxxxx.supabase.co"
gh secret set TEST_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
gh secret set TEST_SUPABASE_SERVICE_ROLE_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://yyyyyyyyyyyyy.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
gh secret set VERCEL_TOKEN --body "xxxxxxxxxxxxxxxxxxxx"
gh secret set VERCEL_ORG_ID --body "team_xxxxxxxxxxxxx"
gh secret set VERCEL_PROJECT_ID --body "prj_yyyyyyyyyyyyy"

# Optional secrets
gh secret set SNYK_TOKEN --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."
```

### Verify Secrets Added

```bash
gh secret list
```

Expected output:

```
TEST_SUPABASE_URL                    Updated 2025-10-18
TEST_SUPABASE_ANON_KEY               Updated 2025-10-18
TEST_SUPABASE_SERVICE_ROLE_KEY       Updated 2025-10-18
NEXT_PUBLIC_SUPABASE_URL             Updated 2025-10-18
NEXT_PUBLIC_SUPABASE_ANON_KEY        Updated 2025-10-18
VERCEL_TOKEN                         Updated 2025-10-18
VERCEL_ORG_ID                        Updated 2025-10-18
VERCEL_PROJECT_ID                    Updated 2025-10-18
SNYK_TOKEN                           Updated 2025-10-18
SLACK_WEBHOOK_URL                    Updated 2025-10-18
```

---

## Testing Secrets

### Test CI/CD Pipeline

1. Push a commit to trigger CI/CD:

   ```bash
   git add .
   git commit -m "test: Verify CI/CD secrets"
   git push origin main
   ```

2. Monitor workflow:

   ```bash
   gh run watch
   ```

3. Check for errors:
   - If `test-unit` fails → Check Supabase test secrets
   - If `test-e2e` fails → Check Supabase test secrets
   - If `build` fails → Check production Supabase secrets
   - If `deploy` fails → Check Vercel secrets

---

## Local Development Setup

### Create `.env.local` (NOT committed to git)

```bash
# Copy example
cp .env.example .env.local

# Fill in with LOCAL Supabase values (not production!)
```

**File: `.env.local`**

```bash
# Local Supabase (via npx supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # From supabase status
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...      # From supabase status

# OpenAI (for local testing - use your own key)
OPENAI_API_KEY=sk-proj-...

# Stripe (test mode keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Important**: `.env.local` is in `.gitignore` - never commit it!

---

## Security Best Practices

### ✅ Do's

- ✅ Use different passwords for test vs production Supabase
- ✅ Rotate secrets every 90 days
- ✅ Use GitHub secret scanner (alerts if secrets leaked)
- ✅ Limit Vercel token scope to specific project
- ✅ Never log secrets in CI/CD logs

### ❌ Don'ts

- ❌ Don't commit secrets to `.env.local`
- ❌ Don't share `service_role` keys (bypass RLS!)
- ❌ Don't use production secrets in test environment
- ❌ Don't hardcode secrets in code
- ❌ Don't expose secrets in client-side code

---

## Rotating Secrets

### When to Rotate

- Every 90 days (recommended)
- If secret potentially exposed
- When team member leaves
- If suspicious activity detected

### How to Rotate

1. **Supabase Keys**:
   - Go to Settings → API
   - Click **"Reset API Keys"**
   - Update GitHub secrets immediately

2. **Vercel Token**:
   - Delete old token in Vercel dashboard
   - Create new token
   - Update GitHub secret

3. **Update CI/CD**:

   ```bash
   gh secret set TEST_SUPABASE_ANON_KEY --body "NEW_VALUE"
   ```

4. **Verify**:
   - Trigger CI/CD run
   - Ensure all jobs pass

---

## Troubleshooting

### ❌ Error: "Supabase connection failed" in CI

**Cause**: Invalid Supabase URL or key

**Solution**:

1. Verify secrets in GitHub: Settings → Secrets
2. Check Supabase project is active: https://supabase.com/dashboard
3. Regenerate keys if needed

### ❌ Error: "Vercel deployment failed: Unauthorized"

**Cause**: Invalid or expired Vercel token

**Solution**:

1. Create new Vercel token
2. Update `VERCEL_TOKEN` secret
3. Retry deployment

### ❌ Error: "Bundle size check failed"

**Cause**: Not related to secrets, but common CI error

**Solution**:

1. Run locally: `npm run build`
2. Check bundle size: `.next/static/chunks/`
3. Optimize imports (use dynamic imports)

---

## Validation Checklist

Before proceeding to Phase 1:

- [ ] Test Supabase project created
- [ ] Production Supabase project created
- [ ] Database schema applied to both projects
- [ ] RLS audit passed on both projects
- [ ] Vercel project created and linked
- [ ] All 9 secrets added to GitHub (or optional ones skipped)
- [ ] Secrets verified with `gh secret list`
- [ ] CI/CD pipeline triggered and passed
- [ ] `.env.local` created for local development
- [ ] `.env.local` added to `.gitignore`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-18
**Review Frequency**: When rotating secrets (every 90 days)
**Security Level**: CRITICAL
