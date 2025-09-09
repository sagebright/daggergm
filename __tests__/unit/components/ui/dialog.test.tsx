import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// Mock radix dialog primitives
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({
    children,
    'data-slot': dataSlot,
    ...props
  }: {
    children: React.ReactNode
    'data-slot'?: string
    [key: string]: unknown
  }) => (
    <div data-slot={dataSlot} data-testid="dialog-root" {...props}>
      {children}
    </div>
  ),
  Trigger: ({
    children,
    'data-slot': dataSlot,
    ...props
  }: {
    children: React.ReactNode
    'data-slot'?: string
    [key: string]: unknown
  }) => (
    <button data-slot={dataSlot} data-testid="dialog-trigger" {...props}>
      {children}
    </button>
  ),
  Portal: ({
    children,
    'data-slot': dataSlot,
    ...props
  }: {
    children: React.ReactNode
    'data-slot'?: string
    [key: string]: unknown
  }) => (
    <div data-slot={dataSlot} data-testid="dialog-portal" {...props}>
      {children}
    </div>
  ),
  Close: ({
    children,
    'data-slot': dataSlot,
    ...props
  }: {
    children: React.ReactNode
    'data-slot'?: string
    [key: string]: unknown
  }) => (
    <button data-slot={dataSlot} data-testid="dialog-close" {...props}>
      {children}
    </button>
  ),
  Overlay: ({
    className,
    'data-slot': dataSlot,
    ...props
  }: {
    className?: string
    'data-slot'?: string
    [key: string]: unknown
  }) => <div data-slot={dataSlot} className={className} data-testid="dialog-overlay" {...props} />,
  Content: ({
    className,
    children,
    'data-slot': dataSlot,
    ...props
  }: {
    className?: string
    children: React.ReactNode
    'data-slot'?: string
    [key: string]: unknown
  }) => (
    <div data-slot={dataSlot} className={className} data-testid="dialog-content" {...props}>
      {children}
    </div>
  ),
  Title: ({
    className,
    'data-slot': dataSlot,
    ...props
  }: {
    className?: string
    'data-slot'?: string
    [key: string]: unknown
  }) => <h2 data-slot={dataSlot} className={className} data-testid="dialog-title" {...props} />,
  Description: ({
    className,
    'data-slot': dataSlot,
    ...props
  }: {
    className?: string
    'data-slot'?: string
    [key: string]: unknown
  }) => (
    <p data-slot={dataSlot} className={className} data-testid="dialog-description" {...props} />
  ),
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  XIcon: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="x-icon" {...props} />
  ),
}))

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('should render with data-slot attribute', () => {
      render(<Dialog open={false}>content</Dialog>)

      const dialog = screen.getByTestId('dialog-root')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('data-slot', 'dialog')
    })
  })

  describe('DialogTrigger', () => {
    it('should render with data-slot attribute', () => {
      render(<DialogTrigger>Open Dialog</DialogTrigger>)

      const trigger = screen.getByTestId('dialog-trigger')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('data-slot', 'dialog-trigger')
      expect(trigger).toHaveTextContent('Open Dialog')
    })
  })

  describe('DialogPortal', () => {
    it('should render with data-slot attribute', () => {
      render(<DialogPortal>Portal content</DialogPortal>)

      const portal = screen.getByTestId('dialog-portal')
      expect(portal).toBeInTheDocument()
      expect(portal).toHaveAttribute('data-slot', 'dialog-portal')
    })
  })

  describe('DialogClose', () => {
    it('should render with data-slot attribute', () => {
      render(<DialogClose>Close</DialogClose>)

      const close = screen.getByTestId('dialog-close')
      expect(close).toBeInTheDocument()
      expect(close).toHaveAttribute('data-slot', 'dialog-close')
    })
  })

  describe('DialogOverlay', () => {
    it('should render with default classes and data-slot', () => {
      render(<DialogOverlay />)

      const overlay = screen.getByTestId('dialog-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveAttribute('data-slot', 'dialog-overlay')
    })

    it('should accept custom className', () => {
      render(<DialogOverlay className="custom-overlay" />)

      const overlay = screen.getByTestId('dialog-overlay')
      expect(overlay).toHaveClass('custom-overlay')
    })
  })

  describe('DialogContent', () => {
    it('should render with default close button', () => {
      render(<DialogContent>Content</DialogContent>)

      const content = screen.getByTestId('dialog-content')
      const closeButton = screen.getByTestId('dialog-close')
      const xIcon = screen.getByTestId('x-icon')

      expect(content).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
      expect(xIcon).toBeInTheDocument()
    })

    it('should hide close button when showCloseButton is false', () => {
      render(<DialogContent showCloseButton={false}>Content</DialogContent>)

      const content = screen.getByTestId('dialog-content')
      expect(content).toBeInTheDocument()
      expect(screen.queryByTestId('dialog-close')).not.toBeInTheDocument()
    })
  })

  describe('DialogHeader', () => {
    it('should render with correct classes', () => {
      render(<DialogHeader data-testid="dialog-header">Header</DialogHeader>)

      const header = screen.getByTestId('dialog-header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveAttribute('data-slot', 'dialog-header')
    })
  })

  describe('DialogTitle', () => {
    it('should render with correct classes', () => {
      render(<DialogTitle>Dialog Title</DialogTitle>)

      const title = screen.getByTestId('dialog-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveAttribute('data-slot', 'dialog-title')
      expect(title).toHaveTextContent('Dialog Title')
    })
  })

  describe('DialogDescription', () => {
    it('should render with correct classes', () => {
      render(<DialogDescription>Dialog description</DialogDescription>)

      const description = screen.getByTestId('dialog-description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute('data-slot', 'dialog-description')
      expect(description).toHaveTextContent('Dialog description')
    })
  })

  describe('DialogFooter', () => {
    it('should render with correct classes', () => {
      render(<DialogFooter data-testid="dialog-footer">Footer</DialogFooter>)

      const footer = screen.getByTestId('dialog-footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveAttribute('data-slot', 'dialog-footer')
    })
  })
})
