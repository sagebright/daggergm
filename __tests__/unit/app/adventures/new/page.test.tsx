import { render, screen, waitFor } from '@testing-library/react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter } from 'next/navigation'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import NewAdventurePage from '@/app/adventures/new/page'
import { createClient } from '@/lib/supabase/client'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Mock the server action
vi.mock('@/app/actions/adventures', () => ({
  generateAdventure: vi.fn(),
}))

// Mock credit actions to avoid Stripe initialization
vi.mock('@/app/actions/credits', () => ({
  getUserCredits: vi.fn().mockResolvedValue({
    success: true,
    adventureCredits: 10,
    expansionCredits: 0,
  }),
  purchaseCredits: vi.fn().mockResolvedValue({
    success: true,
    sessionId: 'mock-session-id',
    url: 'https://checkout.stripe.com/mock',
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('NewAdventurePage', () => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()
  const mockRouter: AppRouterInstance = {
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }
  const mockSupabaseClient = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.auth.getUser = vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: null })
  })

  describe('guest user flow', () => {
    it('should display adventure creation form for guest users', async () => {
      render(<NewAdventurePage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should show the single-screen adventure creation form
      expect(screen.getByText(/Create Your Adventure/i)).toBeInTheDocument()
      expect(screen.getByText(/Adventure Details/i)).toBeInTheDocument()
    })

    it('should show authentication required message for unauthenticated users', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument()
      expect(screen.getByText(/Please sign in to create an adventure/i)).toBeInTheDocument()
    })

    it('should have all required form fields', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // All form fields should be visible on single screen (use labels)
      expect(screen.getByLabelText(/Primary Motif/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Party Size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Party Tier/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Number of Scenes/i)).toBeInTheDocument()
    })
  })

  describe('form interactions', () => {
    it('should have all form fields visible on load', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // All form fields should be visible (guest system removed, no email field)
      expect(screen.getByLabelText(/Primary Motif/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Party Size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Party Tier/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Number of Scenes/i)).toBeInTheDocument()
    })

    it('should have submit button enabled', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /Generate Adventure/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('completion flow', () => {
    it('should have form with submit button', async () => {
      render(<NewAdventurePage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Submit button should be present
      const submitButton = screen.getByRole('button', { name: /Generate Adventure/i })
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('adventure generation', () => {
    it('should display default form values', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Form should render with all field labels
      expect(screen.getByLabelText(/Primary Motif/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Party Size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Party Tier/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Number of Scenes/i)).toBeInTheDocument()

      // Submit button should be present and enabled
      const submitButton = screen.getByRole('button', { name: /Generate Adventure/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('authenticated user flow', () => {
    it('should not show guest limitations for logged-in users', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValueOnce({
        data: {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should not show guest message
      expect(screen.queryByText(/Authentication Required/i)).not.toBeInTheDocument()
    })
  })
})
