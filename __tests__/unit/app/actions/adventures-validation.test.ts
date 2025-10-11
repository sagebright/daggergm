import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAdventure } from '@/app/actions/adventures'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { CreditManager } from '@/lib/credits/credit-manager'
import { getLLMProvider } from '@/lib/llm/provider'

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
vi.mock('@/lib/credits/credit-manager')
vi.mock('@/lib/llm/provider')

describe('Adventure Actions - Validation', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  const mockCreditManager = {
    consumeCredit: vi.fn(),
    refundCredit: vi.fn(),
  }

  const mockLLMProvider = {
    generateAdventureScaffold: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as Awaited<ReturnType<typeof createServerSupabaseClient>>,
    )
    vi.mocked(createServiceRoleClient).mockResolvedValue(
      mockSupabaseClient as Awaited<ReturnType<typeof createServiceRoleClient>>,
    )
    vi.mocked(CreditManager).mockImplementation(
      () => mockCreditManager as InstanceType<typeof CreditManager>,
    )
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider as ReturnType<typeof getLLMProvider>)
  })

  describe('generateAdventure', () => {
    it('should reject invalid adventure length', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const config = {
        length: 'invalid-length', // Should be oneshot, short_campaign, or campaign
        primary_motif: 'high_fantasy',
        party_size: 4,
        party_level: 3,
        difficulty: 'standard',
        stakes: 'personal',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid option')
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should reject empty primary motif', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const config = {
        length: 'oneshot',
        primary_motif: '', // Empty string
        party_size: 4,
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid input')
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should reject invalid party size', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        party_size: 10, // Max is 8
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Party size must be 8 or less')
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should reject invalid difficulty', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        difficulty: 'impossible', // Should be easier, standard, or harder
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid option')
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should reject invalid stakes', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        stakes: 'cosmic', // Should be low, personal, high, or world
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid option')
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should reject invalid guest email format', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }, // Guest user
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        guestEmail: 'not-an-email',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email address')
      expect(mockCreditManager.consumeCredit).not.toHaveBeenCalled()
    })

    it('should validate and transform config before processing', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockCreditManager.consumeCredit.mockResolvedValue({ success: true })
      mockLLMProvider.generateAdventureScaffold.mockResolvedValue({
        title: 'Test Adventure',
        movements: [],
      })

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'test-uuid', title: 'Test Adventure' },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        party_size: 4, // Number
        difficulty: 'standard',
        stakes: 'personal',
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(true)
      expect(mockLLMProvider.generateAdventureScaffold).toHaveBeenCalledWith(
        expect.objectContaining({
          partySize: 4, // Should be converted to number
          difficulty: 'standard',
          stakes: 'personal',
        }),
      )
    })

    it('should apply default values when optional fields are missing', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockCreditManager.consumeCredit.mockResolvedValue({ success: true })
      mockLLMProvider.generateAdventureScaffold.mockResolvedValue({
        title: 'Test Adventure',
        movements: [],
      })

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'test-uuid', title: 'Test Adventure' },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      })

      const config = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        // Missing optional fields - should get defaults
      }

      const result = await generateAdventure(config)

      expect(result.success).toBe(true)
      expect(mockLLMProvider.generateAdventureScaffold).toHaveBeenCalledWith(
        expect.objectContaining({
          partySize: 4, // Default
          partyLevel: 1, // Default
          difficulty: 'standard', // Default
          stakes: 'personal', // Default
        }),
      )
    })
  })
})
