# FIX-003: E2E Test for Create Adventure Flow

## Status: PENDING

**Priority:** CRITICAL
**Created:** 2025-10-29
**Estimated Time:** 60 minutes
**Depends On:** FIX-002 (Adventure Creation UI Refactor)

---

## Problem Statement

The adventure creation flow (select motif → generate → consume credit) broke in production without being caught by tests. The `consume_credit` database function was missing, causing adventure generation to fail silently.

**Root Cause:** No E2E tests exist for the adventure creation user flow. Unit tests mocked the LLM and database interactions, so they didn't catch the missing database function.

---

## User Flow to Test

### **Create Adventure Flow (Happy Path)**

```
Prerequisites:
- User is logged in (use test user from FIX-001)
- User has at least 1 credit available
- Database has consume_credit function
- LLM responses are mocked (MSW)

User Flow:
1. User is on /dashboard
2. User sees "Generate New Adventure" button
3. User sees credit balance (e.g., "5 credits")
4. User clicks "Generate New Adventure" button
5. User is redirected to /adventures/new
6. User sees single-screen adventure creation form
7. User sees "Primary Motif" dropdown (default: not selected)
8. User sees "Party Size" dropdown (default: 4)
9. User sees "Party Tier" dropdown (default: Tier 1)
10. User sees "Number of Scenes" dropdown (default: 3)
11. User sees "Adventure Generation Cost: 1 credit"
12. User selects "Primary Motif": "High Fantasy"
13. User keeps default values for Party Size, Party Tier, Scenes
14. User clicks "Generate Adventure" button
15. Form validates all fields are filled
16. [Backend: consume_credit function called]
17. [Backend: Credit deducted from user's balance]
18. User sees loading state: "Generating your adventure..."
19. [Backend: LLM mocked response returns scene descriptions]
20. User sees success toast: "Adventure created successfully!"
21. User is redirected to /adventures/[id]
22. User sees adventure detail page with scenes
23. User returns to /dashboard
24. User sees credit balance decreased by 1 (e.g., "4 credits")

Expected Outcomes:
✓ Form displays correctly with all dropdowns
✓ Form validation prevents submission with empty required fields
✓ Credit is consumed when adventure generation starts
✓ consume_credit database function is called successfully
✓ User is redirected to adventure detail page after generation
✓ Credit balance is updated after consumption
✓ Adventure is saved to database with correct user_id
✓ RLS policies allow user to access their own adventure
```

---

## Acceptance Criteria

### Must Have:

- [ ] Test logs in user (reuse helper from FIX-001)
- [ ] Test navigates from dashboard → /adventures/new
- [ ] Test fills out adventure creation form
- [ ] Test submits form and waits for generation
- [ ] Test verifies credit consumption (consume_credit called)
- [ ] Test verifies redirect to /adventures/[id]
- [ ] Test verifies adventure detail page loads
- [ ] Test verifies credit balance decreased by 1
- [ ] Test uses MSW to mock LLM responses (not real OpenAI calls)
- [ ] Test uses real Supabase test instance (not mocked DB)
- [ ] Test runs in CI/CD pipeline

### Should Have:

- [ ] Test cleans up created adventure after completion
- [ ] Test verifies RLS policies (user can only see their own adventure)
- [ ] Test handles insufficient credits scenario
- [ ] Test includes screenshots on failure for debugging

### Nice to Have:

- [ ] Test verifies adventure content matches selected motif
- [ ] Test verifies correct number of scenes created
- [ ] Test verifies loading state is shown during generation

---

## Technical Implementation

### File to Create:

```
__tests__/e2e/create-adventure-flow.spec.ts
```

### MSW Setup for Mocking LLM:

Create `__tests__/e2e/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock OpenAI chat completion
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
              scenes: [
                {
                  title: 'Test Scene 1',
                  description: 'A dark forest awaits',
                  location: 'The Witherwild',
                },
                {
                  title: 'Test Scene 2',
                  description: 'A mysterious cave',
                  location: 'Crystal Caverns',
                },
                {
                  title: 'Test Scene 3',
                  description: 'The final confrontation',
                  location: 'Ancient Ruins',
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
]
```

### Test Structure:

```typescript
import { test, expect } from '@playwright/test'

// Helper function to login (reuse from FIX-001)
async function loginTestUser(page) {
  const testEmail = 'test-fixed@example.com' // Pre-created test user with credits
  const testPassword = 'TestPassword123!'

  await page.goto('/auth/login')
  await page.fill('input[type="email"]', testEmail)
  await page.fill('input[type="password"]', testPassword)
  await page.click('button:has-text("Sign In")')
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
}

test.describe('Create Adventure Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginTestUser(page)
  })

  test('user can create a new adventure', async ({ page }) => {
    // 1. Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1:has-text("Your Adventures")')).toBeVisible()

    // 2. Get initial credit balance
    const initialCreditText = await page.locator('text=/\\d+ credits/').first().textContent()
    const initialCredits = parseInt(initialCreditText?.match(/\\d+/)?.[0] || '0')
    expect(initialCredits).toBeGreaterThan(0) // Must have credits to run test

    // 3. Click "Generate New Adventure"
    await page.click('button:has-text("Generate New Adventure")')
    await expect(page).toHaveURL('/adventures/new')

    // 4. Verify form is displayed
    await expect(page.locator('h1:has-text("Create Your Adventure")')).toBeVisible()
    await expect(page.locator('text=Adventure Generation Cost')).toBeVisible()

    // 5. Fill out form
    await page.click('button[id="motif"]') // Open motif dropdown
    await page.click('text=High Fantasy') // Select motif

    // Party Size, Party Tier, and Scenes should have defaults
    // Optionally verify defaults are selected:
    await expect(page.locator('button[id="partySize"]')).toContainText('4')
    await expect(page.locator('button[id="partyTier"]')).toContainText('Tier 1')
    await expect(page.locator('button[id="numScenes"]')).toContainText('3')

    // 6. Submit form
    await page.click('button:has-text("Generate Adventure")')

    // 7. Verify loading state
    await expect(page.locator('text=Generating your adventure')).toBeVisible({ timeout: 5000 })

    // 8. Wait for redirect to adventure detail page
    await expect(page).toHaveURL(/\\/adventures\\/[a-z0-9-]+/, { timeout: 30000 })

    // 9. Verify adventure detail page loaded
    await expect(page.locator('text=Test Scene 1')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Test Scene 2')).toBeVisible()
    await expect(page.locator('text=Test Scene 3')).toBeVisible()

    // 10. Return to dashboard and verify credit balance decreased
    await page.goto('/dashboard')
    const finalCreditText = await page.locator('text=/\\d+ credits/').first().textContent()
    const finalCredits = parseInt(finalCreditText?.match(/\\d+/)?.[0] || '0')
    expect(finalCredits).toBe(initialCredits - 1)
  })

  test('user cannot create adventure with insufficient credits', async ({ page }) => {
    // This test assumes the test user has 0 credits
    // You may need to create a separate test user with 0 credits

    // 1. Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard')

    // 2. Check credit balance is 0
    await expect(page.locator('text=0 credits')).toBeVisible()

    // 3. Click "Generate New Adventure"
    await page.click('button:has-text("Generate New Adventure")')
    await expect(page).toHaveURL('/adventures/new')

    // 4. Fill out form
    await page.click('button[id="motif"]')
    await page.click('text=High Fantasy')

    // 5. Submit form
    await page.click('button:has-text("Generate Adventure")')

    // 6. Verify error message
    await expect(page.locator('text=Insufficient credits')).toBeVisible({ timeout: 5000 })

    // 7. Verify we're still on /adventures/new (not redirected)
    await expect(page).toHaveURL('/adventures/new')
  })

  test('user can view created adventure from dashboard', async ({ page }) => {
    // 1. Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard')

    // 2. Find an adventure in the list (assumes at least one exists)
    const adventureCard = page.locator('[data-testid="adventure-card"]').first()
    await expect(adventureCard).toBeVisible()

    // 3. Click on the adventure
    await adventureCard.click()

    // 4. Verify redirected to adventure detail page
    await expect(page).toHaveURL(/\\/adventures\\/[a-z0-9-]+/)

    // 5. Verify adventure content is visible
    await expect(page.locator('h1')).toBeVisible() // Adventure title
  })
})
```

### Playwright Configuration Update:

Add MSW support to `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

---

## Test Data Setup

### Pre-requisites:

1. **Test User with Credits**: Create a test user with at least 5 credits
   - Email: `test-fixed@example.com`
   - Password: `TestPassword123!`
   - Credits: 5

2. **Test User with No Credits**: Create a test user with 0 credits
   - Email: `test-nocredits@example.com`
   - Password: `TestPassword123!`
   - Credits: 0

### Setup Script (Optional):

Create `scripts/setup-e2e-test-users.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function setupTestUsers() {
  // Create test user with credits
  const { data: user1 } = await supabase.auth.admin.createUser({
    email: 'test-fixed@example.com',
    password: 'TestPassword123!',
    email_confirm: true,
  })

  if (user1.user) {
    // Add 5 credits
    await supabase.from('user_credits').insert([
      { user_id: user1.user.id, credit_type: 'adventure', consumed_at: null },
      { user_id: user1.user.id, credit_type: 'adventure', consumed_at: null },
      { user_id: user1.user.id, credit_type: 'adventure', consumed_at: null },
      { user_id: user1.user.id, credit_type: 'adventure', consumed_at: null },
      { user_id: user1.user.id, credit_type: 'adventure', consumed_at: null },
    ])
  }

  // Create test user with no credits
  await supabase.auth.admin.createUser({
    email: 'test-nocredits@example.com',
    password: 'TestPassword123!',
    email_confirm: true,
  })

  console.log('✅ Test users created successfully')
}

setupTestUsers()
```

---

## Dependencies

### Required:

- Playwright installed and configured
- MSW (Mock Service Worker) for mocking LLM responses
  ```bash
  npm install -D msw@latest
  ```
- Test Supabase instance with consume_credit function
- Test users with credits pre-created

### May Need:

- Update Server Actions to handle mocked LLM responses
- Configure MSW in Playwright setup file

---

## Testing the Test

### Manual Verification Steps:

1. Run test locally: `npm run test:e2e -- create-adventure-flow.spec.ts`
2. Verify test creates adventure in Supabase dashboard
3. Verify test decreases credit count
4. Verify test completes without errors
5. Run test multiple times to ensure it's idempotent

### CI/CD Integration:

- Test should run in GitHub Actions workflow
- Test should use test Supabase project (not production)
- Test failures should block PR merges

---

## Rollback Plan

If this test causes issues:

1. Comment out test in `create-adventure-flow.spec.ts`
2. Investigate failures in CI/CD logs
3. Check MSW mock handlers are configured correctly
4. Verify test users exist in Supabase test instance

---

## Related Issues

- Original bug: Missing `consume_credit` function in database
- Related file: `lib/credits/credit-manager.ts` (calls consume_credit)
- Related file: `app/actions/adventures.ts` (Server Action)

---

## Notes

- Test uses MSW to mock LLM responses (no real OpenAI API calls)
- Test uses real Supabase test instance (catches DB schema issues)
- Test assumes test users are pre-created with known credentials
- Test verifies credit consumption end-to-end
- Future enhancement: Add test for scene approval/regeneration flows

---

## Definition of Done

- [ ] E2E test file created and passing locally
- [ ] MSW mock handlers configured for LLM responses
- [ ] Test runs in CI/CD pipeline
- [ ] Test verifies critical create adventure flow end-to-end
- [ ] Test verifies credit consumption works
- [ ] Test documentation added to this file
- [ ] Test failure provides actionable debugging info
- [ ] Code reviewed and merged to main branch
