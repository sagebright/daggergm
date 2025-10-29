import type { FullConfig } from '@playwright/test'

/**
 * Playwright Global Setup
 *
 * This setup runs once before all tests.
 * Currently used to ensure MSW can intercept requests.
 */
async function globalSetup(_config: FullConfig) {
  // MSW v2 uses Service Workers which are enabled by default in Playwright
  // No additional setup needed - MSW handlers will be registered in individual tests
  // eslint-disable-next-line no-console
  console.log('✅ Playwright global setup complete')
}

export default globalSetup
