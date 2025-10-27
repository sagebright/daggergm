import '@testing-library/jest-dom'
import { config } from 'dotenv'
import { vi } from 'vitest'

// Load environment variables from .env.test.local
// Use override: true to ensure test env variables take precedence over any loaded by Next.js
config({ path: '.env.test.local', override: true })

// Force reload .env.local if test didn't override (Next.js might have loaded it first)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('ogvbbfzfljglfanceest')) {
  config({ path: '.env.local', override: true })
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Set fallback Supabase values for unit tests that mock the client
// Integration tests will override these with real credentials from .env.test.local
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
}
