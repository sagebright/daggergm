import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { POST } from '@/app/api/webhooks/stripe/route'
import { createClient } from '@/lib/supabase/server'
import type { createClient as CreateClientType } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Vitest 4: Constructor mocks must use class or function keyword
const mockCreditManagerInstance = {
  addCredits: vi.fn(),
}

vi.mock('@/lib/credits/credit-manager', () => ({
  CreditManager: class MockCreditManager {
    addCredits = mockCreditManagerInstance.addCredits
  },
}))

// Mock Stripe globally
const mockStripeWebhooks = {
  constructEvent: vi.fn(),
}

// Vitest 4: Constructor mocks must use class or function keyword
vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      webhooks = mockStripeWebhooks
    },
  }
})

describe('Stripe Webhook Handler', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(
      Promise.resolve(mockSupabase as unknown as Awaited<ReturnType<typeof CreateClientType>>),
    )

    // Mock environment variables
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
  })

  describe('POST /api/webhooks/stripe', () => {
    it('should verify webhook signature', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            payment_status: 'paid',
            metadata: {
              userId: 'user-123',
              creditAmount: '10',
            },
            customer_email: 'test@example.com',
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(mockStripeWebhooks.constructEvent).toHaveBeenCalledWith(
        JSON.stringify(mockEvent),
        'test-signature',
        'whsec_test_secret',
      )
      expect(response.status).toBe(200)
    })

    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            payment_status: 'paid',
            metadata: {
              userId: 'user-123',
              creditAmount: '10',
            },
            customer_email: 'test@example.com',
            amount_total: 1000, // $10.00 in cents
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)
      mockCreditManagerInstance.addCredits.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockCreditManagerInstance.addCredits).toHaveBeenCalledWith(
        'user-123',
        10,
        'stripe_purchase',
      )
      expect(response.status).toBe(200)
      expect(data).toEqual({ received: true })
    })

    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent = {
        id: 'evt_124',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: {
              userId: 'user-456',
              creditAmount: '50',
            },
            amount: 5000, // $50.00 in cents
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)
      mockCreditManagerInstance.addCredits.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(mockCreditManagerInstance.addCredits).toHaveBeenCalledWith(
        'user-456',
        50,
        'stripe_purchase',
      )
      expect(response.status).toBe(200)
    })

    it('should reject invalid signatures', async () => {
      mockStripeWebhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid-signature',
        },
        body: '{}',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Webhook signature verification failed')
    })

    it('should ignore unpaid checkout sessions', async () => {
      const mockEvent = {
        id: 'evt_125',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_125',
            payment_status: 'unpaid',
            metadata: {
              userId: 'user-789',
              creditAmount: '10',
            },
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(mockCreditManagerInstance.addCredits).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should handle missing metadata gracefully', async () => {
      const mockEvent = {
        id: 'evt_126',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_126',
            payment_status: 'paid',
            // No metadata
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockCreditManagerInstance.addCredits).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required metadata')
    })

    it('should handle credit addition failures', async () => {
      const mockEvent = {
        id: 'evt_127',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_127',
            payment_status: 'paid',
            metadata: {
              userId: 'user-999',
              creditAmount: '10',
            },
            amount_total: 1000,
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)
      mockCreditManagerInstance.addCredits.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to process webhook')
    })

    it('should log webhook events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockEvent = {
        id: 'evt_128',
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_123',
          },
        },
      }

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(mockEvent),
      })

      await POST(request)

      consoleSpy.mockRestore()
    })
  })
})
