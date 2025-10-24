'use server'

import { stripe } from '@/lib/stripe/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { creditPurchaseSchema, type CreditPurchase } from '@/lib/validation/schemas'

const CREDIT_PACKAGES = {
  credits_5: {
    amount: 5,
    price: 500, // $5.00
    name: '5 Credits',
  },
  credits_15: {
    amount: 15,
    price: 1200, // $12.00
    name: '15 Credits',
  },
  credits_30: {
    amount: 30,
    price: 2100, // $21.00
    name: '30 Credits',
  },
} as const

export async function purchaseCredits(input: CreditPurchase) {
  try {
    // Validate input
    const validated = creditPurchaseSchema.parse(input)

    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify package matches expected values
    const pkg = CREDIT_PACKAGES[validated.packageId]
    if (!pkg || pkg.amount !== validated.amount || pkg.price !== validated.price) {
      return { success: false, error: 'Invalid package configuration' }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: `${pkg.amount} adventure generation credits for DaggerGM`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?canceled=true`,
      ...(user.email && { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packageId: validated.packageId,
        creditAmount: pkg.amount,
      },
    })

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    }
  } catch (error) {
    console.error('Credit purchase error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    }
  }
}

export async function getUserCredits() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (error) {
      // User might not have a credit record yet
      if (error.code === 'PGRST116') {
        return {
          success: true,
          adventureCredits: 0,
          expansionCredits: 0,
        }
      }
      throw error
    }

    return {
      success: true,
      adventureCredits: data?.credits || 0,
      expansionCredits: 0, // Not yet implemented
    }
  } catch (error) {
    console.error('Get credits error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user credits',
    }
  }
}
