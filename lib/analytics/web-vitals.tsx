'use client'

import React from 'react'

import { trackWebVital } from '@/lib/performance/performance-monitor'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Initialize web vitals tracking using the web-vitals library
 * This should be called once when the app starts
 */
export function initWebVitals(): void {
  // Only run on client side
  if (typeof window === 'undefined') {
    return
  }

  // Only initialize if analytics is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
    return
  }

  // Dynamic import to avoid SSR issues
  import('web-vitals')
    .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(trackWebVital)
      onFCP(trackWebVital)
      onLCP(trackWebVital)
      onTTFB(trackWebVital)

      // Track INP if available (newer browsers) - replaces FID
      if (onINP) {
        onINP(trackWebVital)
      }
    })
    .catch((error) => {
      console.warn('Failed to load web-vitals:', error)
    })

  // Track custom performance metrics
  trackCustomMetrics()
}

/**
 * Track custom application performance metrics
 */
function trackCustomMetrics(): void {
  // Track page load time
  window.addEventListener('load', () => {
    const loadTime = performance.now()
    trackWebVital({
      name: 'LCP',
      value: loadTime,
      rating: loadTime < 1200 ? 'good' : loadTime < 2500 ? 'needs-improvement' : 'poor',
      delta: loadTime,
      id: `page-load-${Date.now()}`,
    })
  })

  // Track client-side navigation timing
  let navigationStartTime: number | null = null

  // Listen for route changes (Next.js specific)
  if (typeof window !== 'undefined') {
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function (...args) {
      navigationStartTime = performance.now()
      return originalPushState.apply(this, args)
    }

    window.history.replaceState = function (...args) {
      navigationStartTime = performance.now()
      return originalReplaceState.apply(this, args)
    }

    // Track when navigation completes
    const trackNavigationEnd = () => {
      if (navigationStartTime) {
        const navigationTime = performance.now() - navigationStartTime
        trackWebVital({
          name: 'FCP',
          value: navigationTime,
          rating:
            navigationTime < 1000 ? 'good' : navigationTime < 2000 ? 'needs-improvement' : 'poor',
          delta: navigationTime,
          id: `navigation-${Date.now()}`,
        })
        navigationStartTime = null
      }
    }

    // Track when new content is rendered
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(trackNavigationEnd)
    } else {
      setTimeout(trackNavigationEnd, 0)
    }
  }
}

/**
 * Track a custom performance event
 */

export function trackCustomEvent(
  name: string,
  duration: number,
  _metadata?: Record<string, unknown>,
): void {
  const rating = duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor'

  trackWebVital({
    name: 'FCP', // Use FCP as the base metric type
    value: duration,
    rating,
    delta: duration,
    id: `custom-${name}-${Date.now()}`,
  })
}

/**
 * Component for initializing analytics and web vitals
 * Add this to your root layout
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    initWebVitals()

    // Track memory usage periodically (development only)
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && 'memory' in performance) {
          const memory = (
            performance as {
              memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
            }
          ).memory
          if (memory) {
            console.log('Memory usage:', {
              used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
              total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
              limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
            })
          }
        }
      }, 30000) // Every 30 seconds

      return () => clearInterval(interval)
    }
  }, [])

  return <>{children}</>
}

// Export the function as the default for compatibility
export default AnalyticsProvider
