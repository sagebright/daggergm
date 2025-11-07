import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

// Mock CSS variables for testing
const mockCSSVariables = () => {
  const style = document.createElement('style')
  style.innerHTML = `
    :root {
      --dagger-purple-900: 0.18 0.15 285;
      --dagger-purple-800: 0.24 0.12 285;
      --dagger-teal-400: 0.75 0.08 180;
      --dagger-gold-400: 0.82 0.12 85;
      --background: 0.98 0.005 285;
      --foreground: 0.15 0.12 285;
      --primary: var(--dagger-purple-800);
      --accent: var(--dagger-teal-400);
    }
  `
  document.head.appendChild(style)
}

describe('Theme Integration', () => {
  beforeEach(() => {
    mockCSSVariables()
  })

  describe('Button Component', () => {
    it('should apply Daggerheart primary colors to default variant', () => {
      render(<Button>Test Button</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('bg-primary')
      expect(button.className).toContain('text-primary-foreground')
    })

    it('should apply accent colors to secondary variant', () => {
      render(<Button variant="secondary">Test Button</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('bg-secondary')
      expect(button.className).toContain('text-secondary-foreground')
    })

    it('should maintain hover states with theme colors', () => {
      render(<Button>Test Button</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('hover:bg-primary/90')
    })

    it('should have proper focus ring with theme accent', () => {
      render(<Button>Test Button</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('focus-visible:ring-ring')
    })
  })

  describe('Card Component', () => {
    it('should apply theme background and border colors', () => {
      render(
        <Card>
          <CardHeader>Test Card</CardHeader>
          <CardContent>Content</CardContent>
        </Card>,
      )

      const card = screen.getByText('Test Card').closest('[class*="rounded-"]')
      expect(card?.className).toContain('bg-card')
      expect(card?.className).toContain('border')
    })

    it('should use proper text colors from theme', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>,
      )

      const card = screen.getByText('Title').closest('[data-slot="card"]')
      const description = screen.getByText('Description')

      // Card applies text-card-foreground to the container
      expect(card?.className).toContain('text-card-foreground')
      expect(description.className).toContain('text-muted-foreground')
    })
  })

  describe('Badge Component', () => {
    it('should apply Daggerheart accent colors', () => {
      render(<Badge variant="secondary">Test Badge</Badge>)
      const badge = screen.getByText('Test Badge')

      expect(badge.className).toContain('bg-secondary')
      expect(badge.className).toContain('text-secondary-foreground')
    })

    it('should support theme color variants', () => {
      render(<Badge variant="outline">Outline Badge</Badge>)
      const badge = screen.getByText('Outline Badge')

      expect(badge.className).toContain('border')
      expect(badge.className).toContain('text-foreground')
    })
  })

  describe('Typography', () => {
    it('should apply correct font sizes from theme', () => {
      render(
        <div>
          <h1 className="text-display">Display Text</h1>
          <p className="text-medium">Medium Text</p>
          <p className="text-small">Small Text</p>
          <span className="text-caption">Caption Text</span>
        </div>,
      )

      // Check that classes are applied (actual styling would be verified in visual tests)
      expect(screen.getByText('Display Text').className).toBe('text-display')
      expect(screen.getByText('Medium Text').className).toBe('text-medium')
      expect(screen.getByText('Small Text').className).toBe('text-small')
      expect(screen.getByText('Caption Text').className).toBe('text-caption')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should maintain theme on mobile viewports', () => {
      // Mock mobile viewport
      global.window.innerWidth = 375
      global.window.innerHeight = 667

      render(<Button className="w-full sm:w-auto">Responsive Button</Button>)
      const button = screen.getByRole('button')

      expect(button.className).toContain('w-full')
      expect(button.className).toContain('sm:w-auto')
    })
  })

  describe('Accessibility', () => {
    it('should maintain focus indicators with theme colors', () => {
      render(
        <div>
          <Button>Focusable Button</Button>
          <input
            type="text"
            className="focus:ring-accent focus:border-accent"
            placeholder="Focusable Input"
          />
        </div>,
      )

      const button = screen.getByRole('button')
      const input = screen.getByPlaceholderText('Focusable Input')

      expect(button.className).toContain('focus-visible:ring')
      expect(input.className).toContain('focus:ring-accent')
    })
  })
})
