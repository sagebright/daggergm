import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

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
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
    )
  })

  describe('authenticated user', () => {
    it('should redirect to dashboard when user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
      })

      vi.mocked(redirect).mockImplementation(() => {
        throw new Error('REDIRECT')
      })

      await expect(HomePage()).rejects.toThrow('REDIRECT')
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('unauthenticated user', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })
    })

    it('should render main heading', async () => {
      const result = await HomePage()
      render(result)

      expect(screen.getByText('Create Epic Daggerheart Adventures in Minutes')).toBeInTheDocument()
    })

    it('should render description text', async () => {
      const result = await HomePage()
      render(result)

      expect(screen.getByText(/DaggerGM is your AI-powered assistant/i)).toBeInTheDocument()
    })

    it('should have Get Started button linking to auth', async () => {
      const result = await HomePage()
      render(result)

      const getStartedButton = screen.getByRole('link', { name: 'Get Started' })
      expect(getStartedButton).toHaveAttribute('href', '/auth/login')
    })

    it('should have Try as Guest button linking to adventures', async () => {
      const result = await HomePage()
      render(result)

      const guestButton = screen.getByRole('link', { name: 'Try as Guest' })
      expect(guestButton).toHaveAttribute('href', '/adventures/new')
    })
  })

  describe('features section', () => {
    it('should render features heading', async () => {
      const result = await HomePage()
      render(result)

      expect(screen.getByText('GM Like a Pro, Prep Like Magic')).toBeInTheDocument()
    })

    it('should render all three main features', async () => {
      const result = await HomePage()
      render(result)

      expect(screen.getByText('Frame-Aware Generation')).toBeInTheDocument()
      expect(screen.getByText('Balanced Encounters')).toBeInTheDocument()
      expect(screen.getByText('AI-Powered Refinement')).toBeInTheDocument()
    })

    it('should render feature descriptions', async () => {
      const result = await HomePage()
      render(result)

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
    it('should render final CTA heading', async () => {
      const result = await HomePage()
      render(result)

      expect(screen.getByText('Ready to revolutionize your game prep?')).toBeInTheDocument()
    })

    it('should render CTA description', async () => {
      const result = await HomePage()
      render(result)

      expect(
        screen.getByText(/Join thousands of Game Masters who are creating/i),
      ).toBeInTheDocument()
    })

    it('should have final CTA button linking to auth', async () => {
      const result = await HomePage()
      render(result)

      const ctaButton = screen.getByRole('link', { name: 'Start Creating Adventures' })
      expect(ctaButton).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      const result = await HomePage()
      render(result)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })

      expect(h1).toBeInTheDocument()
      expect(h2Elements).toHaveLength(2) // "Everything you need" and "Ready to revolutionize"
    })

    it('should have descriptive text for features', async () => {
      const result = await HomePage()
      render(result)

      // Each feature should have a dt (term) and dd (description)
      const terms = screen.getAllByRole('term')
      expect(terms).toHaveLength(3)
    })
  })

  describe('responsive design elements', () => {
    it('should render with responsive container classes', async () => {
      const result = await HomePage()
      const { container } = render(result)

      // Check that responsive classes are present in the markup
      expect(container.querySelector('.mx-auto.max-w-7xl')).toBeInTheDocument()
      expect(container.querySelector('.lg\\:flex')).toBeInTheDocument()
    })

    it('should have responsive text sizing classes', async () => {
      const result = await HomePage()
      const { container } = render(result)

      // Check for responsive text classes
      expect(container.querySelector('.sm\\:text-6xl')).toBeInTheDocument()
      expect(container.querySelector('.sm\\:text-4xl')).toBeInTheDocument()
    })
  })

  describe('content verification', () => {
    it('should mention Daggerheart specifically', async () => {
      const result = await HomePage()
      render(result)

      // Should mention Daggerheart multiple times
      const daggerheartMentions = screen.getAllByText(/Daggerheart/i)
      expect(daggerheartMentions.length).toBeGreaterThan(0)
    })

    it('should emphasize key benefits', async () => {
      const result = await HomePage()
      render(result)

      expect(screen.getAllByText(/in minutes/i)).toHaveLength(2)
      expect(screen.getByText(/under 10 minutes/i)).toBeInTheDocument()
    })
  })
})
