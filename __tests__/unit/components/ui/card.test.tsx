import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'

// We need to import the private CardAction component for testing
// Since it's not exported, we'll need to test it indirectly or mock it
describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default classes', () => {
      render(<Card data-testid="card">Test card</Card>)

      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('data-slot', 'card')
    })

    it('should accept custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Test card
        </Card>,
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('CardHeader', () => {
    it('should render with correct classes and data-slot', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>)

      const header = screen.getByTestId('card-header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveAttribute('data-slot', 'card-header')
      expect(header).toHaveTextContent('Header content')
    })

    it('should render with action element', () => {
      render(
        <CardHeader data-testid="card-header">
          <div data-slot="card-action" data-testid="card-action">
            Action
          </div>
          Header content
        </CardHeader>,
      )

      const header = screen.getByTestId('card-header')
      const action = screen.getByTestId('card-action')

      expect(header).toBeInTheDocument()
      expect(action).toBeInTheDocument()
      expect(action).toHaveAttribute('data-slot', 'card-action')
    })
  })

  describe('CardTitle', () => {
    it('should render with correct classes', () => {
      render(<CardTitle data-testid="card-title">Title text</CardTitle>)

      const title = screen.getByTestId('card-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveAttribute('data-slot', 'card-title')
      expect(title).toHaveTextContent('Title text')
    })
  })

  describe('CardDescription', () => {
    it('should render with correct classes', () => {
      render(<CardDescription data-testid="card-description">Description text</CardDescription>)

      const description = screen.getByTestId('card-description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute('data-slot', 'card-description')
      expect(description).toHaveTextContent('Description text')
    })
  })

  describe('CardContent', () => {
    it('should render with correct classes', () => {
      render(<CardContent data-testid="card-content">Content text</CardContent>)

      const content = screen.getByTestId('card-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveAttribute('data-slot', 'card-content')
      expect(content).toHaveTextContent('Content text')
    })
  })

  describe('CardFooter', () => {
    it('should render with correct classes', () => {
      render(<CardFooter data-testid="card-footer">Footer content</CardFooter>)

      const footer = screen.getByTestId('card-footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveAttribute('data-slot', 'card-footer')
      expect(footer).toHaveTextContent('Footer content')
    })
  })

  describe('CardAction', () => {
    it('should render with correct classes and data-slot', () => {
      render(<CardAction data-testid="card-action">Action content</CardAction>)

      const action = screen.getByTestId('card-action')
      expect(action).toBeInTheDocument()
      expect(action).toHaveAttribute('data-slot', 'card-action')
      expect(action).toHaveTextContent('Action content')
    })

    it('should accept custom className', () => {
      render(
        <CardAction className="custom-action" data-testid="card-action">
          Action
        </CardAction>,
      )

      const action = screen.getByTestId('card-action')
      expect(action).toHaveClass('custom-action')
    })
  })

  describe('Full Card Structure', () => {
    it('should render complete card with all components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader data-testid="full-header">
            <CardTitle data-testid="full-title">Card Title</CardTitle>
            <CardDescription data-testid="full-description">Card description text</CardDescription>
          </CardHeader>
          <CardContent data-testid="full-content">
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter data-testid="full-footer">
            <button>Action Button</button>
          </CardFooter>
        </Card>,
      )

      expect(screen.getByTestId('full-card')).toBeInTheDocument()
      expect(screen.getByTestId('full-header')).toBeInTheDocument()
      expect(screen.getByTestId('full-title')).toBeInTheDocument()
      expect(screen.getByTestId('full-description')).toBeInTheDocument()
      expect(screen.getByTestId('full-content')).toBeInTheDocument()
      expect(screen.getByTestId('full-footer')).toBeInTheDocument()

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description text')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
    })
  })
})
