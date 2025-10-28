import { describe, it, expect, vi, beforeEach } from 'vitest'

import { generateAdventure } from '@/app/actions/adventures'
import { CreditManager } from '@/lib/credits/credit-manager'
import { InsufficientCreditsError } from '@/lib/credits/errors'

// Mock crypto module
vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'test-adventure-id'),
  },
  randomUUID: vi.fn(() => 'test-adventure-id'),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock dependencies
vi.mock('@/lib/credits/credit-manager')
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'test-adventure-id', title: 'Test Adventure' },
              error: null,
            }),
          })),
        })),
      })),
    }),
  ),
  createServiceRoleClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'test-adventure-id', title: 'Test Adventure' },
              error: null,
            }),
          })),
        })),
      })),
    }),
  ),
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

vi.mock('@/lib/llm/provider', () => ({
  getLLMProvider: vi.fn(() => ({
    generateAdventureScaffold: vi.fn().mockResolvedValue({
      title: 'Test Adventure',
      description: 'A test adventure',
      estimatedDuration: '3-4 hours',
      movements: [
        {
          id: 'mov-1',
          title: 'Movement 1',
          type: 'combat',
          description: 'Combat encounter',
          estimatedTime: '30 minutes',
          orderIndex: 0,
        },
      ],
    }),
    expandMovement: vi.fn(),
    expandScene: vi.fn(), // NEW: Six-component scene expansion
    refineContent: vi.fn(),
  })),
}))

describe('Adventure Generation with Credits', () => {
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
  })

  it('should consume a credit when generating an adventure', async () => {
    mockCreditManager.consumeCredit.mockResolvedValueOnce({
      success: true,
      remainingCredits: 4,
    })

    const result = await generateAdventure({
      length: 'oneshot',
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      partySize: 4,
      partyLevel: 2,
      difficulty: 'standard',
      stakes: 'personal',
    })

    expect(result.success).toBe(true)
    expect(mockCreditManager.consumeCredit).toHaveBeenCalledWith('user-123', 'adventure', {
      adventureId: 'test-adventure-id',
    })
  })

  it('should fail if user has insufficient credits', async () => {
    mockCreditManager.consumeCredit.mockRejectedValueOnce(new InsufficientCreditsError())

    const result = await generateAdventure({
      length: 'oneshot',
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      partySize: 4,
      partyLevel: 2,
      difficulty: 'standard',
      stakes: 'personal',
    })

    expect(result.success).toBe(false)
    if (!result.success && 'error' in result) {
      expect(result.error).toBe('Insufficient credits to generate adventure')
    }
  })

  it('should refund credit if adventure generation fails after consumption', async () => {
    mockCreditManager.consumeCredit.mockResolvedValueOnce({
      success: true,
      remainingCredits: 4,
    })

    // Make LLM generation fail
    const { getLLMProvider } = await import('@/lib/llm/provider')
    vi.mocked(getLLMProvider).mockImplementationOnce(() => ({
      generateAdventureScaffold: vi.fn().mockRejectedValueOnce(new Error('LLM Error')),
      expandMovement: vi.fn(),
      expandScene: vi.fn(), // NEW: Six-component scene expansion
      refineContent: vi.fn(),
      regenerateMovement: vi.fn(),
    }))

    mockCreditManager.refundCredit.mockResolvedValueOnce({
      success: true,
      newBalance: 5,
    })

    const result = await generateAdventure({
      length: 'oneshot',
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      partySize: 4,
      partyLevel: 2,
      difficulty: 'standard',
      stakes: 'personal',
    })

    expect(result.success).toBe(false)
    expect(mockCreditManager.refundCredit).toHaveBeenCalledWith(
      'user-123',
      'adventure',
      expect.objectContaining({
        reason: 'Generation failed',
        error: 'LLM Error',
      }),
    )
  })

  it('should handle guest users without authentication', async () => {
    // Mock no authenticated user
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerSupabaseClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>)

    const result = await generateAdventure({
      length: 'oneshot',
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      partySize: 4,
      partyLevel: 2,
      difficulty: 'standard',
      stakes: 'personal',
    })

    expect(result.success).toBe(false)
    if (!result.success && 'error' in result) {
      expect(result.error).toBe('Authentication required')
    }
    expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
  })
})
