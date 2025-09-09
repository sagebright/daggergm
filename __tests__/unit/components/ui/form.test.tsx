import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
  useFormContext: vi.fn(() => ({
    getFieldState: vi.fn(() => ({})),
  })),
  useFormState: vi.fn(() => ({})),
  Controller: ({
    render: renderProp,
  }: {
    render: (props: {
      field: { name: string; value: string; onChange: ReturnType<typeof vi.fn> }
      fieldState: { error: null }
    }) => React.ReactNode
  }) => {
    const field = { name: 'test', value: '', onChange: vi.fn() }
    const fieldState = { error: null }
    return renderProp({ field, fieldState })
  },
  FormProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-provider">{children}</div>
  ),
}))

// Mock radix-ui components
vi.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <label {...props}>{children}</label>
  ),
}))

vi.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children }: { children: React.ReactNode }) => <div data-testid="slot">{children}</div>,
}))

// Setup mock form before tests
beforeEach(() => {
  const mockForm = {
    control: {
      _subjects: {},
      _removeUnmounted: vi.fn(),
      _names: {},
      _state: {},
      _defaultValues: {},
      _getWatch: vi.fn(),
      _reset: vi.fn(),
      _options: {},
      _getDirty: vi.fn(),
      _proxyFormState: {},
      _getFieldArray: vi.fn(),
      _executeSchema: vi.fn(),
      _getIsDirty: vi.fn(),
      register: vi.fn(),
      unregister: vi.fn(),
      getFieldState: vi.fn(),
      _updateValid: vi.fn(),
      _updateFieldArray: vi.fn(),
      _updateDisabledField: vi.fn(),
      _fields: {},
      _formValues: {},
      _stateFlags: {},
    },
    getFieldState: vi.fn(() => ({
      invalid: false,
      isDirty: false,
      isTouched: false,
      isValidating: false,
      error: undefined,
    })),
    formState: { 
      errors: {},
      isDirty: false,
      isLoading: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      touchedFields: {},
      dirtyFields: {},
      defaultValues: {},
      submitCount: 0,
      disabled: false,
      validatingFields: {},
      isReady: true,
    },
    watch: vi.fn(),
    getValues: vi.fn(),
    setValue: vi.fn(),
    clearErrors: vi.fn(),
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    resetField: vi.fn(),
    setFocus: vi.fn(),
    trigger: vi.fn(),
    setError: vi.fn(),
    unregister: vi.fn(),
    register: vi.fn(),
    subscribe: vi.fn(),
    _subjects: {},
    _state: {},
  } as any
  
  vi.mocked(useForm).mockReturnValue(mockForm)
})

// Test wrapper component
function TestFormWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm()
  return <Form {...form}>{children}</Form>
}

describe('Form Components', () => {
  describe('Form', () => {
    it('should render FormProvider', () => {
      render(<TestFormWrapper>Test content</TestFormWrapper>)

      const provider = screen.getByTestId('form-provider')
      expect(provider).toBeInTheDocument()
      expect(provider).toHaveTextContent('Test content')
    })
  })

  describe('FormField', () => {
    it('should render Controller with field context', () => {
      render(
        <TestFormWrapper>
          <FormField
            name="test"
            render={({ field }) => <input data-testid="form-field" {...field} />}
          />
        </TestFormWrapper>,
      )

      const field = screen.getByTestId('form-field')
      expect(field).toBeInTheDocument()
    })
  })

  describe('FormItem', () => {
    it('should render with data-slot attribute', () => {
      render(<FormItem data-testid="form-item">Item content</FormItem>)

      const item = screen.getByTestId('form-item')
      expect(item).toBeInTheDocument()
      expect(item).toHaveAttribute('data-slot', 'form-item')
      expect(item).toHaveTextContent('Item content')
    })
  })

  describe('FormLabel', () => {
    it('should render with data-slot attribute', () => {
      render(
        <TestFormWrapper>
          <FormItem>
            <FormLabel data-testid="form-label">Label text</FormLabel>
          </FormItem>
        </TestFormWrapper>,
      )

      const label = screen.getByTestId('form-label')
      expect(label).toBeInTheDocument()
      expect(label).toHaveAttribute('data-slot', 'form-label')
      expect(label).toHaveTextContent('Label text')
    })
  })

  describe('FormControl', () => {
    it('should render as Slot', () => {
      render(
        <TestFormWrapper>
          <FormItem>
            <FormControl>
              <input data-testid="form-control" />
            </FormControl>
          </FormItem>
        </TestFormWrapper>,
      )

      const slot = screen.getByTestId('slot')
      const control = screen.getByTestId('form-control')

      expect(slot).toBeInTheDocument()
      expect(control).toBeInTheDocument()
    })
  })

  describe('FormDescription', () => {
    it('should render with data-slot attribute', () => {
      render(
        <TestFormWrapper>
          <FormItem>
            <FormDescription data-testid="form-description">Description text</FormDescription>
          </FormItem>
        </TestFormWrapper>,
      )

      const description = screen.getByTestId('form-description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute('data-slot', 'form-description')
      expect(description).toHaveTextContent('Description text')
    })
  })

  describe('FormMessage', () => {
    it('should render error message when present', () => {
      render(
        <TestFormWrapper>
          <FormItem>
            <FormMessage data-testid="form-message">Error message</FormMessage>
          </FormItem>
        </TestFormWrapper>,
      )

      const message = screen.getByTestId('form-message')
      expect(message).toBeInTheDocument()
      expect(message).toHaveAttribute('data-slot', 'form-message')
    })
  })
})
