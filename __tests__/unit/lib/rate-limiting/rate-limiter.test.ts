import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { RateLimiter, RateLimitError } from '@/lib/rate-limiting/rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new RateLimiter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.checkLimit('user-123', 'adventure_generation', {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should track multiple requests', async () => {
      const options = {
        maxRequests: 3,
        windowMs: 60000,
      }

      // First request
      let result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)

      // Second request
      result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)

      // Third request
      result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should block requests when limit exceeded', async () => {
      const options = {
        maxRequests: 2,
        windowMs: 60000,
      }

      // Use up the limit
      await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      await rateLimiter.checkLimit('user-123', 'adventure_generation', options)

      // This should be blocked
      const result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const options = {
        maxRequests: 1,
        windowMs: 60000, // 1 minute
      }

      // Use up the limit
      await rateLimiter.checkLimit('user-123', 'adventure_generation', options)

      // Should be blocked
      let result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should handle different users separately', async () => {
      const options = {
        maxRequests: 1,
        windowMs: 60000,
      }

      // User 1 uses up their limit
      await rateLimiter.checkLimit('user-1', 'adventure_generation', options)
      let result = await rateLimiter.checkLimit('user-1', 'adventure_generation', options)
      expect(result.allowed).toBe(false)

      // User 2 should still be allowed
      result = await rateLimiter.checkLimit('user-2', 'adventure_generation', options)
      expect(result.allowed).toBe(true)
    })

    it('should handle different operation types separately', async () => {
      const options = {
        maxRequests: 1,
        windowMs: 60000,
      }

      // Use up limit for adventure generation
      await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      let result = await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      expect(result.allowed).toBe(false)

      // Movement expansion should still be allowed
      result = await rateLimiter.checkLimit('user-123', 'movement_expansion', options)
      expect(result.allowed).toBe(true)
    })

    it('should handle guest users with IP-based limiting', async () => {
      const options = {
        maxRequests: 2,
        windowMs: 60000,
      }

      // Guest requests using IP
      await rateLimiter.checkLimit('192.168.1.1', 'adventure_generation', options)
      let result = await rateLimiter.checkLimit('192.168.1.1', 'adventure_generation', options)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)

      // Next request should be blocked
      result = await rateLimiter.checkLimit('192.168.1.1', 'adventure_generation', options)
      expect(result.allowed).toBe(false)
    })
  })

  describe('enforceLimit', () => {
    it('should throw RateLimitError when limit exceeded', async () => {
      const options = {
        maxRequests: 1,
        windowMs: 60000,
      }

      // Use up the limit
      await rateLimiter.enforceLimit('user-123', 'adventure_generation', options)

      // This should throw
      await expect(
        rateLimiter.enforceLimit('user-123', 'adventure_generation', options),
      ).rejects.toThrow(RateLimitError)
    })

    it('should include rate limit info in error', async () => {
      const options = {
        maxRequests: 1,
        windowMs: 60000,
      }

      // Use up the limit
      await rateLimiter.enforceLimit('user-123', 'adventure_generation', options)

      // This should throw with details
      try {
        await rateLimiter.enforceLimit('user-123', 'adventure_generation', options)
        expect.fail('Should have thrown RateLimitError')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        expect((error as RateLimitError).resetTime).toBeGreaterThan(Date.now())
        expect((error as RateLimitError).retryAfter).toBeGreaterThan(0)
      }
    })

    it('should not throw when within limits', async () => {
      const options = {
        maxRequests: 5,
        windowMs: 60000,
      }

      await expect(
        rateLimiter.enforceLimit('user-123', 'adventure_generation', options),
      ).resolves.not.toThrow()
    })
  })

  describe('getRemainingCredits', () => {
    it('should return current limit status', async () => {
      const options = {
        maxRequests: 3,
        windowMs: 60000,
      }

      // Make some requests
      await rateLimiter.checkLimit('user-123', 'adventure_generation', options)
      await rateLimiter.checkLimit('user-123', 'adventure_generation', options)

      const status = await rateLimiter.getRemainingCredits(
        'user-123',
        'adventure_generation',
        options,
      )
      expect(status.remaining).toBe(1)
      expect(status.resetTime).toBeGreaterThan(Date.now())
    })

    it('should return full limit for new user', async () => {
      const options = {
        maxRequests: 5,
        windowMs: 60000,
      }

      const status = await rateLimiter.getRemainingCredits(
        'new-user',
        'adventure_generation',
        options,
      )
      expect(status.remaining).toBe(5)
    })
  })
})

describe('RateLimitError', () => {
  it('should include all required properties', () => {
    const resetTime = Date.now() + 60000
    const error = new RateLimitError('Rate limit exceeded', resetTime, 60)

    expect(error.message).toBe('Rate limit exceeded')
    expect(error.resetTime).toBe(resetTime)
    expect(error.retryAfter).toBe(60)
    expect(error.name).toBe('RateLimitError')
  })
})
