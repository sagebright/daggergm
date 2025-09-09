import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page title contains DaggerGM
    await expect(page).toHaveTitle(/DaggerGM/)

    // Check for main heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Create Epic Daggerheart Adventures')
  })

  test('should have get started button', async ({ page }) => {
    await page.goto('/')

    // Look for Get Started button
    const getStartedButton = page.locator('text=Get Started')
    await expect(getStartedButton).toBeVisible()

    // Click button and verify navigation
    await getStartedButton.click()
    await expect(page).toHaveURL('/auth/login')
  })
})
