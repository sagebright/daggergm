import { describe, it, expect, vi, beforeEach } from 'vitest'
import { expandMovement, refineMovementContent, updateMovement } from '@/app/actions/movements'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { OpenAIProvider } from '@/lib/llm/openai-provider'
import { CreditManager } from '@/lib/credits/credit-manager'

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

vi.mock('@/lib/llm/openai-provider', () => ({
  OpenAIProvider: vi.fn(() => ({
    expandMovement: vi.fn(),
    refineContent: vi.fn(),
  })),
}))

vi.mock('@/lib/credits/credit-manager')

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Movement Server Actions', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  }

  const mockLLMProvider = {
    expandMovement: vi.fn(),
    refineContent: vi.fn(),
  }

  const mockCreditManager = {
    consumeCredit: vi.fn(),
    refundCredit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as ReturnType<typeof createServerSupabaseClient>,
    )
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      mockSupabaseClient as ReturnType<typeof createServiceRoleClient>,
    )
    vi.mocked(OpenAIProvider).mockImplementation(
      () => mockLLMProvider as InstanceType<typeof OpenAIProvider>,
    )
    vi.mocked(CreditManager).mockImplementation(
      () => mockCreditManager as InstanceType<typeof CreditManager>,
    )
  })

  describe('expandMovement', () => {
    it('should expand movement content for authorized user', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventure = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        frame: 'witherwild',
        focus: 'exploration',
        config: { party_size: 4, party_level: 2 },
        movements: [
          { id: 'mov-1', title: 'Test Movement', type: 'exploration', content: 'Initial content' },
        ],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure }),
          }),
        }),
      })

      // Mock successful credit consumption
      mockCreditManager.consumeCredit.mockResolvedValueOnce({
        success: true,
        remainingCredits: 4,
      })

      mockLLMProvider.expandMovement.mockResolvedValueOnce({
        content: 'Expanded movement content with rich details...',
        mechanics: {
          dcChecks: [{ skill: 'Perception', dc: 12, consequences: 'Hidden path revealed' }],
        },
        gmNotes: 'Remember to describe the ancient carvings',
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
        }),
      })

      // Act
      const result = await expandMovement('123e4567-e89b-12d3-a456-426614174000', 'mov-1')

      // Assert
      expect(result).toEqual({
        success: true,
        content: 'Expanded movement content with rich details...',
        mechanics: expect.any(Object),
        gmNotes: 'Remember to describe the ancient carvings',
      })

      expect(mockLLMProvider.expandMovement).toHaveBeenCalledWith({
        movement: mockAdventure.movements[0],
        adventure: {
          frame: 'witherwild',
          focus: 'exploration',
          partySize: 4,
          partyLevel: 2,
        },
      })
    })

    it('should fail if user does not own the adventure', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventure = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'other-user',
        movements: [],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure }),
          }),
        }),
      })

      // Act
      const result = await expandMovement('123e4567-e89b-12d3-a456-426614174000', 'mov-1')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      })

      expect(mockLLMProvider.expandMovement).not.toHaveBeenCalled()
    })

    it('should handle LLM errors gracefully', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventure = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        frame: 'witherwild',
        focus: 'combat',
        config: { party_size: 4, party_level: 2 },
        movements: [{ id: 'mov-1', title: 'Combat', type: 'combat', content: '' }],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure }),
          }),
        }),
      })

      mockLLMProvider.expandMovement.mockRejectedValueOnce(new Error('API rate limit exceeded'))

      // Act
      const result = await expandMovement('123e4567-e89b-12d3-a456-426614174000', 'mov-1')

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'API rate limit exceeded',
      })
    })
  })

  describe('refineMovementContent', () => {
    it('should refine content based on instruction', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventure = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        frame: 'witherwild',
        movements: [
          {
            id: 'mov-1',
            title: 'Forest Path',
            type: 'exploration',
            content: 'The path winds through trees.',
          },
        ],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValueOnce({ data: mockAdventure }),
          }),
        }),
      })

      mockLLMProvider.refineContent.mockResolvedValueOnce({
        refinedContent: 'The ancient path winds through towering oaks, their gnarled roots...',
        changes: ['Added sensory details', 'Enhanced atmosphere'],
      })

      // Act
      const result = await refineMovementContent(
        '123e4567-e89b-12d3-a456-426614174000',
        'mov-1',
        'Add more sensory details and atmosphere',
      )

      // Assert
      expect(result).toEqual({
        success: true,
        content: 'The ancient path winds through towering oaks, their gnarled roots...',
        changes: ['Added sensory details', 'Enhanced atmosphere'],
      })

      expect(mockLLMProvider.refineContent).toHaveBeenCalledWith({
        content: 'The path winds through trees.',
        instruction: 'Add more sensory details and atmosphere',
        context: {
          movement: {
            type: 'exploration',
            title: 'Forest Path',
          },
          adventure: {
            frame: 'witherwild',
          },
        },
      })
    })
  })

  describe('updateMovement', () => {
    it('should update movement content', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const mockAdventure = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        movements: [{ id: 'mov-1', title: 'Original', type: 'combat', content: 'Old content' }],
      }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      // First call to from() for select
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValueOnce({ data: mockAdventure }),
            }),
          }),
        }),
      })

      // Second call to from() for update (this is called via createServiceRoleClient)
      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      // Act
      const result = await updateMovement('adv-123', 'mov-1', {
        content: 'New content',
        title: 'Updated Title',
      })

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('adventures')
    })

    it('should validate movement updates', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      // Act - Invalid title (too long)
      const result = await updateMovement('adv-123', 'mov-1', {
        title: 'A'.repeat(201), // Exceeds 200 char limit
      })

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Validation error'),
      })
    })
  })
})
