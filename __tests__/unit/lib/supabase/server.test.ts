import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  }
})

afterEach(() => {
  process.env = originalEnv
})

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

describe('Supabase Server Utils', () => {
  const mockCreateServerClient = vi.mocked(createServerClient)
  const mockCookies = vi.mocked(cookies)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createServerSupabaseClient', () => {
    const mockCookieStore = {
      getAll: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      [Symbol.iterator]: vi.fn(),
      size: 0,
    }

    beforeEach(() => {
      mockCookies.mockResolvedValue(mockCookieStore)
    })

    it('should create server client with environment variables', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)
      mockCookieStore.getAll.mockReturnValue([{ name: 'test', value: 'value', options: {} }])

      const client = await createServerSupabaseClient()

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      )
      expect(client).toBe(mockClient)
    })

    it('should call cookies().getAll() when getAll is called', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)
      mockCookieStore.getAll.mockReturnValue([{ name: 'test', value: 'value', options: {} }])

      await createServerSupabaseClient()

      // Get the cookies config that was passed to createServerClient
      const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

      // Call getAll to test it
      const result = cookiesConfig.getAll()

      expect(mockCookieStore.getAll).toHaveBeenCalled()
      expect(result).toEqual([{ name: 'test', value: 'value', options: {} }])
    })

    it('should call cookieStore.set() for each cookie in setAll', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)

      await createServerSupabaseClient()

      // Get the cookies config that was passed to createServerClient
      const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

      // Test setAll
      const cookiesToSet = [
        { name: 'cookie1', value: 'value1', options: { path: '/' } },
        { name: 'cookie2', value: 'value2', options: { path: '/test' } },
      ]

      expect(cookiesConfig).toBeDefined()
      ;(cookiesConfig as any).setAll(cookiesToSet)

      expect(mockCookieStore.set).toHaveBeenCalledTimes(2)
      expect(mockCookieStore.set).toHaveBeenCalledWith('cookie1', 'value1', { path: '/' })
      expect(mockCookieStore.set).toHaveBeenCalledWith('cookie2', 'value2', { path: '/test' })
    })

    it('should handle errors in setAll gracefully', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Set called from Server Component')
      })

      await createServerSupabaseClient()

      // Get the cookies config that was passed to createServerClient
      const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

      // Test that setAll doesn't throw even when cookieStore.set throws
      expect(cookiesConfig).toBeDefined()
      expect(() => {
        ;(cookiesConfig as any).setAll([{ name: 'cookie1', value: 'value1', options: { path: '/' } }])
      }).not.toThrow()
    })
  })

  describe('createServiceRoleClient', () => {
    it('should create service role client with environment variables', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)

      const client = await createServiceRoleClient()

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      )
      expect(client).toBe(mockClient)
    })

    it('should have getAll return empty array', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)

      await createServiceRoleClient()

      // Get the cookies config that was passed to createServerClient
      const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

      // Test getAll returns empty array
      const result = cookiesConfig.getAll()
      expect(result).toEqual([])
    })

    it('should have setAll be a no-op function', async () => {
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient)

      await createServiceRoleClient()

      // Get the cookies config that was passed to createServerClient
      const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

      // Test setAll does nothing (no-op)
      expect(cookiesConfig).toBeDefined()
      expect(() => {
        ;(cookiesConfig as any).setAll([{ name: 'cookie1', value: 'value1', options: { path: '/' } }])
      }).not.toThrow()
    })
  })
})
