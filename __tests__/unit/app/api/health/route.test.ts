import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

describe('Health Route', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient)
  })

  describe('GET /api/health', () => {
    it('should return healthy status when supabase connection works', async () => {
      mockSupabaseClient.from().select().limit().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        database: 'connected',
      })
    })

    it('should return error status when supabase query fails', async () => {
      mockSupabaseClient
        .from()
        .select()
        .limit()
        .single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Connection failed' },
        })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        database: 'error',
      })
    })

    it('should return error status when supabase client creation fails', async () => {
      vi.mocked(createServerSupabaseClient).mockRejectedValueOnce(
        new Error('Failed to create client'),
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        database: 'error',
      })
    })

    it('should include valid timestamp in ISO format', async () => {
      mockSupabaseClient.from().select().limit().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const response = await GET()
      const data = await response.json()

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Verify it's a valid date
      const timestamp = new Date(data.timestamp)
      expect(timestamp.getTime()).not.toBeNaN()
    })

    it('should have proper response headers', async () => {
      mockSupabaseClient.from().select().limit().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const response = await GET()

      expect(response.headers.get('content-type')).toBe('application/json')
    })
  })
})
