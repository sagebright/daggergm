import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page title contains DaggerGM
    await expect(page).toHaveTitle(/DaggerGM/)

    // Check for main heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('DaggerGM')
  })

  test('should have login link', async ({ page }) => {
    await page.goto('/')

    // Look for login link
    const loginLink = page.locator('text=Log in')
    await expect(loginLink).toBeVisible()

    // Click login link and verify navigation
    await loginLink.click()
    await expect(page).toHaveURL('/auth/login')
  })
})
