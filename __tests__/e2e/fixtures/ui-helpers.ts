import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Select an option from a Radix UI Select component
 * This handles the animation timing issues by waiting for the listbox to be visible
 * before clicking the option, and waiting for it to close after selection.
 *
 * @param page - Playwright page object
 * @param triggerId - The id of the select trigger (e.g., 'motif', 'partySize')
 * @param optionText - The text of the option to select (e.g., 'High Fantasy')
 */
export async function selectOption(page: Page, triggerId: string, optionText: string) {
  // Click the trigger to open the dropdown
  const trigger = page.locator(`[id="${triggerId}"]`)
  await trigger.click()

  // Wait for the listbox to be visible (animation complete)
  const listbox = page.locator('[role="listbox"]')
  await expect(listbox).toBeVisible({ timeout: 5000 })

  // Find and click the option
  const option = page.locator(`[role="option"]:has-text("${optionText}")`)
  await expect(option).toBeVisible({ timeout: 5000 })
  await option.click()

  // Wait for the listbox to close (animation complete)
  await expect(listbox).not.toBeVisible({ timeout: 5000 })
}

/**
 * Fill out the adventure creation form with default values
 * This is a helper to avoid repeating the same form fill logic across tests
 *
 * @param page - Playwright page object
 * @param options - Optional overrides for form values
 */
export async function fillAdventureForm(
  page: Page,
  options: {
    motif?: string
    partySize?: string
    partyTier?: string
    numScenes?: string
  } = {},
) {
  const { motif = 'High Fantasy', partySize, partyTier, numScenes } = options

  // Select motif (required)
  await selectOption(page, 'motif', motif)

  // Select optional fields if provided
  if (partySize) {
    await selectOption(page, 'partySize', partySize)
  }
  if (partyTier) {
    await selectOption(page, 'partyTier', partyTier)
  }
  if (numScenes) {
    await selectOption(page, 'numScenes', numScenes)
  }
}
