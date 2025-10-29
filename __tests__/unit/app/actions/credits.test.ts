import { describe, it, expect, vi, beforeEach } from 'vitest'

import { purchaseCredits, getUserCredits } from '@/app/actions/credits'
import { stripe } from '@/lib/stripe/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CreditPurchase } from '@/lib/validation/schemas'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

describe('credits actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabaseClient),
    select: vi.fn(() => mockSupabaseClient),
    eq: vi.fn(() => mockSupabaseClient),
    single: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
    )
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('purchaseCredits', () => {
    it('should successfully create a checkout session for valid package', async () => {
      const mockSession = {
        id: 'session-123',
        url: 'https://checkout.stripe.com/session-123',
      }

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>,
      )

      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: true,
        sessionId: 'session-123',
        url: 'https://checkout.stripe.com/session-123',
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '5 Credits',
                description: '5 adventure generation credits for DaggerGM',
              },
              unit_amount: 500,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: expect.stringContaining('/dashboard?session_id={CHECKOUT_SESSION_ID}'),
        cancel_url: expect.stringContaining('/dashboard?canceled=true'),
        customer_email: 'test@example.com',
        client_reference_id: 'user-123',
        metadata: {
          userId: 'user-123',
          packageId: 'credits_5',
          creditAmount: 5,
        },
      })
    })

    it('should create checkout session for 15 credits package', async () => {
      const mockSession = {
        id: 'session-456',
        url: 'https://checkout.stripe.com/session-456',
      }

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>,
      )

      const input: CreditPurchase = {
        packageId: 'credits_15',
        amount: 15,
        price: 1200,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: true,
        sessionId: 'session-456',
        url: 'https://checkout.stripe.com/session-456',
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: '15 Credits',
                  description: '15 adventure generation credits for DaggerGM',
                },
                unit_amount: 1200,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: 'user-123',
            packageId: 'credits_15',
            creditAmount: 15,
          },
        }),
      )
    })

    it('should create checkout session for 30 credits package', async () => {
      const mockSession = {
        id: 'session-789',
        url: 'https://checkout.stripe.com/session-789',
      }

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>,
      )

      const input: CreditPurchase = {
        packageId: 'credits_30',
        amount: 30,
        price: 2100,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: true,
        sessionId: 'session-789',
        url: 'https://checkout.stripe.com/session-789',
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: '30 Credits',
                  description: '30 adventure generation credits for DaggerGM',
                },
                unit_amount: 2100,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: 'user-123',
            packageId: 'credits_30',
            creditAmount: 30,
          },
        }),
      )
    })

    it('should fail when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
      })

      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('should fail when package configuration is invalid', async () => {
      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 10, // Wrong amount for credits_5
        price: 500,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: false,
        error: 'Invalid package configuration',
      })

      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('should fail when price does not match package', async () => {
      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 1000, // Wrong price for credits_5
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: false,
        error: 'Invalid package configuration',
      })

      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('should fail when packageId is invalid', async () => {
      const input = {
        packageId: 'invalid_package' as unknown,
        amount: 5,
        price: 500,
      } as CreditPurchase

      const result = await purchaseCredits(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid option')
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('should handle validation errors from schema', async () => {
      const input = {
        packageId: 'credits_5',
        amount: -5, // Invalid negative amount
        price: 500,
      } as unknown as CreditPurchase

      const result = await purchaseCredits(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle Stripe API errors', async () => {
      vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(new Error('Stripe API error'))

      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: false,
        error: 'Stripe API error',
      })
    })

    it('should handle unknown errors during checkout', async () => {
      vi.mocked(stripe.checkout.sessions.create).mockRejectedValue('Unknown error')

      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      }

      const result = await purchaseCredits(input)

      expect(result).toEqual({
        success: false,
        error: 'Failed to create checkout session',
      })
    })

    it('should use NEXT_PUBLIC_SITE_URL in redirect URLs', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SITE_URL
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

      const mockSession = {
        id: 'session-url-test',
        url: 'https://checkout.stripe.com/session-url-test',
      }

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>,
      )

      const input: CreditPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      }

      await purchaseCredits(input)

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/dashboard?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://example.com/dashboard?canceled=true',
        }),
      )

      // Restore original value
      if (originalUrl) {
        process.env.NEXT_PUBLIC_SITE_URL = originalUrl
      }
    })
  })

  describe('getUserCredits', () => {
    it('should successfully get user credits', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          credits: 10,
        },
        error: null,
      })

      const result = await getUserCredits()

      expect(result).toEqual({
        success: true,
        adventureCredits: 10,
        expansionCredits: 0,
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daggerheart_user_profiles')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('credits')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('should fail when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getUserCredits()

      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
      })

      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return zero credits when user has no credit record (PGRST116)', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await getUserCredits()

      expect(result).toEqual({
        success: true,
        adventureCredits: 0,
        expansionCredits: 0,
      })
    })

    it('should handle null credit values', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          adventure_credits: null,
          expansion_credits: null,
        },
        error: null,
      })

      const result = await getUserCredits()

      expect(result).toEqual({
        success: true,
        adventureCredits: 0,
        expansionCredits: 0,
      })
    })

    it('should handle database errors other than PGRST116', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      })

      const result = await getUserCredits()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle unknown errors', async () => {
      mockSupabaseClient.single.mockRejectedValue('Unknown error')

      const result = await getUserCredits()

      expect(result).toEqual({
        success: false,
        error: 'Failed to get user credits',
      })
    })

    it('should handle Error instances', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('Network error'))

      const result = await getUserCredits()

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })
  })
})
