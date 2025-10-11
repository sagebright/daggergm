import { describe, it, expect, vi, beforeEach } from 'vitest'
import { expandMovement, refineMovementContent } from '@/app/actions/movements'
import { CreditManager } from '@/lib/credits/credit-manager'
import { InsufficientCreditsError } from '@/lib/credits/errors'

// Mock dependencies
vi.mock('@/lib/credits/credit-manager')
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock LLM provider
vi.mock('@/lib/llm/openai-provider', () => ({
  OpenAIProvider: vi.fn(() => ({
    expandMovement: vi.fn().mockResolvedValue({
      content: 'Expanded content',
      mechanics: { dcChecks: [] },
      gmNotes: 'GM notes',
    }),
    refineContent: vi.fn().mockResolvedValue({
      refinedContent: 'Refined content',
      changes: ['Added details'],
    }),
  })),
}))

// Mock Supabase server
let mockSupabaseInstance: {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabaseInstance)),
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

describe('Movement Actions with Credits', () => {
  let mockCreditManager: {
    consumeCredit: ReturnType<typeof vi.fn>
    refundCredit: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreditManager = {
      consumeCredit: vi.fn(),
      refundCredit: vi.fn(),
    }
    vi.mocked(CreditManager).mockImplementation(
      () => mockCreditManager as unknown as InstanceType<typeof CreditManager>,
    )

    mockSupabaseInstance = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'adv-123',
                user_id: 'user-123',
                frame: 'witherwild',
                focus: 'mystery',
                config: { party_size: 4, party_level: 2 },
                movements: [
                  {
                    id: 'mov-1',
                    title: 'Movement 1',
                    type: 'combat',
                    content: 'Initial content',
                  },
                ],
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: null,
            }),
          ),
        })),
      })),
    }
  })

  describe('expandMovement', () => {
    it('should consume a credit when expanding a movement', async () => {
      mockCreditManager.consumeCredit.mockResolvedValueOnce({
        success: true,
        remainingCredits: 4,
      })

      const result = await expandMovement('123e4567-e89b-12d3-a456-426614174000', 'mov-1')

      if (!result.success) {
        console.log('Expand test failed:', result.error)
      }
      expect(result.success).toBe(true)
      expect(mockCreditManager.consumeCredit).toHaveBeenCalledWith('user-123', 'expansion', {
        adventureId: '123e4567-e89b-12d3-a456-426614174000',
        movementId: 'mov-1',
      })
    })

    it('should fail if user has insufficient credits', async () => {
      mockCreditManager.consumeCredit.mockRejectedValueOnce(new InsufficientCreditsError())

      const result = await expandMovement('123e4567-e89b-12d3-a456-426614174000', 'mov-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient credits to expand movement')
    })

    it('should refund credit if expansion fails after consumption', async () => {
      mockCreditManager.consumeCredit.mockResolvedValueOnce({
        success: true,
        remainingCredits: 4,
      })

      // For this test, we just need to check that refund is called
      // when any error occurs, so we'll make the update fail instead
      mockSupabaseInstance.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'adv-123',
                user_id: 'user-123',
                frame: 'witherwild',
                focus: 'mystery',
                config: { party_size: 4, party_level: 2 },
                movements: [
                  {
                    id: 'mov-1',
                    title: 'Movement 1',
                    type: 'combat',
                    content: 'Initial content',
                  },
                ],
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Update failed' },
            }),
          ),
        })),
      }))

      mockCreditManager.refundCredit.mockResolvedValueOnce({
        success: true,
        newBalance: 5,
      })

      const result = await expandMovement('123e4567-e89b-12d3-a456-426614174000', 'mov-1')

      expect(result.success).toBe(false)
      expect(mockCreditManager.refundCredit).toHaveBeenCalledWith(
        'user-123',
        'expansion',
        expect.objectContaining({
          adventureId: '123e4567-e89b-12d3-a456-426614174000',
          movementId: 'mov-1',
          reason: 'Expansion failed',
        }),
      )
    })
  })

  describe('refineMovementContent', () => {
    it('should consume a credit when refining content', async () => {
      mockCreditManager.consumeCredit.mockResolvedValueOnce({
        success: true,
        remainingCredits: 4,
      })

      const result = await refineMovementContent(
        '123e4567-e89b-12d3-a456-426614174000',
        'mov-1',
        'Add more details',
      )

      expect(result.success).toBe(true)
      expect(mockCreditManager.consumeCredit).toHaveBeenCalledWith('user-123', 'expansion', {
        adventureId: '123e4567-e89b-12d3-a456-426614174000',
        movementId: 'mov-1',
        refinementType: 'refine',
      })
    })

    it('should fail if user has insufficient credits', async () => {
      mockCreditManager.consumeCredit.mockRejectedValueOnce(new InsufficientCreditsError())

      const result = await refineMovementContent(
        '123e4567-e89b-12d3-a456-426614174000',
        'mov-1',
        'Add more details',
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient credits to refine content')
    })
  })
})
