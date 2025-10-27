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

// Verify Supabase credentials are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    `Missing Supabase credentials!\nNEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\nHas SUPABASE_SERVICE_ROLE_KEY: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  )
}
