import { analytics } from '@/lib/analytics/analytics'

export interface PerformanceMetric {
  operation: string
  startTime: number
  endTime?: number
  success?: boolean
  error?: string
  metadata?: Record<string, unknown>
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>()

  /**
   * Start tracking a performance metric
   */
  startOperation(operationId: string, operation: string, metadata?: Record<string, unknown>): void {
    this.metrics.set(operationId, {
      operation,
      startTime: Date.now(),
      ...(metadata && { metadata }),
    })
  }

  /**
   * End tracking a performance metric and report results
   */
  async endOperation(
    operationId: string,
    success: boolean = true,
    error?: string,
    additionalMetadata?: Record<string, unknown>,
  ): Promise<void> {
    const metric = this.metrics.get(operationId)
    if (!metric) {
      console.warn(`No metric found for operation ID: ${operationId}`)
      return
    }

    const endTime = Date.now()
    const duration = (endTime - metric.startTime) / 1000 // Convert to seconds

    // Update metric
    metric.endTime = endTime
    metric.success = success
    if (error) {
      metric.error = error
    }

    // Combine metadata
    const finalMetadata = {
      ...metric.metadata,
      ...additionalMetadata,
    }

    // Track performance metric
    const perfData: Record<string, unknown> = {
      operation: metric.operation,
      duration,
      success,
      ...finalMetadata,
    }
    if (error) {
      perfData.error = error
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await analytics.trackPerformance(perfData as any)

    // Clean up
    this.metrics.delete(operationId)

    // Log performance warnings for slow operations
    if (duration > this.getPerformanceThreshold(metric.operation)) {
      console.warn(
        `Slow ${metric.operation} operation: ${duration}s (threshold: ${this.getPerformanceThreshold(metric.operation)}s)`,
        { operationId, duration, metadata: finalMetadata },
      )
    }
  }

  /**
   * Wrap an async operation with performance tracking
   */
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.startOperation(operationId, operation, metadata)

    try {
      const result = await fn()
      await this.endOperation(operationId, true, undefined, metadata)
      return result
    } catch (error) {
      await this.endOperation(
        operationId,
        false,
        error instanceof Error ? error.message : 'Unknown error',
        metadata,
      )
      throw error
    }
  }

  /**
   * Get performance threshold for different operations (in seconds)
   */
  private getPerformanceThreshold(operation: string): number {
    const thresholds: Record<string, number> = {
      adventure_generation: 15.0, // 15 seconds for full adventure generation
      movement_expansion: 8.0, // 8 seconds for movement expansion
      scene_expansion: 10.0, // 10 seconds for scene expansion (more complex with vector search)
      content_refinement: 5.0, // 5 seconds for content refinement
      export_generation: 3.0, // 3 seconds for export
      database_query: 1.0, // 1 second for database operations
      api_request: 2.0, // 2 seconds for external API requests
    }

    return thresholds[operation] || 10.0 // Default 10 seconds
  }

  /**
   * Get current metrics count (for monitoring memory usage)
   */
  getActiveMetricsCount(): number {
    return this.metrics.size
  }

  /**
   * Clear all metrics (useful for cleanup)
   */
  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Decorator for automatic performance tracking
 */
export function trackPerformance(operation: string, metadata?: Record<string, unknown>) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      performanceMonitor.startOperation(operationId, operation, metadata)

      try {
        const result = await originalMethod.apply(this, args)
        await performanceMonitor.endOperation(operationId, true)
        return result
      } catch (error) {
        await performanceMonitor.endOperation(
          operationId,
          false,
          error instanceof Error ? error.message : 'Unknown error',
        )
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Utility function for measuring Core Web Vitals and custom metrics
 */
export interface WebVital {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

export function trackWebVital(metric: WebVital): void {
  // Server-side: store in database
  analytics
    .track('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      metric_id: metric.id,
    })
    .catch((error) => {
      console.error('Failed to track web vital:', error)
    })

  // Log poor performance
  if (metric.rating === 'poor') {
    console.warn(`Poor ${metric.name} performance:`, metric.value)
  }
}

/**
 * Memory usage monitoring - this should be called from client-side code
 */
export function trackMemoryUsage(): void {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (
      performance as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
      }
    ).memory

    if (memory) {
      analytics
        .track('memory_usage', {
          used_heap: memory.usedJSHeapSize,
          total_heap: memory.totalJSHeapSize,
          heap_limit: memory.jsHeapSizeLimit,
          usage_ratio: memory.usedJSHeapSize / memory.totalJSHeapSize,
        })
        .catch((error) => {
          console.error('Failed to track memory usage:', error)
        })
    }
  }
}
