import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies FIRST before importing the module under test
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/llm/openai-provider', () => ({
  OpenAIProvider: class MockOpenAIProvider {
    expandMovement = vi.fn()
    refineContent = vi.fn()
  },
}))

vi.mock('@/lib/credits/credit-manager', () => ({
  CreditManager: class MockCreditManager {
    consumeCredit = vi.fn()
    refundCredit = vi.fn()
  },
}))

vi.mock('@/lib/analytics/analytics', () => ({
  analytics: { track: vi.fn() },
  ANALYTICS_EVENTS: {
    MOVEMENT_EXPANDED: 'movement.expanded',
    AI_REFINEMENT_USED: 'ai.refinement_used',
  },
}))

vi.mock('@/lib/rate-limiting/middleware', () => ({
  withRateLimit: vi.fn(async (_op: unknown, _ctx: unknown, cb: () => unknown) => cb()),
  getRateLimitContext: vi.fn().mockResolvedValue({
    userId: 'test-user-id',
    isAuthenticated: true,
    tier: 'free',
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

vi.mock('@/lib/regeneration/limit-checker', () => ({
  RegenerationLimitChecker: class MockRegenerationLimitChecker {
    checkAndIncrementExpansion = vi.fn().mockResolvedValue({ allowed: true })
    checkAndIncrementScaffold = vi.fn().mockResolvedValue({ allowed: true })
  },
}))

vi.mock('@/lib/constants/regeneration', () => ({
  REGENERATION_LIMITS: { SCAFFOLD: 10, EXPANSION: 20 },
  REGENERATION_LIMIT_ERRORS: {
    SCAFFOLD: 'Scaffold limit reached',
    EXPANSION: 'Expansion limit reached',
  },
}))

vi.mock('@/lib/validation/movement', () => ({
  movementUpdateSchema: {
    safeParse: (data: { title?: string }) => {
      if (data.title && data.title.length > 200) {
        return {
          success: false,
          error: { issues: [{ message: 'Title too long' }] },
        }
      }
      return { success: true, data }
    },
  },
}))

vi.mock('@/lib/validation/schemas', () => ({
  movementExpansionRequestSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  },
  movementRefinementRequestSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  },
}))

// NOW import the module under test
import { updateMovement } from '@/app/actions/movements'
import { createServerSupabaseClient } from '@/lib/supabase/server'

describe('Movement Server Actions', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
    )
  })

  describe('updateMovement', () => {
    it('should validate movement updates', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
      })

      const result = await updateMovement('adv-123', 'mov-1', {
        title: 'A'.repeat(201),
      })

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Validation error'),
      })
    })
  })
})
