import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import LoginPage from '@/app/auth/login/page'
import { createClient } from '@/lib/supabase/client'
import { createMockSupabaseClient } from '@/test/mocks/supabase'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockRouter: AppRouterInstance = {
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }
  const mockSupabaseClient = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mock implementations to ensure test isolation
    mockSupabaseClient.auth.signInWithOtp = vi.fn()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient)

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3002',
      },
      writable: true,
    })
  })

  describe('rendering', () => {
    it('should render login form correctly', () => {
      render(<LoginPage />)

      expect(screen.getByText('Welcome to DaggerGM')).toBeInTheDocument()
      expect(screen.getByText('Create epic Daggerheart adventures in minutes')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue as Guest' })).toBeInTheDocument()
    })

    it('should have proper form elements', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')
    })
  })

  describe('magic link authentication', () => {
    it('should send magic link on form submission', async () => {
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null })

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3002/auth/callback',
        },
      })

      expect(toast.success).toHaveBeenCalledWith('Check your email for the login link!')
    })

    it('should show loading state during submission', async () => {
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {})) // Never resolves

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(screen.getByText('Sending...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle authentication errors', async () => {
      const errorMessage = 'Invalid email address'
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: { message: errorMessage },
      })

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const form = emailInput.closest('form')!

      await user.type(emailInput, 'invalid-email')

      // Submit the form directly instead of clicking button
      fireEvent.submit(form)

      // Verify the supabase call was made first
      await waitFor(
        () => {
          expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
            email: 'invalid-email',
            options: {
              emailRedirectTo: 'http://localhost:3002/auth/callback',
            },
          })
        },
        { timeout: 3000 },
      )

      // Wait for error toast
      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(errorMessage)
        },
        { timeout: 3000 },
      )
    })

    it('should handle unexpected errors', async () => {
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const form = emailInput.closest('form')!

      await user.type(emailInput, 'test@example.com')

      // Submit the form directly
      fireEvent.submit(form)

      // Verify the supabase call was made
      await waitFor(
        () => {
          expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
            email: 'test@example.com',
            options: {
              emailRedirectTo: 'http://localhost:3002/auth/callback',
            },
          })
        },
        { timeout: 3000 },
      )

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
        },
        { timeout: 3000 },
      )
    })
  })

  describe('guest mode', () => {
    it('should navigate to adventures/new when continuing as guest', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const guestButton = screen.getByRole('button', { name: 'Continue as Guest' })
      await user.click(guestButton)

      expect(mockPush).toHaveBeenCalledWith('/adventures/new')
    })
  })

  describe('signup flow', () => {
    it('should trigger same login flow for signup button', async () => {
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null })

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const signupButton = screen.getByRole('button', { name: 'Sign up with the same form' })

      await user.type(emailInput, 'newuser@example.com')
      await user.click(signupButton)

      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3002/auth/callback',
        },
      })
    })
  })

  describe('form validation', () => {
    it('should require email field', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
      await user.click(submitButton)

      // Should not call supabase without email
      expect(mockSupabaseClient.auth.signInWithOtp).not.toHaveBeenCalled()
    })

    it('should update email state on input change', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })
  })
})
