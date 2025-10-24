import { NextResponse } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { GET } from '@/app/auth/callback/route'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn(),
  },
}))

describe('Auth Callback Route', () => {
  const mockSupabaseClient = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient)
    // Set up the auth.exchangeCodeForSession method
    mockSupabaseClient.auth.exchangeCodeForSession = vi.fn()
  })

  describe('successful authentication', () => {
    it('should redirect to dashboard by default after successful auth', async () => {
      // Mock successful auth
      ;(
        mockSupabaseClient.auth.exchangeCodeForSession as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        error: null,
        data: { session: {} },
      })

      const request = new Request('http://localhost:3002/auth/callback?code=valid-code')

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-code')
      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3002/dashboard')
    })

    it('should redirect to specified next path after successful auth', async () => {
      // Mock successful auth
      ;(
        mockSupabaseClient.auth.exchangeCodeForSession as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        error: null,
        data: { session: {} },
      })

      const request = new Request(
        'http://localhost:3002/auth/callback?code=valid-code&next=/adventures/new',
      )

      await GET(request)

      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3002/adventures/new')
    })
  })

  describe('failed authentication', () => {
    it('should redirect to login with error when auth fails', async () => {
      // Mock failed auth
      ;(
        mockSupabaseClient.auth.exchangeCodeForSession as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        error: { message: 'Invalid code' },
        data: null,
      })

      const request = new Request('http://localhost:3002/auth/callback?code=invalid-code')

      await GET(request)

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3002/auth/login?error=Could not authenticate user',
      )
    })

    it('should redirect to login when no code is provided', async () => {
      const request = new Request('http://localhost:3002/auth/callback')

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled()
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3002/auth/login?error=Could not authenticate user',
      )
    })
  })
})
