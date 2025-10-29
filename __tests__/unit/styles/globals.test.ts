import { describe, it, expect, beforeEach, vi } from 'vitest'

import { getCSSVariables, applyCSSVariables, initializeTheme } from '@/lib/theme/css-variables'

// Mock window.getComputedStyle
const mockComputedStyle = {
  getPropertyValue: vi.fn(),
}

describe('CSS Variables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.window = {
      getComputedStyle: vi.fn(() => mockComputedStyle),
    } as unknown as Window & typeof globalThis
  })

  describe('getCSSVariables', () => {
    it('should extract Daggerheart CSS variables from :root', () => {
      // Mock CSS variable values
      const mockVariables = {
        '--dagger-purple-900': 'oklch(0.18 0.15 285)',
        '--dagger-purple-800': 'oklch(0.24 0.12 285)',
        '--dagger-teal-400': 'oklch(0.75 0.08 180)',
        '--dagger-gold-400': 'oklch(0.82 0.12 85)',
        '--background': 'oklch(0.98 0.005 285)',
        '--foreground': 'oklch(0.15 0.12 285)',
        '--primary': 'var(--dagger-purple-800)',
        '--accent': 'var(--dagger-teal-400)',
      }

      mockComputedStyle.getPropertyValue.mockImplementation(
        (prop: string) => (mockVariables as Record<string, string>)[prop] || '',
      )

      const variables = getCSSVariables()

      expect(variables).toMatchObject({
        'dagger-purple-900': 'oklch(0.18 0.15 285)',
        'dagger-purple-800': 'oklch(0.24 0.12 285)',
        'dagger-teal-400': 'oklch(0.75 0.08 180)',
        'dagger-gold-400': 'oklch(0.82 0.12 85)',
      })
    })

    it('should validate all required CSS variables are defined', () => {
      const requiredVariables = [
        '--dagger-purple-900',
        '--dagger-purple-800',
        '--dagger-teal-400',
        '--dagger-gold-400',
        '--background',
        '--foreground',
        '--primary',
        '--accent',
      ]

      requiredVariables.forEach((_variable) => {
        mockComputedStyle.getPropertyValue.mockReturnValueOnce('defined')
      })

      getCSSVariables()

      requiredVariables.forEach((variable) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(variable)
      })
    })

    it('should return empty object in SSR (no window)', () => {
      // Temporarily remove window
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      const variables = getCSSVariables()

      expect(variables).toEqual({})

      // Restore window
      global.window = originalWindow
    })
  })

  describe('applyCSSVariables', () => {
    it('should apply theme variables to document root', () => {
      const mockElement = {
        style: {
          setProperty: vi.fn(),
        },
      }

      global.document = {
        documentElement: mockElement,
      } as unknown as Document

      const variables = {
        'dagger-purple-900': 'oklch(0.18 0.15 285)',
        'dagger-purple-800': 'oklch(0.24 0.12 285)',
        'dagger-teal-400': 'oklch(0.75 0.08 180)',
        'dagger-gold-400': 'oklch(0.82 0.12 85)',
      }

      applyCSSVariables(variables)

      Object.entries(variables).forEach(([key, value]) => {
        expect(mockElement.style.setProperty).toHaveBeenCalledWith(`--${key}`, value)
      })
    })

    it('should handle OKLCH color space properly', () => {
      const mockElement = {
        style: {
          setProperty: vi.fn(),
        },
      }

      global.document = {
        documentElement: mockElement,
      } as unknown as Document

      applyCSSVariables({
        background: 'oklch(0.98 0.005 285)',
      })

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        '--background',
        'oklch(0.98 0.005 285)',
      )
    })

    it('should handle SSR gracefully (no document)', () => {
      // Temporarily remove document
      const originalDocument = global.document
      // @ts-expect-error - Testing SSR behavior
      delete global.document

      // Should not throw
      expect(() => {
        applyCSSVariables({ background: 'oklch(0.98 0.005 285)' })
      }).not.toThrow()

      // Restore document
      global.document = originalDocument
    })
  })

  describe('initializeTheme', () => {
    it('should add daggerheart-theme class to document root', () => {
      const mockElement = {
        classList: {
          add: vi.fn(),
        },
      }

      global.document = {
        documentElement: mockElement,
      } as unknown as Document

      initializeTheme()

      expect(mockElement.classList.add).toHaveBeenCalledWith('daggerheart-theme')
    })

    it('should handle SSR gracefully (no document)', () => {
      // Temporarily remove document
      const originalDocument = global.document
      // @ts-expect-error - Testing SSR behavior
      delete global.document

      // Should not throw
      expect(() => {
        initializeTheme()
      }).not.toThrow()

      // Restore document
      global.document = originalDocument
    })
  })
})
