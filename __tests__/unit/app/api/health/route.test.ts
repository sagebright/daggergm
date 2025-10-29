import { describe, it, expect, vi, beforeEach } from 'vitest'

import { GET } from '@/app/api/health/route'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

describe('Health Route', () => {
  const mockSupabaseClient = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient)
    // Set up the from method chain for the health check
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    mockSupabaseClient.from = vi.fn().mockReturnValue(mockQuery)
  })

  describe('GET /api/health', () => {
    it('should return healthy status when supabase connection works', async () => {
      const mockQuery = mockSupabaseClient.from('daggerheart_adventures')
      ;(mockQuery.select().limit(1).single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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
      const mockQuery = mockSupabaseClient.from('daggerheart_adventures')
      ;(mockQuery.select().limit(1).single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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
      const mockQuery = mockSupabaseClient.from('daggerheart_adventures')
      ;(mockQuery.select().limit(1).single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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
      const mockQuery = mockSupabaseClient.from('daggerheart_adventures')
      ;(mockQuery.select().limit(1).single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const response = await GET()

      expect(response.headers.get('content-type')).toBe('application/json')
    })
  })
})
