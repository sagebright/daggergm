import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import { CreditManager } from '@/lib/credits/credit-manager'

let stripe: Stripe | null = null

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-09-30.clover',
    })
  }
  return stripe
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
      { status: 400 },
    )
  }

  const creditManager = new CreditManager()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only process paid sessions
        if (session.payment_status !== 'paid') {
          return NextResponse.json({ received: true })
        }

        const { userId, creditAmount } = session.metadata || {}

        if (!userId || !creditAmount) {
          console.error('Missing required metadata in checkout session:', session.id)
          return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
        }

        // Add credits to user account
        await creditManager.addCredits(userId, parseInt(creditAmount, 10), 'stripe_purchase')

        // Track credit purchase
        await analytics.track(ANALYTICS_EVENTS.CREDIT_PURCHASED, {
          userId,
          amount: parseInt(creditAmount, 10),
          price: session.amount_total ? session.amount_total / 100 : 0,
          paymentMethod: 'stripe',
          sessionId: session.id,
        })

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const { userId, creditAmount } = paymentIntent.metadata || {}

        if (!userId || !creditAmount) {
          console.error('Missing required metadata in payment intent:', paymentIntent.id)
          return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
        }

        // Add credits to user account
        await creditManager.addCredits(userId, parseInt(creditAmount, 10), 'stripe_purchase')

        break
      }

      default:
        // Unhandled event type - no action needed
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
