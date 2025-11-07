import { describe, it, expect, vi, beforeEach } from 'vitest'

import { exportAdventure } from '@/app/actions/export'
import { MarkdownExporter } from '@/lib/export/markdown-exporter'
import { PDFExporter } from '@/lib/export/pdf-exporter'
import { Roll20Exporter } from '@/lib/export/roll20-exporter'

// Create a variable to hold the mock Supabase client
let mockSupabase: {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))
vi.mock('@/lib/export/markdown-exporter')
vi.mock('@/lib/export/pdf-exporter')
vi.mock('@/lib/export/roll20-exporter')

// Mock analytics
vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    track: vi.fn().mockResolvedValue(undefined),
    identify: vi.fn().mockResolvedValue(undefined),
    page: vi.fn().mockResolvedValue(undefined),
  },
  ANALYTICS_EVENTS: {
    ADVENTURE_EXPORTED: 'adventure_exported',
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limiting/middleware', () => ({
  withRateLimit: vi.fn((fn) => fn),
  getRateLimitContext: vi.fn().mockReturnValue({
    enabled: false,
    key: 'test',
    limit: 10,
    windowMs: 60000,
  }),
}))

vi.mock('@/lib/rate-limiting/rate-limiter', () => ({
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'RateLimitError'
    }
  },
}))

describe('Export Server Actions', () => {
  const mockMovements = [
    {
      id: 'mov-1',
      title: 'First Movement',
      type: 'exploration',
      content: 'Content here',
      estimatedTime: '30 minutes',
      isLocked: false,
      metadata: {},
    },
  ]

  const mockAdventure = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'The Lost Mine',
    frame: 'grimdark',
    focus: 'Exploration',
    state: 'draft',
    user_id: 'user-123',
    config: {
      frame: 'witherwild',
      focus: 'Exploration',
      partySize: 4,
      partyLevel: 2,
      difficulty: 'standard',
      stakes: 'high',
    },
    movements: mockMovements,
    metadata: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    exported_at: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup the mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAdventure, error: null }),
      order: vi.fn().mockResolvedValue({ data: mockMovements, error: null }),
    })
  })

  describe('exportAdventure', () => {
    it('should export adventure as markdown', async () => {
      const mockExporter = {
        exportToFile: vi.fn().mockReturnValue({
          filename: 'adventure.md',
          content: '# Adventure',
          mimeType: 'text/markdown',
        }),
      }
      vi.mocked(MarkdownExporter).mockImplementation(
        () => mockExporter as unknown as InstanceType<typeof MarkdownExporter>,
      )

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Blob)
      expect(result.filename).toBe('adventure.md')

      // Check that exportToFile was called with the transformed adventure data
      expect(mockExporter.exportToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockAdventure.id,
          title: mockAdventure.title,
          frame: mockAdventure.frame,
          focus: mockAdventure.focus,
          state: mockAdventure.state,
          movements: mockMovements,
        }),
        mockMovements,
      )
    })

    it('should export adventure as PDF', async () => {
      const mockExporter = {
        exportToFile: vi.fn().mockResolvedValue({
          filename: 'adventure.pdf',
          content: Buffer.from('PDF content'),
          mimeType: 'application/pdf',
        }),
      }
      vi.mocked(PDFExporter).mockImplementation(
        () => mockExporter as unknown as InstanceType<typeof PDFExporter>,
      )

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'pdf')

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Blob)
      expect(result.filename).toBe('adventure.pdf')
    })

    it('should export adventure as Roll20 format', async () => {
      const mockExporter = {
        exportToFile: vi.fn().mockReturnValue({
          filename: 'adventure-roll20.txt',
          content: 'Roll20 format',
          mimeType: 'text/plain',
        }),
      }
      vi.mocked(Roll20Exporter).mockImplementation(
        () => mockExporter as unknown as InstanceType<typeof Roll20Exporter>,
      )

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'roll20')

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Blob)
      expect(result.filename).toBe('adventure-roll20.txt')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should verify user owns the adventure', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'other-user' } },
        error: null,
      })

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Adventure not found')
    })

    it('should handle adventure not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Adventure not found')
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch adventure')
    })

    it('should handle export errors', async () => {
      const mockExporter = {
        exportToFile: vi.fn().mockImplementation(() => {
          throw new Error('Export failed')
        }),
      }
      vi.mocked(MarkdownExporter).mockImplementation(
        () => mockExporter as unknown as InstanceType<typeof MarkdownExporter>,
      )

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to export adventure')
    })

    it('should handle invalid export format', async () => {
      const result = await exportAdventure(
        '123e4567-e89b-12d3-a456-426614174000',
        'invalid' as 'markdown' | 'pdf' | 'roll20',
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid option')
    })

    it('should include movements from adventure JSONB array', async () => {
      const mockExporter = {
        exportToFile: vi.fn().mockReturnValue({
          filename: 'adventure.md',
          content: '# Adventure',
          mimeType: 'text/markdown',
        }),
      }
      vi.mocked(MarkdownExporter).mockImplementation(
        () => mockExporter as unknown as InstanceType<typeof MarkdownExporter>,
      )

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(true)
      // Verify movements are extracted from the adventure's movements JSONB array
      expect(mockExporter.exportToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          movements: mockMovements,
        }),
        mockMovements,
      )
    })

    it('should handle empty movements array', async () => {
      const adventureWithoutMovements = {
        ...mockAdventure,
        movements: null,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: adventureWithoutMovements, error: null }),
      })

      const mockExporter = {
        exportToFile: vi.fn().mockReturnValue({
          filename: 'adventure.md',
          content: '# Adventure',
          mimeType: 'text/markdown',
        }),
      }
      vi.mocked(MarkdownExporter).mockImplementation(
        () => mockExporter as unknown as InstanceType<typeof MarkdownExporter>,
      )

      const result = await exportAdventure('123e4567-e89b-12d3-a456-426614174000', 'markdown')

      expect(result.success).toBe(true)
      // Should pass empty array when movements is null
      expect(mockExporter.exportToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          movements: [],
        }),
        [],
      )
    })
  })
})
