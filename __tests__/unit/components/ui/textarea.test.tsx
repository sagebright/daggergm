import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('should render textarea element', () => {
    const { container } = render(<Textarea />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('should apply className prop', () => {
    const { container } = render(<Textarea className="custom-class" />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('custom-class')
  })

  it('should forward ref', () => {
    const ref = { current: null }
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('should apply placeholder', () => {
    const { container } = render(<Textarea placeholder="Enter text" />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveAttribute('placeholder', 'Enter text')
  })
})
