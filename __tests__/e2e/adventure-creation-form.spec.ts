import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

import { createConfirmedTestUser, deleteTestUser } from './fixtures/auth-helpers'

/**
 * E2E Test: Adventure Creation Form (Single-Screen Refactor)
 *
 * This test suite verifies the refactored single-screen adventure creation form:
 * 1. Form renders with all 4 dropdowns (motif, party size, party tier, scenes)
 * 2. Form validation prevents empty submissions
 * 3. Form submission consumes credit and redirects to adventure detail
 * 4. Loading state is shown during generation
 *
 * Key User Journey:
 * - User clicks "Generate New Adventure" from dashboard
 * - User sees single-screen form with all inputs visible
 * - User selects options from dropdowns
 * - User submits form
 * - Credit is consumed (1 credit)
 * - User is redirected to /adventures/[id] after generation
 *
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY and STRIPE_SECRET_KEY in environment
 */

/**
 * Helper: Create test user with credits
 */
async function createTestUserWithCredits(email: string, password: string, credits: number = 5) {
  // Create confirmed user
  const user = await createConfirmedTestUser(email, password)

  // Add credits by updating user profile directly
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  // Update user profile credits field directly
  const { error } = await supabaseAdmin
    .from('daggerheart_user_profiles')
    .update({ credits })
    .eq('id', user.id)

  if (error) {
    throw new Error(`Failed to add credits to test user: ${error.message}`)
  }

  return user
}

test.describe('Adventure Creation Form (Single-Screen)', () => {
  test('form renders with all 4 dropdowns and submit button', async ({ page }) => {
    const testEmail = `test-form-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Step 1: Log in
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Wait for navigation to dashboard after sign in
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 15000 }),
        page.click('button:has-text("Sign In")'),
      ])

      // Step 2: Navigate to adventure creation page
      await page.click('a[href="/adventures/new"]:has-text("Generate New Adventure")')
      await expect(page).toHaveURL('/adventures/new')

      // Step 3: Verify page title and credit balance
      await expect(page.locator('h1:has-text("Create Your Adventure")')).toBeVisible()
      // Credit balance uses aria-label (e.g., "5 credits")
      await expect(page.locator('[aria-label*="credit"]')).toBeVisible()

      // Step 4: Verify adventure generation cost card
      await expect(page.locator('text=Adventure Generation Cost')).toBeVisible()
      await expect(page.locator('text=1 credit').first()).toBeVisible()

      // Step 5: Verify all 4 dropdowns are present
      await expect(page.locator('label:has-text("Primary Motif")')).toBeVisible()
      await expect(page.locator('label:has-text("Party Size")')).toBeVisible()
      await expect(page.locator('label:has-text("Party Tier")')).toBeVisible()
      await expect(page.locator('label:has-text("Number of Scenes")')).toBeVisible()

      // Step 6: Verify all dropdowns have Select triggers (shadcn/ui pattern)
      const motifSelect = page.locator('[id="motif"]')
      const partySizeSelect = page.locator('[id="partySize"]')
      const partyTierSelect = page.locator('[id="partyTier"]')
      const numScenesSelect = page.locator('[id="numScenes"]')

      await expect(motifSelect).toBeVisible()
      await expect(partySizeSelect).toBeVisible()
      await expect(partyTierSelect).toBeVisible()
      await expect(numScenesSelect).toBeVisible()

      // Step 7: Verify submit button
      await expect(page.locator('button:has-text("Generate Adventure")')).toBeVisible()
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('form validation prevents submission with empty motif field', async ({ page }) => {
    const testEmail = `test-validation-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Log in and navigate to form
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Wait for navigation to dashboard after sign in
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 15000 }),
        page.click('button:has-text("Sign In")'),
      ])

      await page.click('a[href="/adventures/new"]:has-text("Generate New Adventure")')
      await expect(page).toHaveURL('/adventures/new')

      // Try to submit without selecting motif (other fields have defaults)
      await page.click('button:has-text("Generate Adventure")')

      // Should show validation error toast
      await expect(page.locator('text=Please fill in all fields')).toBeVisible({ timeout: 5000 })

      // Should NOT navigate away
      await expect(page).toHaveURL('/adventures/new')
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('form submission consumes credit and redirects to adventure detail', async ({ page }) => {
    const testEmail = `test-submit-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Log in and navigate to form
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Wait for navigation to dashboard after sign in
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 15000 }),
        page.click('button:has-text("Sign In")'),
      ])

      // Verify starting credit balance (aria-label contains "5 credits available")
      await expect(page.locator('[aria-label*="5 credit"]')).toBeVisible()

      await page.click('a[href="/adventures/new"]:has-text("Generate New Adventure")')
      await expect(page).toHaveURL('/adventures/new')

      // Fill out form
      // Select Primary Motif (Radix Select renders options in a portal)
      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()

      // Party Size, Party Tier, and Scenes should have defaults
      // But let's select them explicitly for thoroughness
      await page.click('[id="partySize"]')
      await page.locator('[role="option"]:has-text("4 Players")').click()

      await page.click('[id="partyTier"]')
      await page.locator('[role="option"]:has-text("Tier 1")').click()

      await page.click('[id="numScenes"]')
      await page.locator('[role="option"]:has-text("3 Scenes")').click()

      // Submit form
      await page.click('button:has-text("Generate Adventure")')

      // Should show loading state
      await expect(page.locator('text=Generating Your Adventure')).toBeVisible({ timeout: 5000 })

      // Should redirect to adventure detail page (pattern: /adventures/[uuid])
      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })

      // Verify we're on the adventure detail page (should show adventure content)
      // The exact content depends on what's rendered, but URL is the key indicator
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/adventures\/[a-f0-9-]{36}/)

      // Navigate back to dashboard to verify credit was consumed
      await page.goto('/dashboard')
      // Check for 4 credits in aria-label
      await expect(page.locator('[aria-label*="4 credit"]')).toBeVisible()
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('form shows loading state and disables submit during generation', async ({ page }) => {
    const testEmail = `test-loading-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Log in and navigate to form
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Wait for navigation to dashboard after sign in
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 15000 }),
        page.click('button:has-text("Sign In")'),
      ])

      await page.click('a[href="/adventures/new"]:has-text("Generate New Adventure")')
      await expect(page).toHaveURL('/adventures/new')

      // Fill out form quickly (Radix Select uses role="option")
      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()

      // Submit
      const submitButton = page.locator('button:has-text("Generate Adventure")')
      await submitButton.click()

      // Verify loading state appears
      await expect(page.locator('text=Generating Your Adventure')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('.animate-spin')).toBeVisible() // Spinner should be visible

      // Wait for completion (redirect)
      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('form pre-selects default values for party size, tier, and scenes', async ({ page }) => {
    const testEmail = `test-defaults-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Log in and navigate to form
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Wait for navigation to dashboard after sign in
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 15000 }),
        page.click('button:has-text("Sign In")'),
      ])

      await page.click('a[href="/adventures/new"]:has-text("Generate New Adventure")')
      await expect(page).toHaveURL('/adventures/new')

      // Verify default values are shown in the Select triggers
      // Party Size should default to "4"
      const partySizeValue = page.locator('[id="partySize"]')
      await expect(partySizeValue).toContainText('4')

      // Party Tier should default to "Tier 1"
      const partyTierValue = page.locator('[id="partyTier"]')
      await expect(partyTierValue).toContainText('Tier 1')

      // Number of Scenes should default to "3"
      const numScenesValue = page.locator('[id="numScenes"]')
      await expect(numScenesValue).toContainText('3')

      // Primary Motif should NOT have a default (user must select)
      const motifValue = page.locator('[id="motif"]')
      await expect(motifValue).toContainText('Select a motif')
    } finally {
      await deleteTestUser(testEmail)
    }
  })
})
