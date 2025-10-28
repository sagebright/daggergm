/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { CreditCost } from '@/components/features/credits/CreditCost'

describe('CreditCost Component', () => {
  describe('Display', () => {
    it('should display cost with singular "credit" for cost of 1', () => {
      render(<CreditCost action="generate adventure" cost={1} />)

      expect(screen.getByText(/1 credit/i)).toBeInTheDocument()
      expect(screen.getByText(/to generate adventure/i)).toBeInTheDocument()
    })

    it('should display cost with plural "credits" for cost > 1', () => {
      render(<CreditCost action="expand scene" cost={2} />)

      expect(screen.getByText(/2 credits/i)).toBeInTheDocument()
      expect(screen.getByText(/to expand scene/i)).toBeInTheDocument()
    })

    it('should default to 1 credit when cost is not provided', () => {
      render(<CreditCost action="export" />)

      expect(screen.getByText(/1 credit/i)).toBeInTheDocument()
      expect(screen.getByText(/to export/i)).toBeInTheDocument()
    })

    it('should handle zero cost (free actions)', () => {
      render(<CreditCost action="preview" cost={0} />)

      expect(screen.getByText(/free/i)).toBeInTheDocument()
      expect(screen.queryByText(/credit/i)).not.toBeInTheDocument()
    })
  })

  describe('Visual Elements', () => {
    it('should render coin icon', () => {
      const { container } = render(<CreditCost action="test" cost={1} />)

      // Look for SVG icon (lucide-react renders SVGs)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should have muted foreground styling', () => {
      const { container } = render(<CreditCost action="test" cost={1} />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('text-muted-foreground')
    })

    it('should have small text sizing', () => {
      const { container } = render(<CreditCost action="test" cost={1} />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('text-sm')
    })
  })

  describe('Accessibility', () => {
    it('should be readable by screen readers', () => {
      render(<CreditCost action="generate" cost={3} />)

      const text = screen.getByText(/3 credits/i)
      expect(text).toBeInTheDocument()
      expect(text.parentElement).toHaveClass('flex', 'items-center')
    })

    it('should have proper semantic structure', () => {
      const { container } = render(<CreditCost action="regenerate" cost={1} />)

      const wrapper = container.firstChild
      expect(wrapper).toContainHTML('span')
    })
  })

  describe('Edge Cases', () => {
    it('should handle large credit costs', () => {
      render(<CreditCost action="bulk operation" cost={100} />)

      expect(screen.getByText(/100 credits/i)).toBeInTheDocument()
    })

    it('should handle very long action names', () => {
      const longAction = 'generate a comprehensive multi-scene adventure with detailed NPCs'
      render(<CreditCost action={longAction} cost={5} />)

      expect(screen.getByText(new RegExp(longAction, 'i'))).toBeInTheDocument()
    })

    it('should sanitize action names to prevent XSS', () => {
      const maliciousAction = '<script>alert("xss")</script>'
      const { container } = render(<CreditCost action={maliciousAction} cost={1} />)

      // React automatically escapes HTML - should render as text, not execute script
      expect(container.innerHTML).not.toContain('<script>')
      // The escaped version will be present
      expect(container.innerHTML).toContain('&lt;script&gt;')
    })
  })
})
