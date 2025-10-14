import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { headers } from 'next/headers'
import {
  withRateLimit,
  getRateLimitContext,
  checkRateLimit,
  getRemainingRateLimit,
} from '@/lib/rate-limiting/middleware'
import { RateLimitError, resetRateLimiter } from '@/lib/rate-limiting/rate-limiter'

vi.mock('next/headers')

describe('Rate Limiting Middleware', () => {
  const mockHeaders = vi.mocked(headers)

  beforeEach(() => {
    vi.useFakeTimers()
    resetRateLimiter() // Reset singleton between tests
    mockHeaders.mockReturnValue({
      get: vi.fn((name: string) => {
        switch (name) {
          case 'x-forwarded-for':
            return '192.168.1.1, 10.0.0.1'
          case 'x-real-ip':
            return '192.168.1.1'
          case 'cf-connecting-ip':
            return '192.168.1.1'
          default:
            return null
        }
      }),
    } as unknown as ReturnType<typeof headers>)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getRateLimitContext', () => {
    it('should extract IP address from x-forwarded-for header', async () => {
      const context = await getRateLimitContext()

      expect(context.ipAddress).toBe('192.168.1.1')
      expect(context.isAuthenticated).toBe(false)
      expect(context.userId).toBeUndefined()
    })

    it('should use fallback IP when no headers present', async () => {
      mockHeaders.mockReturnValue({
        get: vi.fn(() => null),
      } as unknown as ReturnType<typeof headers>)

      const context = await getRateLimitContext()

      expect(context.ipAddress).toBe('127.0.0.1')
    })

    it('should set authenticated context when user ID provided', async () => {
      const context = await getRateLimitContext('user-123')

      expect(context.userId).toBe('user-123')
      expect(context.isAuthenticated).toBe(true)
      expect(context.ipAddress).toBe('192.168.1.1')
    })
  })

  describe('withRateLimit', () => {
    it('should execute function when within rate limits', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const context = {
        userId: 'user-123',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      const result = await withRateLimit('adventure_generation', context, mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledOnce()
    })

    it('should throw RateLimitError when limit exceeded', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const context = {
        userId: 'user-123',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      // Exhaust the rate limit
      const promises = []
      for (let i = 0; i < 11; i++) {
        // Authenticated limit is 10/hour
        promises.push(withRateLimit('adventure_generation', context, mockFn))
      }

      await expect(Promise.all(promises)).rejects.toThrow(RateLimitError)
    })

    it('should use IP address for unauthenticated users', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const context = {
        isAuthenticated: false,
        ipAddress: '192.168.1.1',
      }

      const result = await withRateLimit('adventure_generation', context, mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledOnce()
    })

    it('should apply different limits for different operations', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const context = {
        userId: 'user-123',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      // Movement expansion has higher limits than adventure generation
      const promises = []
      for (let i = 0; i < 15; i++) {
        promises.push(withRateLimit('movement_expansion', context, mockFn))
      }

      // Should not throw for movement expansion (limit is 50/hour)
      await expect(Promise.all(promises)).resolves.not.toThrow()
    })

    it('should apply stricter limits for guest users', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const guestContext = {
        isAuthenticated: false,
        ipAddress: '192.168.1.1',
      }

      // Guest limit is 10 per hour for adventure_generation (same as authenticated during development)
      // Use up the guest limit
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(withRateLimit('adventure_generation', guestContext, mockFn))
      }
      await Promise.all(promises)

      // 11th request should be blocked
      await expect(withRateLimit('adventure_generation', guestContext, mockFn)).rejects.toThrow(
        RateLimitError,
      )
    })
  })

  describe('checkRateLimit', () => {
    it('should return rate limit status without enforcing', async () => {
      const context = {
        userId: 'user-123',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      const result = await checkRateLimit('adventure_generation', context)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9) // 10 - 1 = 9
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should work with custom rate limit options', async () => {
      const context = {
        userId: 'user-123',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      const customOptions = {
        maxRequests: 5,
        windowMs: 60000,
      }

      const result = await checkRateLimit('adventure_generation', context, customOptions)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1 = 4
    })
  })

  describe('getRemainingRateLimit', () => {
    it('should return remaining requests and reset time', async () => {
      const context = {
        userId: 'user-456',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      const result = await getRemainingRateLimit('adventure_generation', context)

      expect(result.remaining).toBe(10) // No requests made yet
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should return updated remaining count after requests', async () => {
      const context = {
        userId: 'user-789',
        isAuthenticated: true,
        ipAddress: '192.168.1.1',
      }

      // Make some requests
      await checkRateLimit('adventure_generation', context)
      await checkRateLimit('adventure_generation', context)

      const result = await getRemainingRateLimit('adventure_generation', context)

      expect(result.remaining).toBe(8) // 10 - 2 = 8
    })
  })
})
