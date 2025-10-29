import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { signInWithOtp, signInWithPassword, signUpWithPassword } from '@/app/actions/auth'
import LoginPage from '@/app/auth/login/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock Server Actions
vi.mock('@/app/actions/auth', () => ({
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)

    // Mock NEXT_PUBLIC_SITE_URL and window.location
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
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
      vi.mocked(signInWithOtp).mockResolvedValueOnce({
        success: true,
        message: 'Check your email for the login link!',
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

      await waitFor(() => {
        expect(signInWithOtp).toHaveBeenCalledWith('test@example.com', 'http://localhost:3000')
        expect(toast.success).toHaveBeenCalledWith('Check your email for the login link!')
      })
    })

    it('should show loading state during submission', async () => {
      vi.mocked(signInWithOtp).mockImplementation(() => new Promise(() => {})) // Never resolves

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
  })

  describe('password authentication', () => {
    it('should sign in with password', async () => {
      // Mock successful Server Action that uses redirect()
      // When redirect() is called in Server Actions, it throws a NEXT_REDIRECT error
      // The framework catches this and performs the redirect
      // In tests, the function simply doesn't return anything (undefined)
      vi.mocked(signInWithPassword).mockResolvedValueOnce(undefined as any)

      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(signInWithPassword).toHaveBeenCalledWith('test@example.com', 'password123')
        // redirect() doesn't show a toast or call router.push - it handles redirect server-side
      })
    })

    it('should sign up with password', async () => {
      vi.mocked(signUpWithPassword).mockResolvedValueOnce({
        success: true,
        message: 'Check your email to confirm your account!',
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

      await waitFor(() => {
        expect(signUpWithPassword).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123',
          'http://localhost:3000',
        )
        expect(toast.success).toHaveBeenCalledWith('Check your email to confirm your account!')
      })
    })

    it('should handle password authentication errors', async () => {
      const errorMessage = 'Invalid login credentials'
      vi.mocked(signInWithPassword).mockResolvedValueOnce({
        success: false,
        error: errorMessage,
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

      // Should not call Server Action without email/password
      expect(signInWithPassword).not.toHaveBeenCalled()
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
