import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  Toaster: ({
    className,
    theme,
    style,
    ...props
  }: {
    className?: string
    theme?: string
    style?: React.CSSProperties
    [key: string]: unknown
  }) => (
    <div
      data-testid="sonner-toaster"
      data-theme={theme}
      className={className}
      style={style}
      {...props}
    />
  ),
}))

describe('Toaster Component', () => {
  it('should render with correct theme and classes', () => {
    render(<Toaster />)

    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster).toBeInTheDocument()
    expect(toaster).toHaveAttribute('data-theme', 'light')
    expect(toaster).toHaveClass('toaster', 'group')
  })

  it('should apply custom CSS variables', () => {
    render(<Toaster />)

    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster).toHaveStyle({
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
    })
  })

  it('should forward props to Sonner', () => {
    render(<Toaster position="top-right" />)

    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster).toHaveAttribute('position', 'top-right')
  })
})
