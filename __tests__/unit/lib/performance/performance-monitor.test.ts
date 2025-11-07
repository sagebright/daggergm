import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { analytics } from '@/lib/analytics/analytics'
import { PerformanceMonitor, performanceMonitor } from '@/lib/performance/performance-monitor'

vi.mock('@/lib/analytics/analytics', () => ({
  analytics: {
    trackPerformance: vi.fn(),
    track: vi.fn(),
  },
}))

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('operation tracking', () => {
    it('should start and end operations correctly', async () => {
      const operationId = 'test-op-1'
      const operation = 'adventure_generation'
      const metadata = { frame: 'witherwild', partySize: 4 }

      monitor.startOperation(operationId, operation, metadata)

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000)

      await monitor.endOperation(operationId, true, undefined, { tokenCount: 1250 })

      expect(vi.mocked(analytics.trackPerformance)).toHaveBeenCalledWith({
        operation: 'adventure_generation',
        duration: 2.0,
        success: true,
        frame: 'witherwild',
        partySize: 4,
        tokenCount: 1250,
      })
    })

    it('should track failed operations', async () => {
      const operationId = 'test-op-2'
      const operation = 'movement_expansion'
      const error = 'Rate limit exceeded'

      monitor.startOperation(operationId, operation)
      vi.advanceTimersByTime(1500)

      await monitor.endOperation(operationId, false, error)

      expect(vi.mocked(analytics.trackPerformance)).toHaveBeenCalledWith({
        operation: 'movement_expansion',
        duration: 1.5,
        success: false,
        error: 'Rate limit exceeded',
      })
    })

    it('should warn about missing operations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await monitor.endOperation('non-existent-op', true)

      expect(consoleSpy).toHaveBeenCalledWith('No metric found for operation ID: non-existent-op')
      expect(analytics.trackPerformance).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should warn about slow operations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const operationId = 'slow-op'

      monitor.startOperation(operationId, 'adventure_generation')

      // Advance time beyond threshold (15 seconds)
      vi.advanceTimersByTime(20000)

      await monitor.endOperation(operationId, true)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Slow adventure_generation operation: 20s (threshold: 15s)',
        expect.objectContaining({
          operationId: 'slow-op',
          duration: 20,
        }),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('trackOperation wrapper', () => {
    it('should wrap successful operations', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const metadata = { test: 'data' }

      const result = await monitor.trackOperation('test_operation', mockFn, metadata)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledOnce()
      expect(vi.mocked(analytics.trackPerformance)).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test_operation',
          success: true,
          test: 'data',
        }),
      )
    })

    it('should wrap failed operations', async () => {
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)

      await expect(monitor.trackOperation('test_operation', mockFn)).rejects.toThrow('Test error')

      expect(vi.mocked(analytics.trackPerformance)).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test_operation',
          success: false,
          error: 'Test error',
        }),
      )
    })
  })

  describe('utility methods', () => {
    it('should track active metrics count', () => {
      expect(monitor.getActiveMetricsCount()).toBe(0)

      monitor.startOperation('op1', 'test')
      monitor.startOperation('op2', 'test')

      expect(monitor.getActiveMetricsCount()).toBe(2)
    })

    it('should clear all metrics', () => {
      monitor.startOperation('op1', 'test')
      monitor.startOperation('op2', 'test')

      expect(monitor.getActiveMetricsCount()).toBe(2)

      monitor.clearMetrics()

      expect(monitor.getActiveMetricsCount()).toBe(0)
    })
  })

  describe('singleton instance', () => {
    it('should provide a singleton instance', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor)
    })
  })
})
