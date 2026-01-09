import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('basic rendering', () => {
    it('should render as button by default', () => {
      render(<Button data-testid="button">Click me</Button>)

      const button = screen.getByTestId('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveAttribute('data-slot', 'button')
      expect(button).toHaveTextContent('Click me')
    })

    it('should apply default variant classes', () => {
      render(<Button data-testid="button">Default Button</Button>)

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })
  })

  describe('variants', () => {
    it('should apply secondary variant classes', () => {
      render(
        <Button variant="secondary" data-testid="button">
          Secondary
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should apply outline-solid variant classes', () => {
      render(
        <Button variant="outline" data-testid="button">
          Outline
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('border', 'bg-background')
    })

    it('should apply ghost variant classes', () => {
      render(
        <Button variant="ghost" data-testid="button">
          Ghost
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('should apply destructive variant classes', () => {
      render(
        <Button variant="destructive" data-testid="button">
          Destructive
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('bg-destructive')
      // Note: actual implementation uses text-white instead of text-destructive-foreground
    })
  })

  describe('sizes', () => {
    it('should apply default size classes', () => {
      render(<Button data-testid="button">Default Size</Button>)

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('should apply sm size classes', () => {
      render(
        <Button size="sm" data-testid="button">
          Small
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('h-8', 'px-3')
    })

    it('should apply lg size classes', () => {
      render(
        <Button size="lg" data-testid="button">
          Large
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('h-10', 'px-6')
    })

    it('should apply icon size classes', () => {
      render(
        <Button size="icon" data-testid="button">
          Icon
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('size-9')
    })
  })

  describe('asChild prop', () => {
    it('should render as button when asChild is false', () => {
      render(
        <Button asChild={false} data-testid="button">
          Button
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('should render as Slot component when asChild is true', () => {
      render(
        <Button asChild data-testid="button">
          <a href="/test">Link Button</a>
        </Button>,
      )

      const link = screen.getByTestId('button')
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveTextContent('Link Button')
      expect(link).toHaveAttribute('data-slot', 'button')
    })
  })

  describe('custom props', () => {
    it('should accept custom className', () => {
      render(
        <Button className="custom-class" data-testid="button">
          Custom
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should forward HTML button props', () => {
      render(
        <Button disabled type="submit" data-testid="button">
          Submit
        </Button>,
      )

      const button = screen.getByTestId('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('type', 'submit')
    })
  })
})
