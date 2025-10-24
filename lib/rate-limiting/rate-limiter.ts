export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime: number,
    public retryAfter: number,
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

export class RateLimiter {
  private storage = new Map<string, RateLimitEntry>()

  private getKey(identifier: string, operation: string): string {
    return `${identifier}:${operation}`
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetTime <= now) {
        this.storage.delete(key)
      }
    }
  }

  async checkLimit(
    identifier: string,
    operation: string,
    options: RateLimitOptions,
  ): Promise<RateLimitResult> {
    this.cleanupExpired()

    const key = this.getKey(identifier, operation)
    const now = Date.now()
    const resetTime = now + options.windowMs

    let entry = this.storage.get(key)

    if (!entry || entry.resetTime <= now) {
      // Create new window
      entry = {
        count: 1,
        resetTime,
      }
      this.storage.set(key, entry)

      return {
        allowed: true,
        remaining: options.maxRequests - 1,
        resetTime,
      }
    }

    if (entry.count >= options.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      }
    }

    // Increment counter
    entry.count++

    return {
      allowed: true,
      remaining: options.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  async enforceLimit(
    identifier: string,
    operation: string,
    options: RateLimitOptions,
  ): Promise<void> {
    const result = await this.checkLimit(identifier, operation, options)

    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded for ${operation}. Try again in ${result.retryAfter} seconds.`,
        result.resetTime,
        result.retryAfter!,
      )
    }
  }

  async getRemainingCredits(
    identifier: string,
    operation: string,
    options: RateLimitOptions,
  ): Promise<{ remaining: number; resetTime: number }> {
    this.cleanupExpired()

    const key = this.getKey(identifier, operation)
    const entry = this.storage.get(key)
    const now = Date.now()

    if (!entry || entry.resetTime <= now) {
      return {
        remaining: options.maxRequests,
        resetTime: now + options.windowMs,
      }
    }

    return {
      remaining: Math.max(0, options.maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }
}

// Default rate limits for different operations
export const RATE_LIMITS = {
  adventure_generation: {
    authenticated: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    guest: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour (increased for development)
  },
  movement_expansion: {
    authenticated: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
    guest: { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
  },
  movement_regeneration: {
    authenticated: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour
    guest: { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
  },
  content_refinement: {
    authenticated: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    guest: { maxRequests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 per day
  },
  export: {
    authenticated: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
    guest: { maxRequests: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 per day
  },
} as const

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}

// For testing: reset the singleton
export function resetRateLimiter(): void {
  rateLimiterInstance = null
}

// Helper function to get rate limit for user type
export function getRateLimit(
  operation: keyof typeof RATE_LIMITS,
  isAuthenticated: boolean,
): RateLimitOptions {
  const limits = RATE_LIMITS[operation]
  return isAuthenticated ? limits.authenticated : limits.guest
}
