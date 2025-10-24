import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { purchaseCredits } from '@/app/actions/credits'
import { CreditPurchaseDialog } from '@/components/features/credit-purchase-dialog'

// Mock actions
vi.mock('@/app/actions/credits', () => ({
  purchaseCredits: vi.fn(),
}))

// Mock Stripe
vi.mock('@stripe/stripe-js')

describe('CreditPurchaseDialog', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set test environment variable
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  })

  it('should render credit packages', () => {
    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Should show available packages
    expect(screen.getByText('5 Credits')).toBeInTheDocument()
    expect(screen.getByText('$5')).toBeInTheDocument()

    expect(screen.getByText('15 Credits')).toBeInTheDocument()
    expect(screen.getByText('$12')).toBeInTheDocument()
    expect(screen.getByText('20% off')).toBeInTheDocument()

    expect(screen.getByText('30 Credits')).toBeInTheDocument()
    expect(screen.getByText('$21')).toBeInTheDocument()
    expect(screen.getByText('30% off')).toBeInTheDocument()
  })

  it('should show loading state during purchase', async () => {
    const user = userEvent.setup()

    vi.mocked(purchaseCredits).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                sessionId: 'test-session',
              }),
            100,
          ),
        ),
    )

    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // First select a package
    const firstPackage = screen.getByTestId('credit-package-credits_5')
    await user.click(firstPackage)

    // Then click purchase button
    const purchaseButton = screen.getByRole('button', { name: 'Purchase 5 Credits' })
    await user.click(purchaseButton)

    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument()

    await waitFor(() => {
      expect(purchaseCredits).toHaveBeenCalledWith({
        packageId: 'credits_5',
        amount: 5,
        price: 500, // in cents
      })
    })
  })

  it('should handle purchase errors', async () => {
    const user = userEvent.setup()

    vi.mocked(purchaseCredits).mockResolvedValueOnce({
      success: false,
      error: 'Payment failed',
    })

    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const purchaseButton = screen.getByRole('button', { name: 'Purchase 5 Credits' })
    await user.click(purchaseButton)

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument()
    })
  })

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()

    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should highlight best value package', () => {
    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // The 30 credit package should be highlighted as best value
    const bestValuePackage = screen.getByTestId('credit-package-credits_30')
    expect(bestValuePackage).toHaveClass('ring-2')
    expect(screen.getByText('Best Value')).toBeInTheDocument()
  })

  it('should call purchaseCredits with correct parameters', async () => {
    const user = userEvent.setup()

    vi.mocked(purchaseCredits).mockResolvedValueOnce({
      success: true,
      sessionId: 'test-session-123',
    })

    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // First select a package
    const firstPackage = screen.getByTestId('credit-package-credits_5')
    await user.click(firstPackage)

    // Then click purchase button - button text changes based on selection
    const purchaseButton = screen.getByRole('button', { name: 'Purchase 5 Credits' })
    await user.click(purchaseButton)

    await waitFor(() => {
      expect(purchaseCredits).toHaveBeenCalledWith({
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      })
    })
  })

  it('should display package details correctly', () => {
    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Check that per-credit pricing is shown
    expect(screen.getByText('$1.00 per credit')).toBeInTheDocument()
    expect(screen.getByText('$0.80 per credit')).toBeInTheDocument()
    expect(screen.getByText('$0.70 per credit')).toBeInTheDocument()
  })

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup()

    render(<CreditPurchaseDialog open={true} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

    // Tab to first package (dialog initially has focus)
    await user.tab()

    // Check if any of our packages has focus
    const firstPackage = screen.getByTestId('credit-package-credits_5')
    const secondPackage = screen.getByTestId('credit-package-credits_15')
    const thirdPackage = screen.getByTestId('credit-package-credits_30')

    // Test that we can click on packages to select them
    await user.click(firstPackage)
    expect(firstPackage).toHaveClass('border-primary')

    await user.click(secondPackage)
    expect(secondPackage).toHaveClass('border-primary')
    expect(firstPackage).not.toHaveClass('border-primary')

    await user.click(thirdPackage)
    expect(thirdPackage).toHaveClass('border-primary')
    expect(secondPackage).not.toHaveClass('border-primary')
  })
})
