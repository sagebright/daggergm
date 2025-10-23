import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Configuration for DaggerGM
 *
 * Focus areas:
 * - Focus Mode interactions (collapse/expand, gestures)
 * - Guest flow (free adventure → signup prompt)
 * - Adventure generation (streaming UI, error states)
 * - Credit purchases (Stripe checkout flow)
 */

export default defineConfig({
  // Test Directory
  testDir: './tests/e2e',

  // Parallelization
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  // Retries (network flakiness)
  retries: process.env.CI ? 2 : 0,

  // Timeouts
  timeout: 30000, // 30s per test
  expect: {
    timeout: 5000, // 5s for assertions
  },

  // Reporter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],

  // Global Setup/Teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),

  // Common Test Options
  use: {
    // Base URL (set via env var or default to local)
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Tracing (helps debug CI failures)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (local dev)
    ignoreHTTPSErrors: true,

    // Context Options
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  // Projects (Test across browsers + viewports)
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Viewports (Critical for Focus Mode gestures)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },

    // Tablet (Medium viewport)
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Web Server (auto-start Next.js during tests)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    env: {
      // Use test database
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || '',
      OPENAI_API_KEY: 'sk-test-mock-key', // Use MSW for LLM calls
    },
  },
})
