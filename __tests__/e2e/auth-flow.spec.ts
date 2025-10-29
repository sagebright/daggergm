import { test, expect } from '@playwright/test'

import { createConfirmedTestUser, deleteTestUser } from './fixtures/auth-helpers'

/**
 * E2E Test: Authentication Flow
 *
 * This test verifies the critical user journey:
 * 1. User logs in with email/password
 * 2. User is redirected to dashboard (NOT back to login - previous bug)
 *
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY environment variable for creating test users
 * 3. Dashboard content loads successfully
 *
 * This test catches integration issues that unit tests miss:
 * - Server Actions establish session properly
 * - Middleware recognizes authenticated session
 * - No redirect loops occur
 * - Real Supabase integration works end-to-end
 *
 * Note: Users are pre-created with confirmed emails using Supabase Admin API
 * to bypass email confirmation requirements in E2E tests.
 */
test.describe('Authentication Flow', () => {
  test('user can log in and access dashboard', async ({ page }) => {
    // Generate unique test email using timestamp
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    // Pre-create a confirmed user for testing (bypasses email confirmation)
    await createConfirmedTestUser(testEmail, testPassword)

    try {
      // Step 1: Visit landing page
      await page.goto('/')
      await expect(page).toHaveTitle(/DaggerGM/)

      // Step 2: Navigate to login page via "Get Started" button
      await page.click('text=Get Started')
      await expect(page).toHaveURL('/auth/login')

      // Step 3: Verify we're on login page
      await expect(page.locator('text=Welcome to DaggerGM')).toBeVisible()

      // Step 4: Fill in login form
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Step 5: Submit login
      await page.click('button:has-text("Sign In")')

      // Step 6: CRITICAL - Verify redirect to dashboard (not back to login!)
      // This is the bug we're testing for: middleware should recognize session
      // and allow access to dashboard, not redirect back to /auth/login
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

      // Step 7: Verify dashboard content is visible
      await expect(page.locator('h1:has-text("Your Adventures")')).toBeVisible()

      // Step 8: Verify credit balance is displayed (proof of authenticated state)
      await expect(page.locator('text=credits').first()).toBeVisible()

      // Step 9: Verify "Generate New Adventure" button is present
      await expect(page.locator('button:has-text("Generate New Adventure")')).toBeVisible()
    } finally {
      // Cleanup: Delete test user
      await deleteTestUser(testEmail)
    }
  })

  test('user cannot access dashboard without authentication', async ({ page }) => {
    // Attempt to access dashboard directly without logging in
    await page.goto('/dashboard')

    // Should be redirected to login by middleware
    await expect(page).toHaveURL('/auth/login', { timeout: 5000 })

    // Verify we're on the login page
    await expect(page.locator('text=Welcome to DaggerGM')).toBeVisible()
  })

  test('authenticated user is redirected from login to dashboard', async ({ page }) => {
    // Create a confirmed test user
    const testEmail = `test-redirect-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createConfirmedTestUser(testEmail, testPassword)

    try {
      await page.goto('/auth/login')

      // Log in
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Sign In")')
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

      // Now try to access login page again - should redirect to dashboard
      await page.goto('/auth/login')
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
    } finally {
      // Cleanup: Delete test user
      await deleteTestUser(testEmail)
    }
  })
})
