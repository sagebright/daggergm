import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import DashboardPage from '@/app/dashboard/page'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('DashboardPage', () => {
  const mockSupabaseClient = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient)
  })

  describe('authentication', () => {
    it('should redirect to login if user is not authenticated', async () => {
      ;(mockSupabaseClient.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { user: null },
      })

      // Mock redirect to throw so we can catch it
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error('REDIRECT')
      })

      await expect(DashboardPage()).rejects.toThrow('REDIRECT')
      expect(redirect).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('authenticated user with no adventures', () => {
    beforeEach(() => {
      ;(mockSupabaseClient.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
          },
        },
      })

      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }

      mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'adventures') {
          return {
            ...mockSelect,
            order: vi.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'user_profiles') {
          return {
            ...mockSelect,
            single: vi.fn().mockResolvedValue({ data: { credits: 5 } }),
          }
        }
        return mockSelect
      })
    })

    it('should render dashboard with no adventures message', async () => {
      const result = await DashboardPage()

      render(result)

      expect(screen.getByText('Your Adventures')).toBeInTheDocument()
      expect(screen.getByText('Credits remaining: 5')).toBeInTheDocument()
      expect(screen.getByText("You haven't created any adventures yet.")).toBeInTheDocument()
      expect(screen.getByText('Generate Your First Adventure')).toBeInTheDocument()
    })

    it('should have links to create new adventures', async () => {
      const result = await DashboardPage()

      render(result)

      const newAdventureButtons = screen.getAllByRole('link')
      const adventureLinks = newAdventureButtons.filter(
        (link) => link.getAttribute('href') === '/adventures/new',
      )

      expect(adventureLinks).toHaveLength(2) // Header button and first adventure button
    })

    it('should show zero credits when profile has no credits', async () => {
      mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'adventures') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { credits: null } }),
          }
        }
      })

      const result = await DashboardPage()
      render(result)

      expect(screen.getByText('Credits remaining: 0')).toBeInTheDocument()
    })
  })

  describe('authenticated user with adventures', () => {
    beforeEach(() => {
      ;(mockSupabaseClient.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
          },
        },
      })

      const mockAdventures = [
        {
          id: 'adv-1',
          title: 'The Cursed Forest',
          frame: 'Witherwild',
          state: 'draft',
        },
        {
          id: 'adv-2',
          title: 'Temple of Shadows',
          frame: 'Custom',
          state: 'completed',
        },
      ]

      mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'adventures') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAdventures }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { credits: 3 } }),
          }
        }
      })
    })

    it('should render adventures list', async () => {
      const result = await DashboardPage()
      render(result)

      expect(screen.getByText('The Cursed Forest')).toBeInTheDocument()
      expect(screen.getByText('Temple of Shadows')).toBeInTheDocument()
      expect(screen.getByText('Frame: Witherwild')).toBeInTheDocument()
      expect(screen.getByText('Frame: Custom')).toBeInTheDocument()
      expect(screen.getByText('Status: draft')).toBeInTheDocument()
      expect(screen.getByText('Status: completed')).toBeInTheDocument()
    })

    it('should have links to individual adventures', async () => {
      const result = await DashboardPage()
      render(result)

      const adventureLinks = screen.getAllByRole('link')
      const adventureDetailLinks = adventureLinks.filter((link) => {
        const href = link.getAttribute('href')
        return href?.startsWith('/adventures/') && href !== '/adventures/new'
      })

      expect(adventureDetailLinks).toHaveLength(2)
      expect(adventureDetailLinks[0]).toHaveAttribute('href', '/adventures/adv-1')
      expect(adventureDetailLinks[1]).toHaveAttribute('href', '/adventures/adv-2')
    })

    it('should display credits correctly', async () => {
      const result = await DashboardPage()
      render(result)

      expect(screen.getByText('Credits remaining: 3')).toBeInTheDocument()
    })

    it('should not show no adventures message', async () => {
      const result = await DashboardPage()
      render(result)

      expect(screen.queryByText("You haven't created any adventures yet.")).not.toBeInTheDocument()
    })
  })

  describe('database queries', () => {
    beforeEach(() => {
      ;(mockSupabaseClient.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
          },
        },
      })
    })

    it('should query adventures with correct parameters', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
      })

      const mockFromProfiles = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { credits: 5 } }),
      })

      mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'adventures') {
          return mockFrom(table)
        }
        return mockFromProfiles(table)
      })

      await DashboardPage()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('adventures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })
  })
})
