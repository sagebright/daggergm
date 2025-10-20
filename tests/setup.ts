/**
 * Vitest Global Setup
 *
 * Runs once before all test files.
 * Use for:
 * - Loading environment variables
 * - Setting up test database
 * - Initializing global mocks
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Load test environment variables
if (!process.env.TEST_SUPABASE_URL) {
  console.warn('⚠️  TEST_SUPABASE_URL not set, using local Supabase')
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key'
}

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Global test lifecycle
beforeAll(() => {
  console.log('🧪 Starting test suite...')
})

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()
})

afterAll(() => {
  console.log('✅ Test suite complete')
})

// Suppress console warnings in tests (optional)
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    // Filter out known noisy warnings
    const message = args[0]?.toString() || ''
    if (message.includes('React does not recognize') || message.includes('validateDOMNesting')) {
      return
    }
    originalWarn(...args)
  }

  console.error = (...args: unknown[]) => {
    // Filter out known noisy errors
    const message = args[0]?.toString() || ''
    if (
      message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
      message.includes('Could not parse CSS stylesheet')
    ) {
      return
    }
    originalError(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})
