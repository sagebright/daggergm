import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware, config } from '@/middleware'
import { updateSession } from '@/lib/supabase/middleware'

// Mock dependencies
vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      redirect: vi.fn().mockReturnValue({ redirect: true }),
      next: vi.fn().mockReturnValue({ next: true }),
    },
  }
})

describe('middleware', () => {
  const mockUpdateSession = vi.mocked(updateSession)
  const mockRedirect = vi.mocked(NextResponse.redirect)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (pathname: string, cookies?: Record<string, string>) => {
    const url = `http://localhost:3002${pathname}`
    const request = {
      nextUrl: { pathname },
      url,
      cookies: {
        get: vi.fn((name: string) => (cookies?.[name] ? { value: cookies[name] } : undefined)),
      },
    } as unknown as NextRequest

    return request
  }

  describe('updateSession call', () => {
    it('should always call updateSession', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/')

      const response = await middleware(request)

      expect(mockUpdateSession).toHaveBeenCalledWith(request)
      expect(response).toBe(mockResponse)
    })
  })

  describe('protected routes', () => {
    it('should redirect to login if accessing dashboard without session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/dashboard')

      await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(new URL('/auth/login', request.url))
    })

    it('should allow access to dashboard with session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/dashboard', { 'sb-access-token': 'token' })

      const response = await middleware(request)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(response).toBe(mockResponse)
    })

    it('should protect nested dashboard routes', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/dashboard/settings')

      await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(new URL('/auth/login', request.url))
    })
  })

  describe('auth routes', () => {
    it('should redirect to dashboard if accessing login with session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/auth/login', { 'sb-access-token': 'token' })

      await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(new URL('/dashboard', request.url))
    })

    it('should allow access to login without session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/auth/login')

      const response = await middleware(request)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(response).toBe(mockResponse)
    })

    it('should redirect from auth callback with session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/auth/callback', { 'sb-access-token': 'token' })

      await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(new URL('/dashboard', request.url))
    })

    it('should allow access to auth callback without session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/auth/callback')

      const response = await middleware(request)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(response).toBe(mockResponse)
    })
  })

  describe('public routes', () => {
    it('should allow access to home page without session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/')

      const response = await middleware(request)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(response).toBe(mockResponse)
    })

    it('should allow access to adventures/new without session', async () => {
      const mockResponse = { status: 200 }
      mockUpdateSession.mockResolvedValueOnce(mockResponse as NextResponse)

      const request = createRequest('/adventures/new')

      const response = await middleware(request)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(response).toBe(mockResponse)
    })
  })

  describe('config', () => {
    it('should have correct matcher configuration', () => {
      expect(config.matcher).toEqual(['/((?!_next/static|_next/image|favicon.ico|api/).*)'])
    })
  })
})
