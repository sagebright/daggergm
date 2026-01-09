import { describe, it, expect, vi, beforeEach } from 'vitest'

import { generateAdventure, getAdventure, getUserAdventures } from '@/app/actions/adventures'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { getLLMProvider } from '@/lib/llm/provider'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockResolvedValue({ error: null }),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }),
  ),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock CreditManager - Vitest 4: Constructor mocks must use class or function keyword
const mockCreditManagerInstance = {
  consumeCredit: vi.fn(),
  refundCredit: vi.fn(),
  getUserCredits: vi.fn(),
}
vi.mock('@/lib/credits/credit-manager', () => ({
  CreditManager: class MockCreditManager {
    consumeCredit = mockCreditManagerInstance.consumeCredit
    refundCredit = mockCreditManagerInstance.refundCredit
    getUserCredits = mockCreditManagerInstance.getUserCredits
  },
}))
vi.mock('@/lib/llm/provider')

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'test-uuid'),
  },
  randomUUID: vi.fn(() => 'test-uuid'),
}))

// Mock OpenAI - Vitest 4: Constructor mocks must use class or function keyword
const mockChatCompletionsCreate = vi.fn()
vi.mock('openai', () => ({
  OpenAI: class MockOpenAI {
    chat = {
      completions: {
        create: mockChatCompletionsCreate,
      },
    }
  },
}))

describe('Adventure Server Actions', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  const mockLLMProvider = {
    generateAdventureScaffold: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
    )
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createServiceRoleClient>>,
    )
    vi.mocked(getLLMProvider).mockReturnValue(
      mockLLMProvider as unknown as ReturnType<typeof getLLMProvider>,
    )
  })

  describe('generateAdventure', () => {
    it('should generate adventure for authenticated user with credits', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventure = {
        id: 'test-uuid',
        title: 'The Lost Temple',
        description: 'An epic quest',
        movements: [],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      // Mock credit consumption
      mockCreditManagerInstance.consumeCredit.mockResolvedValueOnce({
        success: true,
        remainingCredits: 4,
      })

      // Mock LLM provider
      mockLLMProvider.generateAdventureScaffold.mockResolvedValueOnce({
        title: 'The Lost Temple',
        description: 'An epic quest',
        estimatedDuration: '3-4 hours',
        movements: [],
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure, error: null }),
          }),
        }),
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
        adventureId: 'test-uuid',
      })

      // Verify credit was consumed
      expect(mockCreditManagerInstance.consumeCredit).toHaveBeenCalledWith(
        'user-123',
        'adventure',
        {
          adventureId: 'test-uuid',
        },
      )
    })

    it('should fail if user has insufficient credits', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      // Mock insufficient credits error
      mockCreditManagerInstance.consumeCredit.mockRejectedValueOnce(new InsufficientCreditsError())

      // Act
      const result = await generateAdventure({
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      })

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Insufficient credits to generate adventure',
      })
    })

    it('should require authentication for adventure generation', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      })

      // Act
      const result = await generateAdventure({
        length: 'oneshot',
        primary_motif: 'low_fantasy',
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Authentication required')
      }
    })

    it('should handle LLM errors gracefully and refund credits', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      // Mock successful credit consumption
      mockCreditManagerInstance.consumeCredit.mockResolvedValueOnce({
        success: true,
        remainingCredits: 4,
      })

      // Mock LLM error
      mockLLMProvider.generateAdventureScaffold.mockRejectedValueOnce(
        new Error('API rate limit exceeded'),
      )

      // Mock credit refund
      mockCreditManagerInstance.refundCredit.mockResolvedValueOnce({
        success: true,
        newBalance: 5,
      })

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

      // Verify credit was refunded
      expect(mockCreditManagerInstance.refundCredit).toHaveBeenCalledWith(
        'user-123',
        'adventure',
        expect.objectContaining({
          adventureId: 'test-uuid',
          reason: 'Generation failed',
        }),
      )
    })
  })

  describe('getAdventure', () => {
    it('should fetch adventure by id', async () => {
      // Arrange
      const mockAdventure = {
        id: '123e4567-e89b-12d3-a456-426614174000',
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
      const result = await getAdventure('123e4567-e89b-12d3-a456-426614174000')

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
      const result = await getAdventure('00000000-0000-0000-0000-000000000000')

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
