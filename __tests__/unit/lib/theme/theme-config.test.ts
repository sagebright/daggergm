import { describe, it, expect } from 'vitest'

import {
  getDaggerheartTheme,
  validateColorContrast,
  getThemeColors,
} from '@/lib/theme/theme-config'

describe('Daggerheart Theme Configuration', () => {
  describe('getThemeColors', () => {
    it('should return OKLCH color values for light mode', () => {
      const colors = getThemeColors('light')

      expect(colors).toMatchObject({
        'dagger-purple-900': 'oklch(0.18 0.15 285)',
        'dagger-purple-800': 'oklch(0.24 0.12 285)',
        'dagger-teal-400': 'oklch(0.75 0.08 180)',
        'dagger-gold-400': 'oklch(0.82 0.12 85)',
        background: 'oklch(0.98 0.005 285)',
        foreground: 'oklch(0.15 0.12 285)',
        primary: 'var(--dagger-purple-800)',
        accent: 'var(--dagger-teal-400)',
      })
    })

    it('should return proper CSS variable references', () => {
      const colors = getThemeColors('light')

      expect(colors.primary).toBe('var(--dagger-purple-800)')
      expect(colors.accent).toBe('var(--dagger-teal-400)')
    })

    it('should default to light mode when no mode specified', () => {
      const colors = getThemeColors()

      expect(colors.background).toBe('oklch(0.98 0.005 285)')
      expect(colors.primary).toBe('var(--dagger-purple-800)')
    })

    it('should handle dark mode parameter (future implementation)', () => {
      // Dark mode returns same as light for MVP
      // This test ensures the function accepts the parameter without crashing
      const colors = getThemeColors('dark')

      // Should still return light mode colors for now
      expect(colors).toHaveProperty('background')
      expect(colors).toHaveProperty('primary')
    })
  })

  describe('getDaggerheartTheme', () => {
    it('should return complete theme configuration for Tailwind', () => {
      const theme = getDaggerheartTheme()

      expect(theme).toHaveProperty('colors')
      expect(theme).toHaveProperty('fontFamily')
      expect(theme).toHaveProperty('fontSize')
    })

    it('should include Daggerheart color palette', () => {
      const theme = getDaggerheartTheme()

      expect(theme.colors).toMatchObject({
        'dagger-purple': {
          900: 'oklch(var(--dagger-purple-900))',
          800: 'oklch(var(--dagger-purple-800))',
        },
        'dagger-teal': {
          400: 'oklch(var(--dagger-teal-400))',
        },
        'dagger-gold': {
          400: 'oklch(var(--dagger-gold-400))',
        },
      })
    })

    it('should define typography scale', () => {
      const theme = getDaggerheartTheme()

      expect(theme.fontSize).toMatchObject({
        display: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        medium: ['18px', { lineHeight: '28px', fontWeight: '500' }],
        small: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '20px', fontWeight: '400' }],
      })
    })

    it('should include system font stack with fallbacks', () => {
      const theme = getDaggerheartTheme()

      expect(theme.fontFamily.sans).toContain('system-ui')
      expect(theme.fontFamily.sans).toContain('Roboto')
      expect(theme.fontFamily.sans).toContain('Inter')
    })
  })

  describe('validateColorContrast', () => {
    it('should validate WCAG AA compliance for text colors', () => {
      const result = validateColorContrast(
        'oklch(0.15 0.12 285)', // foreground
        'oklch(0.98 0.005 285)', // background
      )

      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
      expect(result.passesAA).toBe(true)
    })

    it('should validate contrast for primary button', () => {
      const result = validateColorContrast(
        'oklch(0.98 0.005 285)', // white text
        'oklch(0.24 0.12 285)', // purple background
      )

      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
      expect(result.passesAA).toBe(true)
    })

    it('should validate contrast for accent elements', () => {
      const result = validateColorContrast(
        'oklch(0.15 0.12 285)', // dark text
        'oklch(0.75 0.08 180)', // teal background
      )

      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
      expect(result.passesAA).toBe(true)
    })

    it('should fail for insufficient contrast', () => {
      const result = validateColorContrast(
        'oklch(0.75 0.08 180)', // teal
        'oklch(0.82 0.12 85)', // gold
      )

      expect(result.passesAA).toBe(false)
    })

    it('should handle invalid OKLCH color format gracefully', () => {
      const result = validateColorContrast(
        'invalid-color', // malformed color
        'oklch(0.98 0.005 285)', // valid background
      )

      // Should not throw and should return a contrast result
      expect(result).toHaveProperty('ratio')
      expect(result).toHaveProperty('passesAA')
      expect(result).toHaveProperty('passesAAA')
    })

    it('should handle both invalid colors gracefully', () => {
      const result = validateColorContrast('invalid-color-1', 'invalid-color-2')

      // Should not throw and should return a result
      expect(result).toHaveProperty('ratio')
      expect(result).toHaveProperty('passesAA')
    })
  })
})
