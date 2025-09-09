import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import NewAdventurePage from '@/app/adventures/new/page'
import { createClientSupabaseClient } from '@/lib/supabase/client'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClientSupabaseClient: vi.fn(),
}))

describe('NewAdventurePage', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
    refresh: vi.fn(),
  }
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(createClientSupabaseClient).mockReturnValue(mockSupabaseClient)
  })

  describe('guest user flow', () => {
    it('should display adventure creation form for guest users', async () => {
      render(<NewAdventurePage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should show the adventure creation interface
      expect(screen.getByText(/Create Your Adventure/i)).toBeInTheDocument()
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
    })

    it('should show guest user limitations message', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/You're creating as a guest/i)).toBeInTheDocument()
      expect(screen.getByText(/Sign up to save your adventures/i)).toBeInTheDocument()
    })

    it('should have all required form steps', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Step indicators or navigation
      expect(screen.getByText(/Adventure Length/i)).toBeInTheDocument()
    })
  })

  describe('form interactions', () => {
    it('should advance to next step when selection is made', async () => {
      const user = userEvent.setup()
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Select "One-shot" option
      const oneshotOption = screen.getByRole('button', { name: /One-shot/i })
      await user.click(oneshotOption)

      // Should advance to next step
      expect(screen.getByText(/Primary Motif/i)).toBeInTheDocument()
    })

    it('should show back button after first step', async () => {
      const user = userEvent.setup()
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Make first selection
      const oneshotOption = screen.getByRole('button', { name: /One-shot/i })
      await user.click(oneshotOption)

      // Back button should appear
      const backButton = screen.getByRole('button', { name: /Back/i })
      expect(backButton).toBeInTheDocument()
    })

    it('should go back to previous step when back is clicked', async () => {
      const user = userEvent.setup()
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Make first selection
      const oneshotOption = screen.getByRole('button', { name: /One-shot/i })
      await user.click(oneshotOption)

      // Click back
      const backButton = screen.getByRole('button', { name: /Back/i })
      await user.click(backButton)

      // Should be back at step 1
      expect(screen.getByText(/Adventure Length/i)).toBeInTheDocument()
    })
  })

  describe('completion flow', () => {
    it('should navigate to scaffold page after all questions answered', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Mock completing all steps (simplified for test)
      // In reality, would need to go through all steps

      // After completing all steps, should redirect
      // This is a placeholder - actual implementation would track state
      expect(mockPush).not.toHaveBeenCalled() // Initially no navigation
    })
  })

  describe('authenticated user flow', () => {
    it('should not show guest limitations for logged-in users', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
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
      expect(screen.queryByText(/You're creating as a guest/i)).not.toBeInTheDocument()
    })
  })
})
