import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock environment variables first
const originalEnv = process.env

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  }
})

afterEach(() => {
  process.env = originalEnv
})

// Mock the supabase SSR client
const mockCreateBrowserClient = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}))

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a browser client with environment variables', async () => {
    const { createClient } = await import('@/lib/supabase/client')

    createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
    )
  })

  it('should return a client instance', async () => {
    const mockClient = { auth: {} }
    mockCreateBrowserClient.mockReturnValue(mockClient)

    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()

    expect(client).toBe(mockClient)
  })
})
