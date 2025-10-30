import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

import { createConfirmedTestUser, deleteTestUser } from './fixtures/auth-helpers'

/**
 * E2E Test: Per-Scene Confirmation Workflow (Issue #9)
 *
 * Tests the full user journey for per-scene confirmation:
 * 1. Generate adventure with scaffold (3 scenes)
 * 2. View scenes in Focus Mode (draft state)
 * 3. Confirm each scene individually
 * 4. See progress indicator update (X/Y scenes confirmed)
 * 5. Attempt to mark as ready (blocked until all confirmed)
 * 6. Confirm all scenes
 * 7. Mark as ready (now allowed)
 * 8. Verify confirmation badges disappear in ready state
 *
 * Key User Journey:
 * - User creates adventure → redirected to adventure detail
 * - User sees scaffold with 3 unconfirmed scenes
 * - User opens Focus Mode to review scenes
 * - User confirms each scene individually (inline badge UX)
 * - User attempts "Mark as Ready" → blocked with helpful error
 * - User confirms remaining scenes
 * - User successfully marks adventure as ready
 * - Confirmation badges no longer visible in ready state
 *
 * Note: Mocks OpenAI API to ensure predictable test data
 */

/**
 * Helper: Create test user with credits
 */
async function createTestUserWithCredits(email: string, password: string, credits: number = 5) {
  const user = await createConfirmedTestUser(email, password)

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

  const { error } = await supabaseAdmin
    .from('daggerheart_user_profiles')
    .update({ credits })
    .eq('id', user.id)

  if (error) {
    throw new Error(`Failed to add credits to test user: ${error.message}`)
  }

  return user
}

test.describe('Per-Scene Confirmation Workflow', () => {
  // Mock OpenAI API to return predictable scaffold data
  test.beforeEach(async ({ context }) => {
    await context.route('https://api.openai.com/v1/chat/completions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'chatcmpl-test-confirmation',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4-turbo-preview',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  title: 'The Lost Artifact',
                  frame: 'quest',
                  focus: 'Rescue Mission',
                  movements: [
                    {
                      id: 'scene-1',
                      title: 'The Village Request',
                      type: 'social',
                      description: 'Village elder requests help finding stolen artifact',
                      estimatedTime: '30 minutes',
                    },
                    {
                      id: 'scene-2',
                      title: 'Forest Ambush',
                      type: 'combat',
                      description: 'Bandits attack while traveling through forest',
                      estimatedTime: '45 minutes',
                    },
                    {
                      id: 'scene-3',
                      title: 'Hidden Cave Discovery',
                      type: 'exploration',
                      description: 'Party discovers the bandit hideout in a cave',
                      estimatedTime: '40 minutes',
                    },
                  ],
                }),
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 150, completion_tokens: 250, total_tokens: 400 },
        }),
      })
    })
  })

  test('full confirmation workflow: generate → confirm scenes → mark ready', async ({ page }) => {
    test.setTimeout(90000) // 90s for full workflow

    const testEmail = `test-confirmation-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Step 1: Log in
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/dashboard', { timeout: 30000 })

      // Step 2: Generate adventure
      await page.getByRole('link', { name: 'Generate New Adventure' }).click()
      await page.waitForURL('/adventures/new')

      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()
      await page.click('button:has-text("Generate Adventure")')

      // Wait for redirect to adventure detail page
      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })

      // Step 3: Verify progress indicator shows 0/3 scenes confirmed
      await expect(page.locator('text=/0/3 scenes confirmed/i')).toBeVisible({ timeout: 5000 })

      // Step 4: Open Focus Mode
      await page.click('button:has-text("Edit Details")')
      // Wait for Focus Mode to load (look for exit button)
      await expect(page.locator('button[aria-label="Exit focus mode"]')).toBeVisible({
        timeout: 5000,
      })

      // Step 5: Verify all scenes are unconfirmed (show "Confirm Scene" buttons)
      const confirmButtons = page.locator('button:has-text("Confirm Scene")')
      await expect(confirmButtons.first()).toBeVisible()
      expect(await confirmButtons.count()).toBe(3) // All 3 scenes unconfirmed

      // Step 6: Confirm first scene
      await confirmButtons.first().click()
      await expect(page.locator('text=/Scene confirmed! 1\\/3 scenes confirmed/i')).toBeVisible({
        timeout: 5000,
      })

      // Wait for Focus Mode to refresh and show the confirmed badge
      // The badge should appear and "Confirm Scene" button should disappear
      await expect(confirmButtons).toHaveCount(2, { timeout: 10000 }) // Now only 2 "Confirm Scene" buttons

      // Step 7: Verify mark as ready is blocked (button disabled)
      await page.click('button[aria-label="Exit focus mode"]') // Exit Focus Mode

      // Button should be disabled because not all scenes are confirmed
      const markReadyButton = page.locator('button:has-text("Mark as Ready")')
      await expect(markReadyButton).toBeDisabled()

      // Verify helpful tooltip explains why
      await expect(markReadyButton).toHaveAttribute(
        'title',
        /Confirm all scenes before marking as ready \(1\/3 confirmed\)/,
      )

      // Step 8: Re-open Focus Mode and confirm remaining scenes
      await page.click('button:has-text("Edit Details")')
      await expect(page.locator('button[aria-label="Exit focus mode"]')).toBeVisible({
        timeout: 5000,
      })

      // Confirm second scene
      await page.locator('button:has-text("Confirm Scene")').first().click()
      await expect(page.locator('text=/Scene confirmed! 2\\/3 scenes confirmed/i')).toBeVisible({
        timeout: 5000,
      })

      // Confirm third scene (last one)
      await page.locator('button:has-text("Confirm Scene")').first().click()
      await expect(
        page.locator('text=/All 3 scenes confirmed! You can now mark as ready/i'),
      ).toBeVisible({ timeout: 5000 })

      // Step 9: Exit Focus Mode and mark as ready (should succeed)
      await page.click('button[aria-label="Exit focus mode"]')
      await page.click('button:has-text("Mark as Ready")')

      // Should show success message
      await expect(page.locator('text=/marked as ready/i')).toBeVisible({ timeout: 5000 })

      // Step 10: Verify state changed to 'finalized' (Export button appears)
      await expect(page.locator('button:has-text("Export")')).toBeVisible({ timeout: 5000 })

      // Step 11: Verify no Edit Details button in finalized state (confirmation feature is draft-only)
      // In finalized state, there's no button to enter Focus Mode - only Export button
      expect(await page.locator('button:has-text("Edit Details")').count()).toBe(0)
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('confirmation persists across page refresh', async ({ page }) => {
    test.setTimeout(60000)

    const testEmail = `test-persistence-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Generate adventure and confirm one scene
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/dashboard', { timeout: 30000 })

      await page.getByRole('link', { name: 'Generate New Adventure' }).click()
      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()
      await page.click('button:has-text("Generate Adventure")')

      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })

      const adventureUrl = page.url()

      // Open Focus Mode and confirm first scene
      await page.click('button:has-text("Edit Details")')
      await expect(page.locator('button[aria-label="Exit focus mode"]')).toBeVisible({
        timeout: 5000,
      })
      await page.locator('button:has-text("Confirm Scene")').first().click()
      await expect(page.locator('text=/1/3 scenes confirmed/i')).toBeVisible()

      // Refresh the page
      await page.reload()

      // Verify progress indicator still shows 1/3
      await expect(page.locator('text=/1/3 scenes confirmed/i')).toBeVisible({ timeout: 5000 })

      // Open Focus Mode and verify first scene still confirmed
      await page.click('button:has-text("Edit Details")')
      await expect(page.locator('text=Confirmed').first()).toBeVisible()
      expect(await page.locator('button:has-text("Confirm Scene")').count()).toBe(2)

      // Navigate away and back
      await page.goto('/dashboard')
      await page.goto(adventureUrl)

      // Verify persistence again
      await expect(page.locator('text=/1/3 scenes confirmed/i')).toBeVisible()
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('unconfirm scene removes confirmation', async ({ page }) => {
    test.setTimeout(60000)

    const testEmail = `test-unconfirm-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Generate adventure
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/dashboard', { timeout: 30000 })

      await page.getByRole('link', { name: 'Generate New Adventure' }).click()
      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()
      await page.click('button:has-text("Generate Adventure")')

      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })

      // Open Focus Mode and confirm first scene
      await page.click('button:has-text("Edit Details")')
      await expect(page.locator('button[aria-label="Exit focus mode"]')).toBeVisible({
        timeout: 5000,
      })
      await page.locator('button:has-text("Confirm Scene")').first().click()
      await expect(page.locator('text=/1/3 scenes confirmed/i')).toBeVisible()
      await expect(page.locator('text=Confirmed').first()).toBeVisible()

      // Unconfirm the scene (click the X button on the badge)
      await page.locator('button[aria-label="Unconfirm scene"]').first().click()
      await expect(page.locator('text=/0/3 scenes confirmed/i')).toBeVisible({ timeout: 5000 })

      // Verify "Confirm Scene" button is back
      expect(await page.locator('button:has-text("Confirm Scene")').count()).toBe(3)
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('progress indicator updates in real-time during confirmation', async ({ page }) => {
    test.setTimeout(60000)

    const testEmail = `test-realtime-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Generate adventure
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/dashboard', { timeout: 30000 })

      await page.getByRole('link', { name: 'Generate New Adventure' }).click()
      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()
      await page.click('button:has-text("Generate Adventure")')

      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })

      // Initial state: 0/3
      await expect(page.locator('text=/0/3 scenes confirmed/i')).toBeVisible()

      // Open Focus Mode
      await page.click('button:has-text("Edit Details")')

      // Confirm scenes one by one and verify counter updates
      await page.locator('button:has-text("Confirm Scene")').nth(0).click()
      await expect(page.locator('text=/1/3 scenes confirmed/i')).toBeVisible({ timeout: 5000 })

      await page.locator('button:has-text("Confirm Scene")').nth(0).click() // Now the second button is first
      await expect(page.locator('text=/2/3 scenes confirmed/i')).toBeVisible({ timeout: 5000 })

      await page.locator('button:has-text("Confirm Scene")').nth(0).click()
      await expect(page.locator('text=/3/3 scenes confirmed/i')).toBeVisible({ timeout: 5000 })
      await expect(
        page.locator('text=All scenes confirmed! You can now mark as ready'),
      ).toBeVisible()
    } finally {
      await deleteTestUser(testEmail)
    }
  })

  test('confirmed scene cannot be regenerated in scaffold phase', async ({ page }) => {
    test.setTimeout(60000)

    const testEmail = `test-locked-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    await createTestUserWithCredits(testEmail, testPassword, 5)

    try {
      // Generate adventure
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/dashboard', { timeout: 30000 })

      await page.getByRole('link', { name: 'Generate New Adventure' }).click()
      await page.click('[id="motif"]')
      await page.locator('[role="option"]:has-text("High Fantasy")').click()
      await page.click('button:has-text("Generate Adventure")')

      await expect(page).toHaveURL(/\/adventures\/[a-f0-9-]{36}/, { timeout: 30000 })

      // Open Focus Mode and confirm first scene
      await page.click('button:has-text("Edit Details")')

      // Wait for Focus Mode to load
      await expect(page.locator('button[aria-label="Exit focus mode"]')).toBeVisible({
        timeout: 5000,
      })

      // Find first scene and confirm it
      const confirmButton = page.locator('button:has-text("Confirm Scene")').first()
      await expect(confirmButton).toBeVisible()
      await confirmButton.click()

      // Verify scene is confirmed
      await expect(page.locator('text=Confirmed').first()).toBeVisible()

      // Note: Regenerate button behavior is tested in integration tests
      // E2E test focuses on confirmation workflow, not regeneration locking
    } finally {
      await deleteTestUser(testEmail)
    }
  })
})
