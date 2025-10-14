import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdventureDetailPage from '@/app/adventures/[id]/page'
import { getAdventure } from '@/app/actions/adventures'

vi.mock('@/app/actions/adventures', () => ({
  getAdventure: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockResolvedValue({ error: null }),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }),
  ),
}))

vi.mock('@/components/features/focus-mode', () => ({
  FocusMode: vi.fn(({ onExit }: { movements: unknown; onUpdate: unknown; onExit: () => void }) => (
    <div data-testid="focus-mode">
      Focus Mode
      <button onClick={onExit}>Exit</button>
    </div>
  )),
}))

describe('AdventureDetailPage', () => {
  const mockAdventure = {
    id: 'adv-123',
    title: 'The Lost Temple',
    frame: 'witherwild',
    focus: 'high_fantasy',
    state: 'draft',
    config: {},
    metadata: null,
    exported_at: null,
    guest_email: null,
    guest_token: null,
    user_id: 'user-123',
    movements: [
      {
        id: 'mov-1',
        title: 'The Journey Begins',
        type: 'exploration',
        content: 'The party sets out from the village...',
      },
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  it('should display adventure details when found', async () => {
    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure)

    render(<AdventureDetailPage params={Promise.resolve({ id: 'adv-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('The Lost Temple')).toBeInTheDocument()
    })
  })

  it('should show 404 when adventure not found', async () => {
    const { notFound } = await import('next/navigation')
    vi.mocked(getAdventure).mockResolvedValueOnce(null)

    vi.mocked(notFound).mockImplementation(() => {
      // Just track that it was called, don't actually throw
      return undefined as never
    })

    // Render the component
    render(<AdventureDetailPage params={Promise.resolve({ id: 'non-existent' })} />)

    // Wait for the notFound function to be called
    await waitFor(() => {
      expect(notFound).toHaveBeenCalled()
    })
  })

  it('should display movements list', async () => {
    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure)

    render(<AdventureDetailPage params={Promise.resolve({ id: 'adv-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('The Journey Begins')).toBeInTheDocument()
      expect(screen.getByText('The party sets out from the village...')).toBeInTheDocument()
    })
  })

  it('should show edit mode toggle for draft adventures', async () => {
    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure)

    render(<AdventureDetailPage params={Promise.resolve({ id: 'adv-123' })} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })
  })

  it('should display adventure metadata', async () => {
    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure)

    render(<AdventureDetailPage params={Promise.resolve({ id: 'adv-123' })} />)

    await waitFor(() => {
      expect(screen.getByText(/witherwild/i)).toBeInTheDocument()
      expect(screen.getByText(/high fantasy/i)).toBeInTheDocument()
    })
  })

  it('should enter focus mode when edit button clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure)

    render(<AdventureDetailPage params={Promise.resolve({ id: 'adv-123' })} />)

    // Wait for adventure to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    // Click edit button
    await user.click(screen.getByRole('button', { name: /edit/i }))

    // Should enter focus mode
    await waitFor(() => {
      expect(screen.getByTestId('focus-mode')).toBeInTheDocument()
    })
  })

  it('should exit focus mode when exit is triggered', async () => {
    const user = userEvent.setup()
    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure)

    render(<AdventureDetailPage params={Promise.resolve({ id: 'adv-123' })} />)

    // Enter focus mode
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByTestId('focus-mode')).toBeInTheDocument()

    // Exit focus mode
    await user.click(screen.getByText('Exit'))

    // Should return to normal view
    await waitFor(() => {
      expect(screen.queryByTestId('focus-mode')).not.toBeInTheDocument()
      expect(screen.getByText('The Lost Temple')).toBeInTheDocument()
    })
  })
})
