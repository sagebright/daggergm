import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { MarkdownEditor } from '@/components/features/markdown-editor'

describe('MarkdownEditor', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with initial value', () => {
    render(
      <MarkdownEditor
        value="# Initial Content"
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    )

    expect(screen.getByDisplayValue('# Initial Content')).toBeInTheDocument()
  })

  it('should show placeholder when empty', () => {
    render(<MarkdownEditor value="" onChange={mockOnChange} placeholder="Enter content..." />)

    expect(screen.getByPlaceholderText('Enter content...')).toBeInTheDocument()
  })

  it('should call onChange when typing', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="" onChange={mockOnChange} placeholder="Enter content..." />)

    const editor = screen.getByRole('textbox')
    await user.type(editor, 'New text')

    // onChange is called for each character
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
      expect(mockOnChange).toHaveBeenCalledTimes(8) // "New text" is 8 characters
    })
  })

  it('should support markdown shortcuts', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="" onChange={mockOnChange} placeholder="Enter content..." />)

    const editor = screen.getByRole('textbox')

    // Bold shortcut (Cmd+B)
    await user.click(editor)
    await user.keyboard('{Meta>}b{/Meta}')

    // Should insert bold markers
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('****'))
    })
  })

  it('should handle tab for indentation', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="Line 1" onChange={mockOnChange} placeholder="Enter content..." />)

    const editor = screen.getByRole('textbox')
    await user.click(editor)
    await user.keyboard('{Tab}')

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('  '))
    })
  })

  it('should resize automatically with content', async () => {
    const { rerender } = render(
      <MarkdownEditor value="" onChange={mockOnChange} placeholder="Enter content..." />,
    )

    const editor = screen.getByRole('textbox') as HTMLTextAreaElement

    // Add multiple lines
    const longContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
    rerender(
      <MarkdownEditor value={longContent} onChange={mockOnChange} placeholder="Enter content..." />,
    )

    // Style should be updated
    expect(editor.style.height).toBeTruthy()
  })

  it('should be accessible', () => {
    render(
      <MarkdownEditor
        value=""
        onChange={mockOnChange}
        placeholder="Enter content..."
        ariaLabel="Movement content editor"
      />,
    )

    expect(screen.getByLabelText('Movement content editor')).toBeInTheDocument()
  })
})
