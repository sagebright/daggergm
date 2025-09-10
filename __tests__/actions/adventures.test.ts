import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAdventure, getAdventure, getUserAdventures } from '@/app/actions/adventures'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock OpenAI module
vi.mock('openai')

describe('Adventure Server Actions', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  const mockOpenAIInstance = {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAIInstance as any)
  })

  describe('generateAdventure', () => {
    it('should generate adventure for authenticated user with credits', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockProfile = { credits: 5 }
      const mockAdventure = {
        id: 'adv-123',
        title: 'The Lost Temple',
        description: 'An epic quest',
        movements: [],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValueOnce({ data: mockProfile }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValueOnce({ data: mockAdventure, error: null }),
            }),
          }),
        })

      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'The Lost Temple',
                description: 'An epic quest',
                movements: [],
              }),
            },
          },
        ],
      })

      // Act
      const result = await generateAdventure({
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        party_size: 4,
        party_level: 1,
        difficulty: 'standard',
        stakes: 'personal',
      })

      // Assert
      expect(result).toEqual({
        success: true,
        adventureId: 'adv-123',
      })

      // Verify credit was consumed
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should fail if user has insufficient credits', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockProfile = { credits: 0 }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockProfile }),
          }),
        }),
      })

      // Act
      const result = await generateAdventure({
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      })

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Insufficient credits',
      })
    })

    it('should allow guest users to generate adventures', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      })

      const mockAdventure = {
        id: 'adv-guest-123',
        title: 'Guest Adventure',
        user_id: null,
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure, error: null }),
          }),
        }),
      })

      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Guest Adventure',
                description: 'A guest adventure',
                movements: [],
              }),
            },
          },
        ],
      })

      // Act
      const result = await generateAdventure({
        length: 'oneshot',
        primary_motif: 'low_fantasy',
      })

      // Assert
      expect(result).toEqual({
        success: true,
        adventureId: 'adv-guest-123',
      })
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      })

      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(
        new Error('API rate limit exceeded'),
      )

      // Act
      const result = await generateAdventure({
        length: 'oneshot',
        primary_motif: 'weird',
      })

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'API rate limit exceeded',
      })
    })
  })

  describe('getAdventure', () => {
    it('should fetch adventure by id', async () => {
      // Arrange
      const mockAdventure = {
        id: 'adv-123',
        title: 'Test Adventure',
        created_at: '2024-01-01',
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure, error: null }),
          }),
        }),
      })

      // Act
      const result = await getAdventure('adv-123')

      // Assert
      expect(result).toEqual(mockAdventure)
    })

    it('should return null if adventure not found', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      })

      // Act
      const result = await getAdventure('non-existent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getUserAdventures', () => {
    it('should fetch all adventures for authenticated user', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventures = [
        { id: 'adv-1', title: 'Adventure 1' },
        { id: 'adv-2', title: 'Adventure 2' },
      ]

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValueOnce({ data: mockAdventures, error: null }),
          }),
        }),
      })

      // Act
      const result = await getUserAdventures()

      // Assert
      expect(result).toEqual(mockAdventures)
    })

    it('should return empty array for unauthenticated users', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      })

      // Act
      const result = await getUserAdventures()

      // Assert
      expect(result).toEqual([])
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })
})
