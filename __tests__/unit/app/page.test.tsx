import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock next/link since it's used in the component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('HomePage', () => {
  describe('hero section', () => {
    it('should render main heading', () => {
      render(<HomePage />)

      expect(screen.getByText('Create Epic Daggerheart Adventures in Minutes')).toBeInTheDocument()
    })

    it('should render description text', () => {
      render(<HomePage />)

      expect(screen.getByText(/DaggerGM is your AI-powered assistant/i)).toBeInTheDocument()
    })

    it('should have Get Started button linking to auth', () => {
      render(<HomePage />)

      const getStartedButton = screen.getByRole('link', { name: 'Get Started' })
      expect(getStartedButton).toHaveAttribute('href', '/auth/login')
    })

    it('should have Try as Guest button linking to adventures', () => {
      render(<HomePage />)

      const guestButton = screen.getByRole('link', { name: 'Try as Guest' })
      expect(guestButton).toHaveAttribute('href', '/adventures/new')
    })
  })

  describe('features section', () => {
    it('should render features heading', () => {
      render(<HomePage />)

      expect(screen.getByText('GM Like a Pro, Prep Like Magic')).toBeInTheDocument()
    })

    it('should render all three main features', () => {
      render(<HomePage />)

      expect(screen.getByText('Frame-Aware Generation')).toBeInTheDocument()
      expect(screen.getByText('Balanced Encounters')).toBeInTheDocument()
      expect(screen.getByText('AI-Powered Refinement')).toBeInTheDocument()
    })

    it('should render feature descriptions', () => {
      render(<HomePage />)

      expect(
        screen.getByText(/Adventures tailored to specific Daggerheart Frames/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Combat, exploration, and social encounters balanced/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Focus Mode lets you dive deep into any movement/i),
      ).toBeInTheDocument()
    })
  })

  describe('CTA section', () => {
    it('should render final CTA heading', () => {
      render(<HomePage />)

      expect(screen.getByText('Ready to revolutionize your game prep?')).toBeInTheDocument()
    })

    it('should render CTA description', () => {
      render(<HomePage />)

      expect(
        screen.getByText(/Join thousands of Game Masters who are creating/i),
      ).toBeInTheDocument()
    })

    it('should have final CTA button linking to auth', () => {
      render(<HomePage />)

      const ctaButton = screen.getByRole('link', { name: 'Start Creating Adventures' })
      expect(ctaButton).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HomePage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })

      expect(h1).toBeInTheDocument()
      expect(h2Elements).toHaveLength(2) // "Everything you need" and "Ready to revolutionize"
    })

    it('should have descriptive text for features', () => {
      render(<HomePage />)

      // Each feature should have a dt (term) and dd (description)
      const terms = screen.getAllByRole('term')
      expect(terms).toHaveLength(3)
    })
  })

  describe('responsive design elements', () => {
    it('should render with responsive container classes', () => {
      const { container } = render(<HomePage />)

      // Check that responsive classes are present in the markup
      expect(container.querySelector('.mx-auto.max-w-7xl')).toBeInTheDocument()
      expect(container.querySelector('.lg\\:flex')).toBeInTheDocument()
    })

    it('should have responsive text sizing classes', () => {
      const { container } = render(<HomePage />)

      // Check for responsive text classes
      expect(container.querySelector('.sm\\:text-6xl')).toBeInTheDocument()
      expect(container.querySelector('.sm\\:text-4xl')).toBeInTheDocument()
    })
  })

  describe('content verification', () => {
    it('should mention Daggerheart specifically', () => {
      render(<HomePage />)

      // Should mention Daggerheart multiple times
      const daggerheartMentions = screen.getAllByText(/Daggerheart/i)
      expect(daggerheartMentions.length).toBeGreaterThan(0)
    })

    it('should emphasize key benefits', () => {
      render(<HomePage />)

      expect(screen.getAllByText(/in minutes/i)).toHaveLength(2)
      expect(screen.getByText(/under 10 minutes/i)).toBeInTheDocument()
    })
  })
})
