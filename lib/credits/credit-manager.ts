import type { SupabaseClient } from '@supabase/supabase-js'

import { createServerSupabaseClient } from '@/lib/supabase/server'

import { InsufficientCreditsError, CreditConsumptionError } from './errors'

export type CreditType = 'adventure' | 'expansion' | 'export'

export interface CreditConsumptionResult {
  success: boolean
  remainingCredits: number
}

export interface CreditAddResult {
  success: boolean
  newBalance: number
}

export interface CreditRefundResult {
  success: boolean
  newBalance: number
}

export interface CreditTransaction {
  id: string
  type: string
  credit_type: string | null
  amount: number
  balance_after: number
  created_at: string
}

const CREDIT_COSTS: Record<CreditType, number> = {
  adventure: 1,
  expansion: 1,
  export: 0,
}

export class CreditManager {
  private supabase: Promise<SupabaseClient>

  constructor() {
    this.supabase = createServerSupabaseClient()
  }

  /**
   * Get user's current credit balance
   */
  async getUserCredits(userId: string): Promise<number> {
    const client = await this.supabase

    const { data, error } = await client
      .from('daggerheart_user_profiles')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Handle "not found" as 0 credits for new users
      if (error.code === 'PGRST116') {
        return 0
      }
      throw new Error(error.message)
    }

    return data?.credits || 0
  }

  /**
   * Consume credits atomically for a specific operation
   */
  async consumeCredit(
    userId: string,
    creditType: CreditType,
    metadata?: Record<string, unknown>,
  ): Promise<CreditConsumptionResult> {
    const client = await this.supabase

    const { data, error } = await client.rpc('consume_credit', {
      p_user_id: userId,
      p_credit_type: creditType,
      p_metadata: metadata || {},
    })

    if (error) {
      // Check for insufficient credits error
      if (error.code === 'P0001' || error.message?.includes('Insufficient credits')) {
        throw new InsufficientCreditsError()
      }
      // Check for race condition/duplicate key
      if (error.code === '23505') {
        throw new CreditConsumptionError('Credit consumption conflict - please try again')
      }
      throw new Error(error.message)
    }

    return {
      success: true,
      remainingCredits: data?.remaining_credits || 0,
    }
  }

  /**
   * Add credits to user account
   */
  async addCredits(
    userId: string,
    amount: number,
    metadata?: Record<string, unknown>,
  ): Promise<CreditAddResult> {
    if (amount <= 0) {
      throw new Error('Invalid credit amount')
    }

    const client = await this.supabase

    const { data, error } = await client.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_source: metadata?.source || 'manual',
      p_metadata: metadata || {},
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      newBalance: data?.new_balance || 0,
    }
  }

  /**
   * Refund credits for failed operations
   */
  async refundCredit(
    userId: string,
    creditType: CreditType,
    metadata?: Record<string, unknown>,
  ): Promise<CreditRefundResult> {
    const client = await this.supabase

    const { data, error } = await client.rpc('refund_credit', {
      p_user_id: userId,
      p_credit_type: creditType,
      p_metadata: metadata || {},
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      newBalance: data?.new_balance || 0,
    }
  }

  /**
   * Get user's credit transaction history
   */
  async getCreditHistory(userId: string, limit: number = 20): Promise<CreditTransaction[]> {
    const client = await this.supabase

    const { data, error } = await client
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  /**
   * Check if user has sufficient credits for an operation
   */
  async checkCreditSufficiency(userId: string, creditType: CreditType): Promise<boolean> {
    const credits = await this.getUserCredits(userId)
    const cost = CREDIT_COSTS[creditType]
    return credits >= cost
  }
}
