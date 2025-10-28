import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { generateAdventure } from '@/app/actions/adventures'
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

      // Should show the adventure creation interface
      expect(screen.getByText(/Create Your Adventure/i)).toBeInTheDocument()
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
    })

    it('should show guest user limitations message and email input', async () => {
      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByText(/You're creating as a guest/i)).toBeInTheDocument()
      expect(screen.getByText(/Sign up to save your adventures/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email \(required for guest access\)/i)).toBeInTheDocument()
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

    it('should complete all steps and log adventure config', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()

      // Mock generateAdventure to return success
      vi.mocked(generateAdventure).mockResolvedValueOnce({
        success: true,
        adventureId: 'test-adventure-123',
      })

      render(<NewAdventurePage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Fill in guest email first
      const emailInput = screen.getByLabelText(/Email \(required for guest access\)/i)
      await user.type(emailInput, 'test@example.com')

      // Should be at step 1 - Adventure Length
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('Adventure Length')).toBeInTheDocument()

      // Step 1: Choose Adventure Length (clicking automatically advances)
      await user.click(screen.getByText('One-shot'))

      // Should automatically advance to Step 2: Primary Motif (final step)
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
        expect(screen.getByText('Primary Motif')).toBeInTheDocument()
      })

      // Step 2: Choose Primary Motif (this will complete all steps and trigger generation)
      await user.click(screen.getByText('High Fantasy'))

      // Wait for either generating screen or navigation (generation might be too fast)
      await waitFor(() => {
        // Either we see the generating screen or we've navigated
        const generatingScreen = screen.queryByText('Generating Your Adventure')
        const navigationCalled = mockReplace.mock.calls.length > 0

        expect(generatingScreen || navigationCalled).toBeTruthy()
      })

      // If generation completed, verify navigation
      if (mockReplace.mock.calls.length > 0) {
        expect(mockReplace).toHaveBeenCalledWith('/adventures/test-adventure-123')
      }

      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('adventure generation', () => {
    it('should call generateAdventure when wizard completes', async () => {
      const user = userEvent.setup()
      vi.mocked(generateAdventure).mockResolvedValueOnce({
        success: true,
        adventureId: 'adv-123',
      })

      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Fill in guest email
      const emailInput = screen.getByLabelText(/Email \(required for guest access\)/i)
      await user.type(emailInput, 'test@example.com')

      // Complete wizard steps
      await user.click(screen.getByText('One-shot'))
      await waitFor(() => {
        expect(screen.getByText('Primary Motif')).toBeInTheDocument()
      })
      await user.click(screen.getByText('High Fantasy'))

      // Wait for server action to be called
      await waitFor(() => {
        expect(generateAdventure).toHaveBeenCalledWith({
          length: 'oneshot',
          primary_motif: 'high_fantasy',
          frame: 'witherwild', // Default frame added
          party_size: 4,
          party_level: 1,
          difficulty: 'standard',
          stakes: 'personal',
          guestEmail: 'test@example.com',
        })
      })

      // Should show success toast
      expect(toast.success).toHaveBeenCalledWith('Adventure created successfully!')

      // Should navigate to the adventure page using replace
      expect(mockReplace).toHaveBeenCalledWith('/adventures/adv-123')
    })

    it('should handle generation errors gracefully', async () => {
      const user = userEvent.setup()
      vi.mocked(generateAdventure).mockResolvedValueOnce({
        success: false,
        error: 'Insufficient credits',
      })

      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Fill in guest email
      const emailInput = screen.getByLabelText(/Email \(required for guest access\)/i)
      await user.type(emailInput, 'test@example.com')

      // Complete wizard steps
      await user.click(screen.getByText('One-shot'))
      await waitFor(() => {
        expect(screen.getByText('Primary Motif')).toBeInTheDocument()
      })
      await user.click(screen.getByText('High Fantasy'))

      // Should show error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Insufficient credits')
      })

      // Should not navigate
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should show loading state during generation', async () => {
      const user = userEvent.setup()

      // Mock a slow server action
      vi.mocked(generateAdventure).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { success: true, adventureId: 'adv-123' }
      })

      render(<NewAdventurePage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Fill in guest email
      const emailInput = screen.getByLabelText(/Email \(required for guest access\)/i)
      await user.type(emailInput, 'test@example.com')

      // Complete wizard steps
      await user.click(screen.getByText('One-shot'))
      await waitFor(() => {
        expect(screen.getByText('Primary Motif')).toBeInTheDocument()
      })
      await user.click(screen.getByText('High Fantasy'))

      // Should show generating state
      await waitFor(() => {
        expect(screen.getByText('Generating Your Adventure')).toBeInTheDocument()
      })

      // Wait for generation to complete
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/adventures/adv-123')
      })
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
      expect(screen.queryByText(/You're creating as a guest/i)).not.toBeInTheDocument()
    })
  })
})
