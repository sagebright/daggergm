import { describe, it, expect, vi, beforeEach } from 'vitest'

import { generateAdventure } from '@/app/actions/adventures'
import { CreditManager } from '@/lib/credits/credit-manager'

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
          data: { user: null }, // No authenticated user
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
}))

vi.mock('@/lib/llm/provider', () => ({
  getLLMProvider: vi.fn(() => ({
    generateAdventureScaffold: vi.fn().mockResolvedValue({
      title: 'Test Adventure',
      description: 'A test adventure',
      estimatedDuration: '3-4 hours',
      movements: [],
    }),
    expandMovement: vi.fn(),
    expandScene: vi.fn(),
    refineContent: vi.fn(),
  })),
}))

describe('Guest Restrictions', () => {
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

  it('should reject unauthenticated adventure generation', async () => {
    const config = {
      length: 'oneshot' as const,
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      party_size: 4,
      party_level: 2,
      difficulty: 'standard' as const,
      stakes: 'personal' as const,
    }

    // Call without authentication (mocked to return null user)
    const result = await generateAdventure(config)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Authentication required')
    // Should not consume credits for unauthenticated requests
    expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
  })

  it('should not accept guestEmail parameter', async () => {
    const config: Parameters<typeof generateAdventure>[0] & { guestEmail?: string } = {
      length: 'oneshot' as const,
      primary_motif: 'mystery',
      frame: 'witherwild',
      focus: 'mystery',
      party_size: 4,
      party_level: 2,
      difficulty: 'standard' as const,
      stakes: 'personal' as const,
      guestEmail: 'guest@example.com', // Should be ignored by validation schema
    }

    const result = await generateAdventure(config)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Authentication required')
    // Should not consume credits for guest requests
    expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
  })
})
