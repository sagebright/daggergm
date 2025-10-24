'use client'

import { useEffect } from 'react'

import { useAnalytics } from '@/hooks/use-analytics'

export function WebVitalsTracker() {
  const { track } = useAnalytics()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Track web vitals using the web-vitals library
    void import('web-vitals')
      .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        const handleMetric = (metric: {
          name: string
          value: number
          rating: string
          delta: number
          id: string
        }) => {
          void track('web_vital', {
            metric_name: metric.name,
            metric_value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            metric_id: metric.id,
          })

          // Log poor performance
          if (metric.rating === 'poor') {
            console.warn(`Poor ${metric.name} performance:`, metric.value)
          }
        }

        onCLS(handleMetric)
        onINP(handleMetric) // INP replaces FID in newer web-vitals
        onFCP(handleMetric)
        onLCP(handleMetric)
        onTTFB(handleMetric)
      })
      .catch((error: Error) => {
        console.error('Failed to load web-vitals:', error)
      })
  }, [track])

  return null
}
