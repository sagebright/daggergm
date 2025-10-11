import { describe, it, expect } from 'vitest'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '@/tailwind.config'

describe('Tailwind Theme Configuration', () => {
  const fullConfig = resolveConfig(tailwindConfig)

  describe('Daggerheart Color Palette', () => {
    it('should extend theme with Daggerheart colors', () => {
      expect(fullConfig.theme.colors).toHaveProperty('dagger-purple')
      expect(fullConfig.theme.colors).toHaveProperty('dagger-teal')
      expect(fullConfig.theme.colors).toHaveProperty('dagger-gold')
    })

    it('should define purple color shades', () => {
      const purpleColors = fullConfig.theme.colors['dagger-purple']
      expect(purpleColors).toMatchObject({
        900: 'oklch(var(--dagger-purple-900) / <alpha-value>)',
        800: 'oklch(var(--dagger-purple-800) / <alpha-value>)',
      })
    })

    it('should define teal accent color', () => {
      const tealColors = fullConfig.theme.colors['dagger-teal']
      expect(tealColors).toMatchObject({
        400: 'oklch(var(--dagger-teal-400) / <alpha-value>)',
      })
    })

    it('should define gold highlight color', () => {
      const goldColors = fullConfig.theme.colors['dagger-gold']
      expect(goldColors).toMatchObject({
        400: 'oklch(var(--dagger-gold-400) / <alpha-value>)',
      })
    })

    it('should maintain existing shadcn colors', () => {
      expect(fullConfig.theme.colors).toHaveProperty('background')
      expect(fullConfig.theme.colors).toHaveProperty('foreground')
      expect(fullConfig.theme.colors).toHaveProperty('primary')
      expect(fullConfig.theme.colors).toHaveProperty('secondary')
      expect(fullConfig.theme.colors).toHaveProperty('accent')
    })
  })

  describe('Typography Configuration', () => {
    it('should extend fontSize with custom sizes', () => {
      expect(fullConfig.theme.fontSize).toHaveProperty('display')
      expect(fullConfig.theme.fontSize).toHaveProperty('medium')
      expect(fullConfig.theme.fontSize).toHaveProperty('small')
      expect(fullConfig.theme.fontSize).toHaveProperty('caption')
    })

    it('should configure display text size', () => {
      const displaySize = fullConfig.theme.fontSize.display
      expect(displaySize).toEqual([
        '24px',
        {
          lineHeight: '32px',
          fontWeight: '600',
        },
      ])
    })

    it('should configure medium text size', () => {
      const mediumSize = fullConfig.theme.fontSize.medium
      expect(mediumSize).toEqual([
        '18px',
        {
          lineHeight: '28px',
          fontWeight: '500',
        },
      ])
    })

    it('should configure system font stack', () => {
      const fontFamily = fullConfig.theme.fontFamily.sans
      expect(fontFamily).toContain('system-ui')
      expect(fontFamily).toContain('Roboto')
      expect(fontFamily).toContain('Inter')
      expect(fontFamily).toContain('sans-serif')
    })
  })

  describe('OKLCH Color Support', () => {
    it('should use OKLCH color function format', () => {
      const primaryColor = fullConfig.theme.colors.primary.DEFAULT
      expect(primaryColor).toContain('oklch(')
      expect(primaryColor).toContain('var(')
    })

    it('should support alpha values in OKLCH colors', () => {
      const purpleColor = fullConfig.theme.colors['dagger-purple']['800']
      expect(purpleColor).toContain('<alpha-value>')
    })
  })

  describe('Animation and Transitions', () => {
    it('should maintain smooth transitions for theme changes', () => {
      expect(fullConfig.theme.transitionDuration).toHaveProperty('200')
      expect(fullConfig.theme.transitionTimingFunction).toHaveProperty('DEFAULT')
    })
  })
})
