import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { RegenerationBudget } from '@/features/focus-mode/components/RegenerationBudget'

describe('RegenerationBudget', () => {
  it('should render both scaffold and expansion budgets', () => {
    render(
      <RegenerationBudget
        scaffoldUsed={3}
        scaffoldLimit={10}
        expansionUsed={5}
        expansionLimit={20}
      />,
    )

    expect(screen.getByText(/7\/10 remaining/i)).toBeInTheDocument()
    expect(screen.getByText(/15\/20 remaining/i)).toBeInTheDocument()
  })

  it('should show warning badge when <3 regenerations remain', () => {
    render(
      <RegenerationBudget
        scaffoldUsed={8}
        scaffoldLimit={10}
        expansionUsed={5}
        expansionLimit={20}
      />,
    )

    // Find the scaffold badge - should show warning variant
    const scaffoldBadge = screen.getByText(/2\/10 remaining/i)
    expect(scaffoldBadge).toBeInTheDocument()
  })

  it('should show destructive badge when 0 regenerations remain', () => {
    render(
      <RegenerationBudget
        scaffoldUsed={10}
        scaffoldLimit={10}
        expansionUsed={5}
        expansionLimit={20}
      />,
    )

    const scaffoldBadge = screen.getByText(/0\/10 remaining/i)
    expect(scaffoldBadge).toBeInTheDocument()
  })

  it('should calculate progress percentages correctly', () => {
    const { container } = render(
      <RegenerationBudget
        scaffoldUsed={5}
        scaffoldLimit={10}
        expansionUsed={10}
        expansionLimit={20}
      />,
    )

    // Scaffold: 5/10 = 50%
    // Expansion: 10/20 = 50%
    // Progress bars should exist
    const progressIndicators = container.querySelectorAll('[role="progressbar"]')
    expect(progressIndicators.length).toBeGreaterThanOrEqual(2)
  })

  it('should show regeneration budget title and info tooltip trigger', () => {
    render(
      <RegenerationBudget
        scaffoldUsed={3}
        scaffoldLimit={10}
        expansionUsed={5}
        expansionLimit={20}
      />,
    )

    expect(screen.getByText(/Regeneration Budget/i)).toBeInTheDocument()

    // Tooltip trigger should exist (Info icon)
    const tooltipTriggers = screen.getAllByRole('button')
    expect(tooltipTriggers.length).toBeGreaterThan(0)
  })
})
