import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.generated'

export const ANALYTICS_EVENTS = {
  ADVENTURE_STARTED: 'adventure_started',
  SCAFFOLD_GENERATED: 'scaffold_generated',
  SCAFFOLD_MOVEMENT_REGENERATED: 'scaffold_movement_regenerated',
  MOVEMENT_EXPANDED: 'movement_expanded',
  AI_REFINEMENT_USED: 'ai_refinement_used',
  ADVENTURE_EXPORTED: 'adventure_exported',
  CREDIT_PURCHASED: 'credit_purchased',
  FOCUS_MODE_ENTERED: 'focus_mode_entered',
} as const

export type AnalyticsEvent = keyof typeof ANALYTICS_EVENTS

export interface EventData {
  userId?: string
  sessionId?: string
  adventureId?: string
  movementId?: string
  frame?: string
  partySize?: number
  duration?: number
  tokenCount?: number
  cost?: number
  amount?: number
  price?: number
  paymentMethod?: string
  movementType?: string
  [key: string]: unknown
}

export interface UserProperties {
  email?: string
  plan?: string
  signupDate?: string
  [key: string]: unknown
}

export interface PerformanceData {
  operation: string
  duration: number
  success: boolean
  tokenCount?: number
  cost?: number
  error?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export class Analytics {
  private isEnabled: boolean
  private supabasePromise: Promise<SupabaseClient<Database>> | null = null

  constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  }

  private async getSupabase(): Promise<SupabaseClient<Database>> {
    if (!this.supabasePromise) {
      this.supabasePromise = createClient()
    }
    return this.supabasePromise
  }

  async track(event: string, data: EventData = {}): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    const timestamp = new Date().toISOString()

    // Store in Supabase for server-side analytics
    await this.storeEventInDatabase(event, data, timestamp)
  }

  async identify(_userId: string, _properties?: UserProperties): Promise<void> {
    // Server-side identify is a no-op for now
    // Client-side analytics will handle user identification
  }

  async trackPerformance(data: PerformanceData): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    const timestamp = new Date().toISOString()

    // Store in Supabase for server-side performance analysis
    await this.storePerformanceInDatabase(data, timestamp)
  }

  private transformEventData(data: EventData, timestamp: string): Record<string, unknown> {
    const transformed: Record<string, unknown> = {
      timestamp,
    }

    // Transform camelCase to snake_case for consistency
    const keyMapping: Record<string, string> = {
      userId: 'user_id',
      sessionId: 'session_id',
      adventureId: 'adventure_id',
      movementId: 'movement_id',
      partySize: 'party_size',
      tokenCount: 'token_count',
      paymentMethod: 'payment_method',
      movementType: 'movement_type',
    }

    Object.entries(data).forEach(([key, value]) => {
      const transformedKey = keyMapping[key] || key
      transformed[transformedKey] = value
    })

    return transformed
  }

  private transformUserProperties(properties: UserProperties): Record<string, unknown> {
    const transformed: Record<string, unknown> = {}

    // Transform camelCase to snake_case
    const keyMapping: Record<string, string> = {
      signupDate: 'signup_date',
    }

    Object.entries(properties).forEach(([key, value]) => {
      const transformedKey = keyMapping[key] || key
      transformed[transformedKey] = value
    })

    return transformed
  }

  private transformPerformanceData(
    data: PerformanceData,
    timestamp: string,
  ): Record<string, unknown> {
    return {
      operation: data.operation,
      duration: data.duration,
      success: data.success,
      token_count: data.tokenCount,
      cost: data.cost,
      error: data.error,
      user_id: data.userId,
      timestamp,
    }
  }

  private async storeEventInDatabase(
    _eventName: string,
    _data: EventData,
    _timestamp: string,
  ): Promise<void> {
    try {
      // TODO: Implement analytics_events table in database
      // For now, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        // console.log('[Analytics Event]', eventName, { data, timestamp })
      }
      // const supabase = await this.getSupabase()
      // const { error } = await supabase.from('analytics_events').insert({
      //   event_name: eventName,
      //   user_id: data.userId,
      //   session_id: data.sessionId,
      //   properties: {
      //     adventure_id: data.adventureId,
      //     movement_id: data.movementId,
      //     frame: data.frame,
      //     party_size: data.partySize,
      //     duration: data.duration,
      //     token_count: data.tokenCount,
      //     cost: data.cost,
      //     amount: data.amount,
      //     price: data.price,
      //     payment_method: data.paymentMethod,
      //     movement_type: data.movementType,
      //     ...Object.fromEntries(
      //       Object.entries(data).filter(
      //         ([key]) =>
      //           ![
      //             'userId',
      //             'sessionId',
      //             'adventureId',
      //             'movementId',
      //             'frame',
      //             'partySize',
      //             'duration',
      //             'tokenCount',
      //             'cost',
      //             'amount',
      //             'price',
      //             'paymentMethod',
      //             'movementType',
      //           ].includes(key),
      //       ),
      //     ),
      //   },
      //   timestamp,
      // })
      //
      // if (error) {
      //   console.error('Failed to store analytics event:', error)
      // }
    } catch (error) {
      console.error('Failed to store analytics event:', error)
    }
  }

  private async storePerformanceInDatabase(
    _data: PerformanceData,
    _timestamp: string,
  ): Promise<void> {
    try {
      // TODO: Implement performance_metrics table in database
      // For now, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        // console.log('[Performance Metric]', { data, timestamp })
      }
      // const supabase = await this.getSupabase()
      // const { error } = await supabase.from('performance_metrics').insert({
      //   operation: data.operation,
      //   duration: data.duration,
      //   success: data.success,
      //   token_count: data.tokenCount,
      //   cost: data.cost,
      //   metadata: data.metadata || {},
      //   timestamp,
      // })
      //
      // if (error) {
      //   console.error('Failed to store performance metric:', error)
      // }
    } catch (error) {
      console.error('Failed to store performance metric:', error)
    }
  }
}

// Export singleton instance
export const analytics = new Analytics()
