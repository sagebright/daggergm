import type { SupabaseClient } from '@supabase/supabase-js'

import { InsufficientCreditsError, CreditConsumptionError } from './errors'

import { createServerSupabaseClient } from '@/lib/supabase/server'

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
      .eq('id', userId)
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
   * Uses simple balance approach - decrements credits column directly
   */
  async consumeCredit(
    userId: string,
    creditType: CreditType,
    _metadata?: Record<string, unknown>,
  ): Promise<CreditConsumptionResult> {
    const client = await this.supabase
    const cost = CREDIT_COSTS[creditType]

    // Check balance first
    const currentBalance = await this.getUserCredits(userId)
    if (currentBalance < cost) {
      throw new InsufficientCreditsError()
    }

    // Atomically decrement credits
    const { data, error } = await client
      .from('daggerheart_user_profiles')
      .update({ credits: currentBalance - cost })
      .eq('id', userId)
      .select('credits')
      .single()

    if (error) {
      throw new CreditConsumptionError(`Failed to consume credit: ${error.message}`)
    }

    return {
      success: true,
      remainingCredits: data?.credits || 0,
    }
  }

  /**
   * Add credits to user account
   */
  async addCredits(
    userId: string,
    amount: number,
    source: string = 'manual',
  ): Promise<CreditAddResult> {
    if (amount <= 0) {
      throw new Error('Invalid credit amount')
    }

    const client = await this.supabase

    const { error } = await client.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_source: source,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Get updated balance
    const newBalance = await this.getUserCredits(userId)

    return {
      success: true,
      newBalance,
    }
  }

  /**
   * Refund credits for failed operations
   * Uses simple balance approach - increments credits column directly
   */
  async refundCredit(
    userId: string,
    creditType: CreditType,
    _metadata?: Record<string, unknown>,
  ): Promise<CreditRefundResult> {
    const client = await this.supabase
    const refundAmount = CREDIT_COSTS[creditType]

    // Get current balance
    const currentBalance = await this.getUserCredits(userId)

    // Atomically increment credits
    const { data, error } = await client
      .from('daggerheart_user_profiles')
      .update({ credits: currentBalance + refundAmount })
      .eq('id', userId)
      .select('credits')
      .single()

    if (error) {
      throw new Error(`Failed to refund credit: ${error.message}`)
    }

    return {
      success: true,
      newBalance: data?.credits || 0,
    }
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
