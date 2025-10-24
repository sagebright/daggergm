import type { Config } from 'tailwindcss'
import { describe, it, expect } from 'vitest'

import tailwindConfig from '@/tailwind.config'

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
      const colors = (tailwindConfig.theme as { extend?: { colors?: Record<string, unknown> } })
        ?.extend?.colors

      it('should define Daggerheart purple colors', () => {
        expect(colors!).toHaveProperty('dagger-purple')
        expect((colors as Record<string, Record<string, string>>)!['dagger-purple']).toHaveProperty(
          '900',
        )
        expect((colors as Record<string, Record<string, string>>)!['dagger-purple']).toHaveProperty(
          '800',
        )
        expect((colors as Record<string, Record<string, string>>)!['dagger-purple']!['900']).toBe(
          'oklch(var(--dagger-purple-900) / <alpha-value>)',
        )
        expect((colors as Record<string, Record<string, string>>)!['dagger-purple']!['800']).toBe(
          'oklch(var(--dagger-purple-800) / <alpha-value>)',
        )
      })

      it('should define Daggerheart teal color', () => {
        expect(colors!).toHaveProperty('dagger-teal')
        expect((colors as Record<string, Record<string, string>>)!['dagger-teal']).toHaveProperty(
          '400',
        )
        expect((colors as Record<string, Record<string, string>>)!['dagger-teal']!['400']).toBe(
          'oklch(var(--dagger-teal-400) / <alpha-value>)',
        )
      })

      it('should define Daggerheart gold color', () => {
        expect(colors!).toHaveProperty('dagger-gold')
        expect((colors as Record<string, Record<string, string>>)!['dagger-gold']).toHaveProperty(
          '400',
        )
        expect((colors as Record<string, Record<string, string>>)!['dagger-gold']!['400']).toBe(
          'oklch(var(--dagger-gold-400) / <alpha-value>)',
        )
      })

      it('should define shadcn/ui base colors', () => {
        expect(colors!).toHaveProperty('border')
        expect(colors!).toHaveProperty('input')
        expect(colors!).toHaveProperty('ring')
        expect(colors!).toHaveProperty('background')
        expect(colors!).toHaveProperty('foreground')
      })

      it('should define primary color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('primary')
        expect(colorsTyped!.primary).toHaveProperty('DEFAULT')
        expect(colorsTyped!.primary).toHaveProperty('foreground')
        expect(colorsTyped!.primary!.DEFAULT).toBe('oklch(var(--primary) / <alpha-value>)')
        expect(colorsTyped!.primary!.foreground).toBe(
          'oklch(var(--primary-foreground) / <alpha-value>)',
        )
      })

      it('should define secondary color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('secondary')
        expect(colorsTyped.secondary).toHaveProperty('DEFAULT')
        expect(colorsTyped.secondary).toHaveProperty('foreground')
      })

      it('should define destructive color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('destructive')
        expect(colorsTyped.destructive).toHaveProperty('DEFAULT')
        expect(colorsTyped.destructive).toHaveProperty('foreground')
      })

      it('should define muted color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('muted')
        expect(colorsTyped.muted).toHaveProperty('DEFAULT')
        expect(colorsTyped.muted).toHaveProperty('foreground')
      })

      it('should define accent color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('accent')
        expect(colorsTyped.accent).toHaveProperty('DEFAULT')
        expect(colorsTyped.accent).toHaveProperty('foreground')
      })

      it('should define popover color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('popover')
        expect(colorsTyped.popover).toHaveProperty('DEFAULT')
        expect(colorsTyped.popover).toHaveProperty('foreground')
      })

      it('should define card color variants', () => {
        const colorsTyped = colors as Record<string, Record<string, string>>
        expect(colors!).toHaveProperty('card')
        expect(colorsTyped.card).toHaveProperty('DEFAULT')
        expect(colorsTyped.card).toHaveProperty('foreground')
      })

      it('should use OKLCH color format', () => {
        const colorsTyped = colors as Record<string, string>
        expect(colorsTyped.background).toContain('oklch(')
        expect(colorsTyped.background).toContain('var(')
        expect(colorsTyped.background).toContain('<alpha-value>')
      })
    })

    describe('fontFamily', () => {
      const fontFamily = (
        tailwindConfig.theme as { extend?: { fontFamily?: Record<string, unknown> } }
      )?.extend?.fontFamily

      it('should define sans-serif font stack', () => {
        expect(fontFamily!).toHaveProperty('sans')
        expect(Array.isArray((fontFamily as Record<string, unknown>)!.sans)).toBe(true)
      })

      it('should include system-ui as primary font', () => {
        expect((fontFamily as Record<string, string[]>)!.sans![0]!).toBe('system-ui')
      })

      it('should include Apple system font', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('-apple-system')
      })

      it('should include BlinkMacSystemFont', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('BlinkMacSystemFont')
      })

      it('should include Segoe UI', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('"Segoe UI"')
      })

      it('should include Roboto', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('Roboto')
      })

      it('should include Inter', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('Inter')
      })

      it('should include Helvetica Neue', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('"Helvetica Neue"')
      })

      it('should include Arial', () => {
        expect((fontFamily as Record<string, string[]>)!.sans).toContain('Arial')
      })

      it('should fallback to generic sans-serif', () => {
        const fontFamilyTyped = fontFamily as Record<string, string[]>
        expect(fontFamilyTyped!.sans![fontFamilyTyped!.sans!.length - 1]!).toBe('sans-serif')
      })
    })

    describe('fontSize', () => {
      const fontSize = (tailwindConfig.theme as { extend?: { fontSize?: Record<string, unknown> } })
        ?.extend?.fontSize

      it('should define custom font sizes', () => {
        expect(fontSize!).toHaveProperty('display')
        expect(fontSize!).toHaveProperty('medium')
        expect(fontSize!).toHaveProperty('small')
        expect(fontSize!).toHaveProperty('caption')
      })

      it('should configure display size with line height and weight', () => {
        expect((fontSize as Record<string, unknown>)!.display).toEqual([
          '24px',
          { lineHeight: '32px', fontWeight: '600' },
        ])
      })

      it('should configure medium size with line height and weight', () => {
        expect((fontSize as Record<string, unknown>)!.medium).toEqual([
          '18px',
          { lineHeight: '28px', fontWeight: '500' },
        ])
      })

      it('should configure small size with line height and weight', () => {
        expect((fontSize as Record<string, unknown>)!.small).toEqual([
          '16px',
          { lineHeight: '24px', fontWeight: '400' },
        ])
      })

      it('should configure caption size with line height and weight', () => {
        expect((fontSize as Record<string, unknown>)!.caption).toEqual([
          '14px',
          { lineHeight: '20px', fontWeight: '400' },
        ])
      })
    })

    describe('borderRadius', () => {
      const borderRadius = (
        tailwindConfig.theme as { extend?: { borderRadius?: Record<string, unknown> } }
      )?.extend?.borderRadius

      it('should define custom border radius values', () => {
        expect(borderRadius!).toHaveProperty('lg')
        expect(borderRadius!).toHaveProperty('md')
        expect(borderRadius!).toHaveProperty('sm')
      })

      it('should use CSS variable for lg radius', () => {
        expect((borderRadius as Record<string, string>)!.lg).toBe('var(--radius)')
      })

      it('should calculate md radius from CSS variable', () => {
        expect((borderRadius as Record<string, string>)!.md).toBe('calc(var(--radius) - 2px)')
      })

      it('should calculate sm radius from CSS variable', () => {
        expect((borderRadius as Record<string, string>)!.sm).toBe('calc(var(--radius) - 4px)')
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
