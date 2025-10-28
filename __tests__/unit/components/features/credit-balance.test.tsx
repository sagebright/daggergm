/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { CreditBalance } from '@/components/features/credits/CreditBalance'
import * as useCreditBalanceModule from '@/components/features/credits/useCreditBalance'

// Mock the useCreditBalance hook
vi.mock('@/components/features/credits/useCreditBalance')

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

describe('CreditBalance Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Default Variant', () => {
    it('should display credit balance with coin icon', async () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 10,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance />)

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })

      // Check for coin icon (by class or aria-label if added)
      const balanceDisplay = screen.getByText('10')
      expect(balanceDisplay).toHaveClass('font-medium')
    })

    it('should show loading state', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 0,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('should show "Add Credits" button when balance is low (<5)', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 3,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance />)

      expect(screen.getByText('Add Credits')).toBeInTheDocument()
    })

    it('should NOT show "Add Credits" button when balance is sufficient', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 10,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance />)

      expect(screen.queryByText('Add Credits')).not.toBeInTheDocument()
    })

    it('should hide "Add Credits" button when showPurchaseButton is false', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 3,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance showPurchaseButton={false} />)

      expect(screen.queryByText('Add Credits')).not.toBeInTheDocument()
    })
  })

  describe('Compact Variant', () => {
    it('should render compact layout', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 15,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      const { container } = render(<CreditBalance variant="compact" />)

      expect(screen.getByText('15')).toBeInTheDocument()
      // Compact variant should have specific styling
      expect(container.firstChild).toHaveClass('flex')
    })
  })

  describe('Detailed Variant', () => {
    it('should render detailed layout with label', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 25,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance variant="detailed" />)

      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText(/credits/i)).toBeInTheDocument()
    })
  })

  describe('Animations', () => {
    it('should apply animation classes when animate is true', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 8,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance animate={true} />)

      const balanceElement = screen.getByText('8')
      expect(balanceElement).toHaveClass('transition-all')
      expect(balanceElement).toHaveClass('duration-300')
    })

    it('should NOT apply animation classes when animate is false', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 8,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<CreditBalance animate={false} />)

      const balanceElement = screen.getByText('8')
      expect(balanceElement).not.toHaveClass('transition-all')
    })
  })

  describe('Error Handling', () => {
    it('should display error message when hook returns error', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 0,
        isLoading: false,
        error: 'Failed to load credits',
        refetch: vi.fn(),
      })

      render(<CreditBalance />)

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      vi.mocked(useCreditBalanceModule.useCreditBalance).mockReturnValue({
        balance: 12,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      const { container } = render(<CreditBalance />)

      const balanceContainer = container.querySelector('[aria-label]')
      expect(balanceContainer).toHaveAttribute('aria-label', expect.stringContaining('credit'))
    })
  })
})
