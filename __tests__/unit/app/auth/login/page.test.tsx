import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import LoginPage from '@/app/auth/login/page'
import { createClient } from '@/lib/supabase/client'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

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
    mockSupabaseClient.auth.signInWithPassword = vi.fn()
    mockSupabaseClient.auth.signUp = vi.fn()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient)

    // Mock NEXT_PUBLIC_SITE_URL and window.location
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    delete (window as any).location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/auth/login',
      },
      writable: true,
      configurable: true,
    })
  })

  describe('rendering', () => {
    it('should render login form in password mode by default', () => {
      render(<LoginPage />)

      expect(screen.getByText('Welcome to DaggerGM')).toBeInTheDocument()
      expect(screen.getByText('Create epic Daggerheart adventures in minutes')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Continue as Guest' })).not.toBeInTheDocument()
    })

    it('should have proper form elements', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('minLength', '6')
    })

    it('should allow toggling between password and magic link modes', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Start in password mode
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()

      // Toggle to magic link mode
      const toggleButton = screen.getByRole('button', { name: 'Use magic link instead' })
      await user.click(toggleButton)

      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument()

      // Toggle back to password mode
      const backButton = screen.getByRole('button', { name: 'Use password instead' })
      await user.click(backButton)

      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })
  })

  describe('magic link authentication', () => {
    it('should send magic link on form submission', async () => {
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: null,
      })

      const user = userEvent.setup()
      render(<LoginPage />)

      // Switch to magic link mode
      const toggleButton = screen.getByRole('button', { name: 'Use magic link instead' })
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      })

      expect(toast.success).toHaveBeenCalledWith('Check your email for the login link!')
    })

    it('should show loading state during submission', async () => {
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}),
      ) // Never resolves

      const user = userEvent.setup()
      render(<LoginPage />)

      // Switch to magic link mode
      const toggleButton = screen.getByRole('button', { name: 'Use magic link instead' })
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle authentication errors', async () => {
      const errorMessage = 'Invalid email address'
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: { message: errorMessage },
      })

      const user = userEvent.setup()
      render(<LoginPage />)

      // Switch to magic link mode
      const toggleButton = screen.getByRole('button', { name: 'Use magic link instead' })
      await user.click(toggleButton)

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
              emailRedirectTo: 'http://localhost:3000/auth/callback',
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
      ;(mockSupabaseClient.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error'),
      )

      const user = userEvent.setup()
      render(<LoginPage />)

      // Switch to magic link mode
      const toggleButton = screen.getByRole('button', { name: 'Use magic link instead' })
      await user.click(toggleButton)

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
              emailRedirectTo: 'http://localhost:3000/auth/callback',
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

  describe('password authentication', () => {
    it('should sign in with password', async () => {
      ;(
        mockSupabaseClient.auth.signInWithPassword as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        error: null,
      })

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Login successful!')
        // Should use window.location.href for full page reload
        expect(window.location.href).toBe('/dashboard')
      })
    })

    it('should sign up with password', async () => {
      ;(mockSupabaseClient.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: null,
      })

      const user = userEvent.setup()
      render(<LoginPage />)

      // Toggle to sign up mode
      const signUpToggle = screen.getByRole('button', { name: 'Create account' })
      await user.click(signUpToggle)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      })

      expect(toast.success).toHaveBeenCalledWith('Check your email to confirm your account!')
    })

    it('should handle password authentication errors', async () => {
      const errorMessage = 'Invalid login credentials'
      ;(
        mockSupabaseClient.auth.signInWithPassword as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        error: { message: errorMessage },
      })

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage)
      })
    })

    it('should toggle between sign in and sign up modes', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Start in sign in mode
      expect(screen.getByText('Welcome to DaggerGM')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()

      // Toggle to sign up
      const signUpToggle = screen.getByRole('button', { name: 'Create account' })
      await user.click(signUpToggle)

      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()

      // Toggle back to sign in
      const signInToggle = screen.getByRole('button', { name: 'Sign in' })
      await user.click(signInToggle)

      expect(screen.getByText('Welcome to DaggerGM')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('should require email and password fields', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(submitButton)

      // Should not call supabase without email/password
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should update email state on input change', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should update password state on input change', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })

    it('should enforce minimum password length', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('minLength', '6')
    })
  })
})
