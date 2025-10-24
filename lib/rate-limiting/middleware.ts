import { headers } from 'next/headers'

import { getRateLimiter, getRateLimit, RateLimitError, type RateLimitOptions } from './rate-limiter'

export interface RateLimitContext {
  userId?: string
  isAuthenticated: boolean
  ipAddress: string
}

/**
 * Rate limiting middleware for server actions
 */
export async function withRateLimit<R>(
  operation: 'adventure_generation' | 'movement_expansion' | 'content_refinement' | 'export',
  context: RateLimitContext,
  fn: () => Promise<R>,
): Promise<R> {
  const rateLimiter = getRateLimiter()

  // Determine identifier (user ID or IP address)
  const identifier = context.isAuthenticated && context.userId ? context.userId : context.ipAddress

  // Get appropriate rate limit
  const rateLimit = getRateLimit(operation, context.isAuthenticated)

  // Check and enforce rate limit
  await rateLimiter.enforceLimit(identifier, operation, rateLimit)

  // Execute the original function
  return fn()
}

/**
 * Helper to get rate limit context from request headers
 */
export async function getRateLimitContext(userId?: string): Promise<RateLimitContext> {
  // Check if we're in a test environment or if headers are unavailable
  let ipAddress = '127.0.0.1'

  try {
    const headersList = await headers()

    // Get IP address from headers (considering proxy headers)
    const forwarded = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const cfConnectingIp = headersList.get('cf-connecting-ip')

    ipAddress = forwarded?.split(',')[0] || realIp || cfConnectingIp || '127.0.0.1'
    ipAddress = ipAddress.trim()
  } catch {
    // Headers not available (likely in test environment)
    // Use default IP address
    ipAddress = '127.0.0.1'
  }

  return {
    ...(userId && { userId }),
    isAuthenticated: !!userId,
    ipAddress,
  }
}

/**
 * Rate limiting decorator for server actions
 */
export function rateLimit(operation: Parameters<typeof withRateLimit>[0]) {
  return function decorator<R>(
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]): Promise<R> {
      try {
        // Try to get user context from the action's arguments or global state
        const context = await getRateLimitContext()

        return await withRateLimit(operation, context, () => originalMethod.apply(this, args))
      } catch (error) {
        if (error instanceof RateLimitError) {
          // Return a consistent error format for rate limiting
          return {
            success: false,
            error: error.message,
            retryAfter: error.retryAfter,
          } as R
        }
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Check rate limit without enforcing (useful for showing limits to users)
 */
export async function checkRateLimit(
  operation: Parameters<typeof getRateLimit>[0],
  context: RateLimitContext,
  customOptions?: RateLimitOptions,
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}> {
  const rateLimiter = getRateLimiter()
  const identifier = context.isAuthenticated && context.userId ? context.userId : context.ipAddress
  const rateLimit = customOptions || getRateLimit(operation, context.isAuthenticated)

  return rateLimiter.checkLimit(identifier, operation, rateLimit)
}

/**
 * Get remaining rate limit for display purposes
 */
export async function getRemainingRateLimit(
  operation: Parameters<typeof getRateLimit>[0],
  context: RateLimitContext,
): Promise<{ remaining: number; resetTime: number }> {
  const rateLimiter = getRateLimiter()
  const identifier = context.isAuthenticated && context.userId ? context.userId : context.ipAddress
  const rateLimit = getRateLimit(operation, context.isAuthenticated)

  return rateLimiter.getRemainingCredits(identifier, operation, rateLimit)
}
