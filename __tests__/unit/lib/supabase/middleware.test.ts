import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

// Mock environment variables
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

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      next: vi.fn().mockReturnValue({
        next: vi.fn(),
        cookies: {
          set: vi.fn(),
        },
      }),
    },
  }
})

describe('updateSession', () => {
  const mockCreateServerClient = vi.mocked(createServerClient)
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
  }

  const mockNextResponse = {
    next: vi.fn(),
    cookies: {
      set: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue(mockSupabaseClient)
    // Reset the NextResponse mock to return our mock response
    vi.mocked(NextResponse.next).mockReturnValue(mockNextResponse)
  })

  const createMockRequest = (cookies: Array<{ name: string; value: string }> = []) => {
    return {
      headers: new Headers({ 'test-header': 'test-value' }),
      cookies: {
        getAll: vi.fn().mockReturnValue(cookies),
        set: vi.fn(),
      },
    } as unknown as NextRequest
  }

  it('should create supabase client with environment variables', async () => {
    const request = createMockRequest()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    await updateSession(request)

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
  })

  it('should call getUser to refresh auth token', async () => {
    const request = createMockRequest()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    await updateSession(request)

    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
  })

  it('should return NextResponse', async () => {
    const request = createMockRequest()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    const response = await updateSession(request)

    expect(response).toBe(mockNextResponse)
  })

  it('should pass request headers to NextResponse', async () => {
    const request = createMockRequest()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    await updateSession(request)

    expect(NextResponse.next).toHaveBeenCalledWith({
      request: {
        headers: request.headers,
      },
    })
  })

  it('should handle cookies.getAll() correctly', async () => {
    const cookies = [
      { name: 'session', value: 'abc123' },
      { name: 'refresh', value: 'xyz789' },
    ]
    const request = createMockRequest(cookies)
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    await updateSession(request)

    // Get the cookies config that was passed to createServerClient
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

    // Test getAll
    const result = cookiesConfig.getAll()

    expect(request.cookies.getAll).toHaveBeenCalled()
    expect(result).toEqual(cookies)
  })

  it('should handle cookies.setAll() correctly', async () => {
    const request = createMockRequest()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    await updateSession(request)

    // Get the cookies config that was passed to createServerClient
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies

    // Test setAll
    const cookiesToSet = [
      { name: 'session', value: 'new-session', options: { path: '/' } },
      { name: 'refresh', value: 'new-refresh', options: { path: '/' } },
    ]

    cookiesConfig.setAll(cookiesToSet)

    // Should set cookies on request
    expect(request.cookies.set).toHaveBeenCalledWith('session', 'new-session')
    expect(request.cookies.set).toHaveBeenCalledWith('refresh', 'new-refresh')

    // Should create new NextResponse
    expect(NextResponse.next).toHaveBeenCalledWith({ request })

    // Should set cookies on response
    expect(mockNextResponse.cookies.set).toHaveBeenCalledWith('session', 'new-session', {
      path: '/',
    })
    expect(mockNextResponse.cookies.set).toHaveBeenCalledWith('refresh', 'new-refresh', {
      path: '/',
    })
  })

  it('should handle user authentication', async () => {
    const request = createMockRequest()
    const mockUser = { id: '123', email: 'test@example.com' }
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const response = await updateSession(request)

    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
    expect(response).toBe(mockNextResponse)
  })

  it('should handle authentication errors', async () => {
    const request = createMockRequest()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    const response = await updateSession(request)

    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
    expect(response).toBe(mockNextResponse)
  })
})
