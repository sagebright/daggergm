import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { FocusMode } from '@/components/features/focus-mode'
import { useHotkeys } from '@/lib/hooks/use-hotkeys'

// Mock dependencies
vi.mock('@/lib/hooks/use-hotkeys', () => ({
  useHotkeys: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/features/markdown-editor', () => ({
  MarkdownEditor: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string
    onChange: (value: string) => void
    ariaLabel: string
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    }
    return (
      <textarea
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        data-testid="markdown-editor"
      />
    )
  },
}))

vi.mock('@/components/features/ai-chat', () => ({
  AIChat: ({
    movement,
    onSuggestionApply,
  }: {
    movement: { title: string }
    adventureId: string
    onSuggestionApply: (suggestion: string) => void
  }) => (
    <div data-testid="ai-chat-component">
      AI Chat Panel for {movement.title}
      <button onClick={() => onSuggestionApply('Test suggestion')}>Apply</button>
    </div>
  ),
}))

describe('FocusMode', () => {
  const mockMovements = [
    {
      id: 'mov-1',
      title: 'The Journey Begins',
      type: 'exploration',
      content: 'The party sets out from the village...',
      estimatedTime: '30 minutes',
    },
    {
      id: 'mov-2',
      title: 'Ambush at the Crossroads',
      type: 'combat',
      content: 'Bandits spring from the bushes...',
      estimatedTime: '45 minutes',
    },
    {
      id: 'mov-3',
      title: 'The Mysterious Merchant',
      type: 'social',
      content: 'A cloaked figure approaches with a deal...',
      estimatedTime: '20 minutes',
    },
  ]

  const mockOnUpdate = vi.fn()
  const mockOnExit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('movement display', () => {
    it('should render all movements in collapsed state initially', () => {
      render(
        <FocusMode
          movements={mockMovements}
          adventureId="test-adventure-id"
          adventureState="draft"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // All movements should be visible
      expect(screen.getByText('The Journey Begins')).toBeInTheDocument()
      expect(screen.getByText('Ambush at the Crossroads')).toBeInTheDocument()
      expect(screen.getByText('The Mysterious Merchant')).toBeInTheDocument()

      // Movement metadata should be visible
      expect(screen.getByText('exploration • 30 minutes')).toBeInTheDocument()
      expect(screen.getByText('combat • 45 minutes')).toBeInTheDocument()
      expect(screen.getByText('social • 20 minutes')).toBeInTheDocument()

      // Content should not be visible in collapsed state
      expect(screen.queryByText('The party sets out from the village...')).not.toBeInTheDocument()
    })

    it('should expand movement when clicked', async () => {
      const user = userEvent.setup()
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Click on first movement
      await user.click(screen.getByText('The Journey Begins'))

      // Should show content editor
      await waitFor(() => {
        expect(screen.getByText('The party sets out from the village...')).toBeInTheDocument()
      })

      // Other movements should be dimmed (opacity reduced)
      const movementCards = screen.getAllByTestId(/movement-card/)
      expect(movementCards[1]).toHaveStyle({ opacity: '0.3' })
      expect(movementCards[2]).toHaveStyle({ opacity: '0.3' })
    })

    it('should collapse other movements when one is focused', async () => {
      const user = userEvent.setup()
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Expand first movement
      await user.click(screen.getByText('The Journey Begins'))
      expect(screen.getByText('The party sets out from the village...')).toBeInTheDocument()

      // Click second movement
      await user.click(screen.getByText('Ambush at the Crossroads'))

      // First should collapse, second should expand
      await waitFor(() => {
        expect(screen.queryByText('The party sets out from the village...')).not.toBeInTheDocument()
        expect(screen.getByText('Bandits spring from the bushes...')).toBeInTheDocument()
      })
    })
  })

  describe('content editing', () => {
    it('should allow editing movement content', async () => {
      const user = userEvent.setup()
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Expand movement
      await user.click(screen.getByText('The Journey Begins'))

      // Find and edit content
      const editor = screen.getByRole('textbox', { name: /movement content/i })
      await user.clear(editor)
      await user.type(editor, 'New content for the movement')

      // Should trigger update after debounce
      await waitFor(
        () => {
          expect(mockOnUpdate).toHaveBeenCalled()
        },
        { timeout: 1500 },
      )

      // Check that it was called with the movement id
      expect(mockOnUpdate).toHaveBeenCalledWith(
        'mov-1',
        expect.objectContaining({
          content: expect.any(String),
        }),
      )
    })

    it('should debounce content updates', async () => {
      const user = userEvent.setup()

      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Click to focus and expand the movement
      const movementCard = screen.getByTestId('movement-card-mov-1')
      await user.click(movementCard)

      // Wait for the content to be visible (movement expanded)
      await waitFor(() => {
        expect(screen.getByText('The party sets out from the village...')).toBeInTheDocument()
      })

      // Now find the editor
      const editor = screen.getByLabelText('Movement content editor')

      // Clear any previous calls from focusing
      mockOnUpdate.mockClear()

      // Type multiple characters rapidly
      await user.type(editor, 'ABC')

      // Should not be called immediately
      expect(mockOnUpdate).not.toHaveBeenCalled()

      // Wait for debounce to trigger (500ms delay + some buffer)
      await waitFor(
        () => {
          expect(mockOnUpdate).toHaveBeenCalledTimes(1)
        },
        { timeout: 1500 },
      )

      // Verify it was called with the correct parameters
      expect(mockOnUpdate).toHaveBeenCalledWith(
        'mov-1',
        expect.objectContaining({
          content: expect.stringContaining('ABC'),
        }),
      )
    })
  })

  describe('keyboard shortcuts', () => {
    it('should register hotkeys on mount', () => {
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      expect(useHotkeys).toHaveBeenCalledWith('escape', expect.any(Function))
      expect(useHotkeys).toHaveBeenCalledWith('cmd+k', expect.any(Function))
    })

    it('should unfocus movement on escape when focused', async () => {
      const escapeHandler = vi.fn()
      vi.mocked(useHotkeys).mockImplementation((key, handler) => {
        if (key === 'escape') {
          escapeHandler.mockImplementation(handler)
        }
      })

      const user = userEvent.setup()
      const { rerender } = render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Focus a movement
      await user.click(screen.getByText('The Journey Begins'))
      expect(screen.getByText('The party sets out from the village...')).toBeInTheDocument()

      // Trigger escape
      act(() => {
        escapeHandler()
      })

      // Force re-render to see state change
      rerender(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Should unfocus
      await waitFor(() => {
        expect(screen.queryByText('The party sets out from the village...')).not.toBeInTheDocument()
      })
    })

    it('should exit focus mode on escape when no movement focused', () => {
      const escapeHandler = vi.fn()
      vi.mocked(useHotkeys).mockImplementation((key, handler) => {
        if (key === 'escape') {
          escapeHandler.mockImplementation(handler)
        }
      })

      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Trigger escape with no focus
      act(() => {
        escapeHandler()
      })

      expect(mockOnExit).toHaveBeenCalled()
    })
  })

  describe('AI panel integration', () => {
    it('should show AI panel when movement is focused', async () => {
      const user = userEvent.setup()
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Initially no AI panel
      expect(screen.queryByTestId('ai-chat-panel')).not.toBeInTheDocument()

      // Focus movement
      await user.click(screen.getByText('The Journey Begins'))

      // Should show AI panel
      await waitFor(() => {
        expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
      })
    })

    it('should hide AI panel when toggled with cmd+k', async () => {
      const cmdKHandler = vi.fn()
      vi.mocked(useHotkeys).mockImplementation((key, handler) => {
        if (key === 'cmd+k') {
          cmdKHandler.mockImplementation(handler)
        }
      })

      const user = userEvent.setup()
      const { rerender } = render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Focus movement to show panel
      await user.click(screen.getByText('The Journey Begins'))
      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()

      // Toggle panel
      act(() => {
        cmdKHandler()
      })

      rerender(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Should hide panel
      await waitFor(() => {
        expect(screen.queryByTestId('ai-chat-panel')).not.toBeInTheDocument()
      })
    })

    it('should add right padding to content when AI panel is open (Issue #4)', async () => {
      const user = userEvent.setup()
      render(
        <FocusMode
          movements={mockMovements}
          adventureId="test-adventure-id"
          adventureState="draft"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Get the movement list container
      const container = screen.getByTestId('focus-mode-container')
      const movementList = container.querySelector('.h-full.overflow-y-auto')
      expect(movementList).toBeInTheDocument()

      // Initially should have default padding
      expect(movementList).toHaveClass('pr-4')
      expect(movementList).not.toHaveClass('pr-[25rem]')

      // Focus movement to show panel
      await user.click(screen.getByText('The Journey Begins'))

      await waitFor(() => {
        expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
      })

      // Should have extra padding to prevent content from being covered
      expect(movementList).toHaveClass('pr-[25rem]')
      expect(movementList).not.toHaveClass('pr-4')
    })

    it('should remove extra padding when AI panel is closed', async () => {
      const cmdKHandler = vi.fn()
      vi.mocked(useHotkeys).mockImplementation((key, handler) => {
        if (key === 'cmd+k') {
          cmdKHandler.mockImplementation(handler)
        }
      })

      const user = userEvent.setup()
      const { rerender } = render(
        <FocusMode
          movements={mockMovements}
          adventureId="test-adventure-id"
          adventureState="draft"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      const container = screen.getByTestId('focus-mode-container')
      const movementList = container.querySelector('.h-full.overflow-y-auto')

      // Focus movement to show panel
      await user.click(screen.getByText('The Journey Begins'))

      await waitFor(() => {
        expect(movementList).toHaveClass('pr-[25rem]')
      })

      // Toggle panel off
      act(() => {
        cmdKHandler()
      })

      rerender(
        <FocusMode
          movements={mockMovements}
          adventureId="test-adventure-id"
          adventureState="draft"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // Should revert to default padding
      await waitFor(() => {
        expect(movementList).toHaveClass('pr-4')
        expect(movementList).not.toHaveClass('pr-[25rem]')
      })
    })
  })

  describe('exit functionality', () => {
    it('should show exit button', () => {
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument()
    })

    it('should call onExit when exit button clicked', async () => {
      const user = userEvent.setup()
      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      await user.click(screen.getByRole('button', { name: /exit/i }))

      expect(mockOnExit).toHaveBeenCalled()
    })
  })

  describe('responsive behavior', () => {
    it('should adapt layout for mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667

      render(
        <FocusMode
          adventureState="draft"
          movements={mockMovements}
          adventureId="test-adventure-id"
          onUpdate={mockOnUpdate}
          onExit={mockOnExit}
        />,
      )

      // AI panel should be full screen on mobile when shown
      const container = screen.getByTestId('focus-mode-container')
      expect(container).toHaveClass('relative', 'h-screen', 'overflow-hidden')
    })
  })
})
