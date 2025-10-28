import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RegenerationConfirmDialog } from '@/features/focus-mode/components/RegenerationConfirmDialog'

describe('RegenerationConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render dialog with correct information', () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText(/Full adventure scaffold/i)).toBeInTheDocument()
    expect(screen.getByText(/7 regenerations remaining/i)).toBeInTheDocument()
    expect(screen.getByText(/FREE - No credits consumed/i)).toBeInTheDocument()
  })

  it('should show warning when <3 regenerations remain', () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="expansion"
        scope="Full scene (6 components)"
        remainingRegens={2}
        estimatedTime="~15-20 seconds"
      />,
    )

    expect(screen.getByText(/⚠️ Warning: Running low on regenerations/i)).toBeInTheDocument()
  })

  it('should call onConfirm when confirmed', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    const confirmButton = screen.getByRole('button', {
      name: /Confirm Regeneration/i,
    })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should save preference to localStorage when "Don\'t ask again" is checked', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    const checkbox = screen.getByLabelText(/Don't ask again/i)
    fireEvent.click(checkbox)

    const confirmButton = screen.getByRole('button', {
      name: /Confirm Regeneration/i,
    })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(localStorage.getItem('skip_regen_confirm_scaffold')).toBe('true')
    })
  })

  it('should close dialog when cancelled', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="expansion"
        scope="Combat mechanics only"
        remainingRegens={15}
        estimatedTime="~5-10 seconds"
      />,
    )

    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnConfirm).not.toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should handle keyboard navigation (Escape to cancel)', async () => {
    render(
      <RegenerationConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        type="scaffold"
        scope="Full adventure scaffold"
        remainingRegens={7}
        estimatedTime="~10-15 seconds"
      />,
    )

    const dialog = screen.getByRole('alertdialog')
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
