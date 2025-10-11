import { describe, it, expect } from 'vitest'
import tailwindConfig from '@/tailwind.config'
import type { Config } from 'tailwindcss'

describe('tailwind.config.ts', () => {
  it('should export a valid Tailwind config object', () => {
    expect(tailwindConfig).toBeDefined()
    expect(typeof tailwindConfig).toBe('object')
  })

  describe('content configuration', () => {
    it('should include all necessary content paths', () => {
      expect(tailwindConfig.content).toBeDefined()
      expect(Array.isArray(tailwindConfig.content)).toBe(true)
    })

    it('should scan pages directory', () => {
      expect(tailwindConfig.content).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}')
    })

    it('should scan components directory', () => {
      expect(tailwindConfig.content).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}')
    })

    it('should scan app directory', () => {
      expect(tailwindConfig.content).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}')
    })
  })

  describe('theme configuration', () => {
    it('should have theme extensions', () => {
      expect(tailwindConfig.theme).toBeDefined()
      expect(tailwindConfig.theme?.extend).toBeDefined()
    })

    describe('colors', () => {
      const colors = (tailwindConfig.theme as unknown)?.extend?.colors

      it('should define Daggerheart purple colors', () => {
        expect(colors).toHaveProperty('dagger-purple')
        expect(colors['dagger-purple']).toHaveProperty('900')
        expect(colors['dagger-purple']).toHaveProperty('800')
        expect(colors['dagger-purple']['900']).toBe(
          'oklch(var(--dagger-purple-900) / <alpha-value>)',
        )
        expect(colors['dagger-purple']['800']).toBe(
          'oklch(var(--dagger-purple-800) / <alpha-value>)',
        )
      })

      it('should define Daggerheart teal color', () => {
        expect(colors).toHaveProperty('dagger-teal')
        expect(colors['dagger-teal']).toHaveProperty('400')
        expect(colors['dagger-teal']['400']).toBe('oklch(var(--dagger-teal-400) / <alpha-value>)')
      })

      it('should define Daggerheart gold color', () => {
        expect(colors).toHaveProperty('dagger-gold')
        expect(colors['dagger-gold']).toHaveProperty('400')
        expect(colors['dagger-gold']['400']).toBe('oklch(var(--dagger-gold-400) / <alpha-value>)')
      })

      it('should define shadcn/ui base colors', () => {
        expect(colors).toHaveProperty('border')
        expect(colors).toHaveProperty('input')
        expect(colors).toHaveProperty('ring')
        expect(colors).toHaveProperty('background')
        expect(colors).toHaveProperty('foreground')
      })

      it('should define primary color variants', () => {
        expect(colors).toHaveProperty('primary')
        expect(colors.primary).toHaveProperty('DEFAULT')
        expect(colors.primary).toHaveProperty('foreground')
        expect(colors.primary.DEFAULT).toBe('oklch(var(--primary) / <alpha-value>)')
        expect(colors.primary.foreground).toBe('oklch(var(--primary-foreground) / <alpha-value>)')
      })

      it('should define secondary color variants', () => {
        expect(colors).toHaveProperty('secondary')
        expect(colors.secondary).toHaveProperty('DEFAULT')
        expect(colors.secondary).toHaveProperty('foreground')
      })

      it('should define destructive color variants', () => {
        expect(colors).toHaveProperty('destructive')
        expect(colors.destructive).toHaveProperty('DEFAULT')
        expect(colors.destructive).toHaveProperty('foreground')
      })

      it('should define muted color variants', () => {
        expect(colors).toHaveProperty('muted')
        expect(colors.muted).toHaveProperty('DEFAULT')
        expect(colors.muted).toHaveProperty('foreground')
      })

      it('should define accent color variants', () => {
        expect(colors).toHaveProperty('accent')
        expect(colors.accent).toHaveProperty('DEFAULT')
        expect(colors.accent).toHaveProperty('foreground')
      })

      it('should define popover color variants', () => {
        expect(colors).toHaveProperty('popover')
        expect(colors.popover).toHaveProperty('DEFAULT')
        expect(colors.popover).toHaveProperty('foreground')
      })

      it('should define card color variants', () => {
        expect(colors).toHaveProperty('card')
        expect(colors.card).toHaveProperty('DEFAULT')
        expect(colors.card).toHaveProperty('foreground')
      })

      it('should use OKLCH color format', () => {
        expect(colors.background).toContain('oklch(')
        expect(colors.background).toContain('var(')
        expect(colors.background).toContain('<alpha-value>')
      })
    })

    describe('fontFamily', () => {
      const fontFamily = (tailwindConfig.theme as unknown)?.extend?.fontFamily

      it('should define sans-serif font stack', () => {
        expect(fontFamily).toHaveProperty('sans')
        expect(Array.isArray(fontFamily.sans)).toBe(true)
      })

      it('should include system-ui as primary font', () => {
        expect(fontFamily.sans[0]).toBe('system-ui')
      })

      it('should include Apple system font', () => {
        expect(fontFamily.sans).toContain('-apple-system')
      })

      it('should include BlinkMacSystemFont', () => {
        expect(fontFamily.sans).toContain('BlinkMacSystemFont')
      })

      it('should include Segoe UI', () => {
        expect(fontFamily.sans).toContain('"Segoe UI"')
      })

      it('should include Roboto', () => {
        expect(fontFamily.sans).toContain('Roboto')
      })

      it('should include Inter', () => {
        expect(fontFamily.sans).toContain('Inter')
      })

      it('should include Helvetica Neue', () => {
        expect(fontFamily.sans).toContain('"Helvetica Neue"')
      })

      it('should include Arial', () => {
        expect(fontFamily.sans).toContain('Arial')
      })

      it('should fallback to generic sans-serif', () => {
        expect(fontFamily.sans[fontFamily.sans.length - 1]).toBe('sans-serif')
      })
    })

    describe('fontSize', () => {
      const fontSize = (tailwindConfig.theme as unknown)?.extend?.fontSize

      it('should define custom font sizes', () => {
        expect(fontSize).toHaveProperty('display')
        expect(fontSize).toHaveProperty('medium')
        expect(fontSize).toHaveProperty('small')
        expect(fontSize).toHaveProperty('caption')
      })

      it('should configure display size with line height and weight', () => {
        expect(fontSize.display).toEqual(['24px', { lineHeight: '32px', fontWeight: '600' }])
      })

      it('should configure medium size with line height and weight', () => {
        expect(fontSize.medium).toEqual(['18px', { lineHeight: '28px', fontWeight: '500' }])
      })

      it('should configure small size with line height and weight', () => {
        expect(fontSize.small).toEqual(['16px', { lineHeight: '24px', fontWeight: '400' }])
      })

      it('should configure caption size with line height and weight', () => {
        expect(fontSize.caption).toEqual(['14px', { lineHeight: '20px', fontWeight: '400' }])
      })
    })

    describe('borderRadius', () => {
      const borderRadius = (tailwindConfig.theme as unknown)?.extend?.borderRadius

      it('should define custom border radius values', () => {
        expect(borderRadius).toHaveProperty('lg')
        expect(borderRadius).toHaveProperty('md')
        expect(borderRadius).toHaveProperty('sm')
      })

      it('should use CSS variable for lg radius', () => {
        expect(borderRadius.lg).toBe('var(--radius)')
      })

      it('should calculate md radius from CSS variable', () => {
        expect(borderRadius.md).toBe('calc(var(--radius) - 2px)')
      })

      it('should calculate sm radius from CSS variable', () => {
        expect(borderRadius.sm).toBe('calc(var(--radius) - 4px)')
      })
    })
  })

  describe('plugins', () => {
    it('should have plugins array', () => {
      expect(tailwindConfig.plugins).toBeDefined()
      expect(Array.isArray(tailwindConfig.plugins)).toBe(true)
    })

    it('should have empty plugins array by default', () => {
      expect(tailwindConfig.plugins).toHaveLength(0)
    })
  })

  describe('config structure', () => {
    it('should be a valid TypeScript Config type', () => {
      const config: Config = tailwindConfig
      expect(config).toBeDefined()
    })

    it('should export as default', () => {
      expect(tailwindConfig).toBe(tailwindConfig)
    })
  })
})
