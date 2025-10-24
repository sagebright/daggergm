import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { exportAdventure } from '@/app/actions/export'
import { ExportDialog } from '@/components/features/export-dialog'

vi.mock('@/app/actions/export', () => ({
  exportAdventure: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock window.open and URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('ExportDialog', () => {
  const mockOnClose = vi.fn()
  const mockAdventureId = 'adv-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render export format options', () => {
    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    expect(screen.getByText('Export Adventure')).toBeInTheDocument()
    expect(screen.getByText('Choose your export format')).toBeInTheDocument()

    expect(screen.getByText('Markdown')).toBeInTheDocument()
    expect(screen.getByText('PDF Document')).toBeInTheDocument()
    expect(screen.getByText('Roll20')).toBeInTheDocument()
  })

  it('should show format descriptions', () => {
    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    expect(screen.getByText('Plain text format for easy editing')).toBeInTheDocument()
    expect(screen.getByText('Professional PDF for printing')).toBeInTheDocument()
    expect(screen.getByText('Import directly into Roll20')).toBeInTheDocument()
  })

  it('should handle markdown export', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['# Adventure Content'], { type: 'text/markdown' })

    vi.mocked(exportAdventure).mockResolvedValueOnce({
      success: true,
      data: mockBlob,
      filename: 'adventure.md',
    })

    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    // Click markdown option
    await user.click(screen.getByText('Markdown'))

    expect(exportAdventure).toHaveBeenCalledWith(mockAdventureId, 'markdown')

    // Wait for download to trigger
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    })

    expect(toast.success).toHaveBeenCalledWith('Adventure exported successfully!')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle PDF export', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' })

    vi.mocked(exportAdventure).mockResolvedValueOnce({
      success: true,
      data: mockBlob,
      filename: 'adventure.pdf',
    })

    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    await user.click(screen.getByText('PDF Document'))

    expect(exportAdventure).toHaveBeenCalledWith(mockAdventureId, 'pdf')

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    })
  })

  it('should show loading state during export', async () => {
    const user = userEvent.setup()

    // Mock a slow export
    vi.mocked(exportAdventure).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return {
        success: true,
        data: new Blob(['content']),
        filename: 'adventure.md',
      }
    })

    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    await user.click(screen.getByText('Markdown'))

    // Should show loading state (wait for async state update)
    expect(await screen.findByText('Exporting...')).toBeInTheDocument()

    // Buttons should be disabled
    expect(screen.getByText('PDF Document').closest('button')).toBeDisabled()
    expect(screen.getByText('Roll20').closest('button')).toBeDisabled()

    // Wait for export to complete
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should handle export errors', async () => {
    const user = userEvent.setup()

    vi.mocked(exportAdventure).mockResolvedValueOnce({
      success: false,
      error: 'Export failed: Server error',
    })

    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    await user.click(screen.getByText('Markdown'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Export failed: Server error')
    })

    // Dialog should not close on error
    expect(mockOnClose).not.toHaveBeenCalled()

    // Should not be in loading state
    expect(screen.queryByText('Exporting...')).not.toBeInTheDocument()
  })

  it('should clean up blob URL after download', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['content'])

    vi.mocked(exportAdventure).mockResolvedValueOnce({
      success: true,
      data: mockBlob,
      filename: 'adventure.md',
    })

    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    await user.click(screen.getByText('Markdown'))

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled()
    })

    // Should revoke URL after a delay
    await waitFor(
      () => {
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      },
      { timeout: 2000 },
    )
  })

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup()

    render(<ExportDialog open={true} adventureId={mockAdventureId} onClose={mockOnClose} />)

    await user.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    render(<ExportDialog open={false} adventureId={mockAdventureId} onClose={mockOnClose} />)

    expect(screen.queryByText('Export Adventure')).not.toBeInTheDocument()
  })
})
