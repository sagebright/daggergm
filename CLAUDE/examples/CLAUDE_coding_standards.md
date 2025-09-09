# 📋 Coding Standards & Principles

## 🎯 Universal Principles

### **Clarity Over Cleverness**

```javascript
// ❌ Clever but unclear
const p = c.reduce((a, v) => a + v.p * (v.s ? 0.8 : 0.7), 0)

// ✅ Clear and maintainable
const calculateTradeInValue = (cards, isStoreCredit) => {
  return cards.reduce((total, card) => {
    const rate = isStoreCredit ? 0.8 : 0.7
    return total + card.market_price * rate
  }, 0)
}
```

### **Fail Fast and Explicit**

```javascript
// ❌ Silent failure
const processCard = async (cardData) => {
  if (!cardData) return null
  // Processing...
}

// ✅ Explicit validation
const processCard = async (cardData) => {
  if (!cardData || !cardData.image) {
    throw new Error('Card data with image is required for processing')
  }

  if (!user?.tenant_id) {
    throw new Error('User tenant context required for card processing')
  }

  // Processing...
}
```

## 🏷️ Naming Conventions

### **Functions and Methods**

```javascript
// ✅ Verb + Noun pattern for actions
const getUserCards = async (userId, tenantId) => { ... };
const createQuote = async (quoteData) => { ... };
const validateCardData = (cardData) => { ... };
const processOcrResult = async (ocrData) => { ... };

// ✅ Boolean functions start with is/has/can
const isUserAuthenticated = (user) => !!user?.token;
const hasAdminAccess = (user) => user?.role === 'admin';
const canEditCard = (user, card) => card.created_by === user.id;

// ✅ Event handlers start with handle
const handleCardUpload = async (event) => { ... };
const handleQuoteSubmit = async (formData) => { ... };
const handleAuthError = (error) => { ... };
```

### **Variables and Constants**

```javascript
// ✅ Constants in UPPER_SNAKE_CASE
const MAX_FILE_SIZE_MB = 10
const CACHE_TTL_SECONDS = 300
const DEFAULT_PAGE_SIZE = 50
const JWT_EXPIRY_DAYS = 7

// ✅ Configuration objects
const PERFORMANCE_TARGETS = {
  cardProcessing: 3000, // milliseconds
  ocrProcessing: 2000,
  databaseQuery: 500,
}

// ✅ Descriptive variable names
const isLoading = true
const hasUnsavedChanges = false
const selectedCardIds = ['card-1', 'card-2']
const tenantRates = { cash_rate: 70, store_credit_rate: 85 }
```

### **React Components**

```javascript
// ✅ PascalCase for components
const CardDisplay = ({ card, onEdit, onDelete }) => { ... };
const RequireSuperAdmin = ({ children, fallback }) => { ... };
const QuoteGenerator = ({ cards, rates }) => { ... };

// ✅ Use prefix for HOCs and providers
const withAuth = (Component) => { ... };
const AuthProvider = ({ children }) => { ... };
const ThemeProvider = ({ children, theme }) => { ... };

// ✅ Descriptive prop names
<CardDisplay
  card={cardData}
  onEdit={handleEdit}    // Not just "edit"
  onDelete={handleDelete} // Not just "delete"
  isHighlighted={isSelected}
/>
```

### **Files and Directories**

```
✅ Correct naming patterns:
services/
  cardService.js          // Services in camelCase
  authService.js
  pricingService.js

components/
  CardDisplay/            // Components in PascalCase
    CardDisplay.jsx
    CardDisplay.test.jsx
    index.js

routes/
  admin.js               // Routes in lowercase
  superAdmin.js          // Multi-word routes in camelCase
  cards.js

database/migrations/
  001_initial_schema.sql // Numbered migrations
  012_add_super_admin_role.sql
  014_create_tenants_table.sql
```

## 🏗️ Code Organization

### **Import Order Pattern**

```javascript
// ✅ Consistent import organization

// 1. Node.js built-in modules
const path = require('path')
const fs = require('fs').promises

// 2. Third-party modules
const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')

// 3. Local services and utilities
const authService = require('../services/authService')
const cardService = require('../services/cardService')
const { trackDatabaseOperation, captureError } = require('../utils/sentry')

// 4. Middleware
const { authMiddleware, requireAdmin } = require('../middleware/auth')
const { auditRequest } = require('../middleware/audit')

// 5. Constants and configuration
const { JWT_SECRET, SUPABASE_URL } = require('../config/env')
const { CARD_CONDITIONS } = require('../constants/cards')
```

### **Service Layer Pattern**

```javascript
// ✅ Consistent service structure
class CardService {
  constructor() {
    // Initialize dependencies
    this.supabaseClient = supabaseService.getClient()
    this.pricingCache = new NodeCache({ stdTTL: 300 })
  }

  // Public methods first
  async createCard(cardData, userId, tenantId) {
    // 1. Validate input
    this.validateCardData(cardData)

    // 2. Track operation
    return await trackDatabaseOperation('INSERT', 'cards', async () => {
      // 3. Business logic
      const enrichedData = await this.enrichCardData(cardData)

      // 4. Database operation
      const { data, error } = await this.supabaseClient
        .from('cards')
        .insert([
          {
            ...enrichedData,
            created_by: userId,
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      // 5. Error handling
      if (error) {
        throw new ServiceError(`Failed to create card: ${error.message}`, error)
      }

      // 6. Post-processing
      await this.invalidateRelatedCaches(data.id)

      return data
    })
  }

  // Private helper methods
  validateCardData(cardData) {
    if (!cardData.pokemon_name || !cardData.set_name) {
      throw new ValidationError('Pokemon name and set name are required')
    }
  }

  async enrichCardData(cardData) {
    // Implementation...
  }

  async invalidateRelatedCaches(cardId) {
    // Implementation...
  }
}

module.exports = new CardService()
```

### **Route Handler Pattern**

```javascript
// ✅ Consistent route structure
router.post(
  '/cards',
  // 1. Authentication
  authMiddleware,

  // 2. Validation
  [
    body('pokemon_name').trim().isLength({ min: 1, max: 100 }),
    body('set_name').trim().isLength({ min: 1, max: 100 }),
    body('condition').isIn(CARD_CONDITIONS),
    body('market_price').optional().isFloat({ min: 0 }),
  ],

  // 3. Audit logging
  auditRequest,

  // 4. Handler
  async (req, res) => {
    try {
      // Extract and validate
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        })
      }

      // Call service layer
      const result = await cardService.createCard(req.body, req.user.id, req.user.tenant_id)

      // Return standardized response
      res.status(201).json({
        success: true,
        data: result,
        message: 'Card created successfully',
      })
    } catch (error) {
      // Error handling
      captureError(error, {
        user_id: req.user?.id,
        operation: 'create_card',
      })

      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code || 'INTERNAL_ERROR',
      })
    }
  },
)
```

## 🧪 Test Standards

### **Test File Structure**

```javascript
// ✅ Consistent test organization
describe('CardService', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Group by method
  describe('createCard', () => {
    // Happy path first
    test('should create card successfully with valid data', async () => {
      const mockCardData = {
        pokemon_name: 'Pikachu',
        set_name: 'Base Set',
        condition: 'near_mint',
        market_price: 25.0,
      }

      const result = await cardService.createCard(mockCardData, 'user-123', 'tenant-456')

      expect(result).toMatchObject({
        pokemon_name: 'Pikachu',
        tenant_id: 'tenant-456',
        created_by: 'user-123',
      })
    })

    // Error cases
    test('should throw error when pokemon name is missing', async () => {
      const invalidData = {
        set_name: 'Base Set',
        condition: 'near_mint',
      }

      await expect(cardService.createCard(invalidData, 'user-123', 'tenant-456')).rejects.toThrow(
        'Pokemon name and set name are required',
      )
    })

    // Edge cases
    test('should handle special characters in pokemon names', async () => {
      const specialCardData = {
        pokemon_name: "Farfetch'd",
        set_name: 'Base Set',
        condition: 'near_mint',
      }

      const result = await cardService.createCard(specialCardData, 'user-123', 'tenant-456')
      expect(result.pokemon_name).toBe("Farfetch'd")
    })
  })
})
```

### **React Component Tests**

```javascript
// ✅ Component test patterns
describe('CardDisplay Component', () => {
  const mockCard = {
    id: 'card-123',
    pokemon_name: 'Charizard',
    set_name: 'Base Set',
    market_price: 300.0,
    condition: 'near_mint',
  }

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render card information correctly', () => {
    render(<CardDisplay card={mockCard} {...mockHandlers} />)

    expect(screen.getByText('Charizard')).toBeInTheDocument()
    expect(screen.getByText('Base Set')).toBeInTheDocument()
    expect(screen.getByText('$300.00')).toBeInTheDocument()
  })

  test('should call onEdit when edit button is clicked', async () => {
    render(<CardDisplay card={mockCard} {...mockHandlers} />)

    const editButton = screen.getByLabelText('Edit card')
    await userEvent.click(editButton)

    expect(mockHandlers.onEdit).toHaveBeenCalledWith('card-123')
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1)
  })

  test('should handle missing optional data gracefully', () => {
    const minimalCard = {
      id: 'card-456',
      pokemon_name: 'Pikachu',
      set_name: 'Unknown Set',
    }

    render(<CardDisplay card={minimalCard} {...mockHandlers} />)

    expect(screen.getByText('Pikachu')).toBeInTheDocument()
    expect(screen.getByText('Price: N/A')).toBeInTheDocument()
  })
})
```

### **Async Testing Patterns**

```javascript
// ✅ Testing async operations
describe('API Integration Tests', () => {
  test('should handle successful API response', async () => {
    const mockResponse = { data: [{ id: '1', name: 'Card 1' }] }
    mockAxios.get.mockResolvedValueOnce(mockResponse)

    const result = await cardApi.searchCards('pikachu')

    expect(result).toEqual(mockResponse.data)
    expect(mockAxios.get).toHaveBeenCalledWith('/api/cards/search', {
      params: { q: 'pikachu' },
    })
  })

  test('should handle API errors gracefully', async () => {
    const mockError = new Error('Network error')
    mockAxios.get.mockRejectedValueOnce(mockError)

    await expect(cardApi.searchCards('pikachu')).rejects.toThrow('Network error')

    // Verify error was logged
    expect(captureError).toHaveBeenCalledWith(mockError, {
      context: 'card_search',
      query: 'pikachu',
    })
  })
})
```

## 📝 Error Handling Patterns

### **Service Layer Errors**

```javascript
// ✅ Custom error classes
class ServiceError extends Error {
  constructor(message, originalError, code = 'SERVICE_ERROR') {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.originalError = originalError
  }
}

class ValidationError extends ServiceError {
  constructor(message, field) {
    super(message, null, 'VALIDATION_ERROR')
    this.field = field
  }
}

class NotFoundError extends ServiceError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`, null, 'NOT_FOUND')
    this.resource = resource
    this.resourceId = id
  }
}

// ✅ Using custom errors
const getCard = async (cardId, tenantId) => {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    throw new NotFoundError('Card', cardId)
  }

  return data
}
```

### **Frontend Error Handling**

```javascript
// ✅ Consistent error handling in components
const CardManager = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadCards = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await cardApi.getCards()
      setCards(response.data)
    } catch (error) {
      // Log to Sentry
      captureError(error, {
        component: 'CardManager',
        action: 'loadCards',
      })

      // User-friendly error message
      if (error.code === 'NETWORK_ERROR') {
        setError('Unable to connect to server. Please check your connection.')
      } else if (error.code === 'UNAUTHORIZED') {
        setError('Your session has expired. Please log in again.')
      } else {
        setError('Failed to load cards. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Error display pattern
  if (error) {
    return (
      <Box className="error-container">
        <Text color={Text.colors.NEGATIVE}>{error}</Text>
        <Button onClick={loadCards}>Retry</Button>
      </Box>
    )
  }

  // Rest of component...
}
```

## 🔄 State Management Patterns

### **React Hook Patterns**

```javascript
// ✅ Custom hook with clear return signature
const useCardProcessor = () => {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const processCard = useCallback(async (imageData) => {
    setProcessing(true)
    setError(null)

    try {
      const ocrResult = await ocrService.identify(imageData)
      const enrichedData = await cardService.enrichWithPricing(ocrResult)
      setResult(enrichedData)
      return enrichedData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setProcessing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProcessing(false)
  }, [])

  return {
    processCard,
    processing,
    result,
    error,
    reset,
  }
}

// ✅ Using the hook
const CardIntake = () => {
  const { processCard, processing, result, error, reset } = useCardProcessor()

  const handleImageUpload = async (file) => {
    try {
      await processCard(file)
      toast.success('Card processed successfully')
    } catch (error) {
      toast.error('Failed to process card')
    }
  }

  // Component implementation...
}
```

### **Context Patterns**

```javascript
// ✅ Typed context with proper defaults
const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  hasRole: () => false,
  isSuperAdmin: () => false,
})

// ✅ Provider with comprehensive state management
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('tcg_auth_token'))

  // Memoized helpers
  const isAuthenticated = useMemo(() => !!user && !!token, [user, token])

  const hasRole = useCallback(
    (role) => {
      if (!user) return false
      if (Array.isArray(role)) {
        return role.includes(user.role)
      }
      return user.role === role
    },
    [user],
  )

  const isSuperAdmin = useCallback(() => {
    return user?.role === 'super_admin'
  }, [user])

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      hasRole,
      isSuperAdmin,
    }),
    [user, loading, isAuthenticated, hasRole, isSuperAdmin],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
```

## 💾 Database Query Patterns

### **Efficient Query Patterns**

```javascript
// ✅ Select only needed fields
const getCardSummaries = async (tenantId) => {
  const { data, error } = await supabase
    .from('cards')
    .select('id, pokemon_name, set_name, market_price')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data, error }
}

// ✅ Batch operations
const updateMultipleCards = async (updates, tenantId) => {
  // Validate all cards belong to tenant first
  const cardIds = updates.map((u) => u.id)
  const { data: existingCards } = await supabase
    .from('cards')
    .select('id')
    .in('id', cardIds)
    .eq('tenant_id', tenantId)

  if (existingCards.length !== cardIds.length) {
    throw new Error('Some cards not found or access denied')
  }

  // Perform batch update
  const promises = updates.map((update) =>
    supabase.from('cards').update(update.data).eq('id', update.id).eq('tenant_id', tenantId),
  )

  return Promise.all(promises)
}

// ✅ Cursor-based pagination
const getCardsPaginated = async (tenantId, cursor, limit = 50) => {
  let query = supabase
    .from('cards')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error, count } = await query

  return {
    data,
    error,
    count,
    nextCursor: data?.length === limit ? data[data.length - 1].created_at : null,
  }
}
```

## 🚨 Security Patterns

### **Input Validation**

```javascript
// ✅ Comprehensive validation
const validateCardInput = [
  body('pokemon_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Pokemon name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'é]+$/)
    .withMessage('Pokemon name contains invalid characters'),

  body('set_name').trim().isLength({ min: 1, max: 100 }).withMessage('Set name is required'),

  body('market_price')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Market price must be between 0 and 10000'),

  body('condition')
    .isIn(['mint', 'near_mint', 'excellent', 'good', 'played', 'poor'])
    .withMessage('Invalid condition value'),
]

// ✅ Sanitization patterns
const sanitizeUserInput = (input) => {
  return {
    pokemon_name: input.pokemon_name?.trim(),
    set_name: input.set_name?.trim(),
    market_price: parseFloat(input.market_price) || 0,
    condition: input.condition?.toLowerCase(),
    notes: DOMPurify.sanitize(input.notes || ''), // For rich text
  }
}
```

### **Tenant Isolation**

```javascript
// ✅ Always include tenant checks
const tenantScopedQuery = async (tableName, filters, tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant context required for queries')
  }

  return supabase
    .from(tableName)
    .select('*')
    .eq('tenant_id', tenantId) // Never forget this!
    .match(filters)
}

// ✅ Verify ownership before updates
const updateCard = async (cardId, updates, userId, tenantId) => {
  // First verify the card exists and user has access
  const { data: existingCard } = await supabase
    .from('cards')
    .select('id, created_by, tenant_id')
    .eq('id', cardId)
    .single()

  if (!existingCard) {
    throw new NotFoundError('Card', cardId)
  }

  if (existingCard.tenant_id !== tenantId) {
    throw new Error('Access denied')
  }

  // Perform update with tenant check
  return supabase
    .from('cards')
    .update({
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .eq('tenant_id', tenantId) // Double-check on update
}
```

## 📊 Performance Patterns

### **Memoization**

```javascript
// ✅ Memoize expensive calculations
const CardStats = ({ cards }) => {
  const stats = useMemo(() => {
    const totalValue = cards.reduce((sum, card) => sum + (card.market_price || 0), 0)
    const avgValue = totalValue / cards.length || 0
    const highValueCards = cards.filter((card) => card.market_price > 100)
    const byCondition = cards.reduce((acc, card) => {
      acc[card.condition] = (acc[card.condition] || 0) + 1
      return acc
    }, {})

    return {
      totalValue,
      avgValue,
      highValueCount: highValueCards.length,
      byCondition,
    }
  }, [cards])

  return (
    <Box>
      <Text>Total Value: ${stats.totalValue.toFixed(2)}</Text>
      <Text>Average Value: ${stats.avgValue.toFixed(2)}</Text>
      <Text>High Value Cards: {stats.highValueCount}</Text>
    </Box>
  )
}
```

### **Debouncing and Throttling**

```javascript
// ✅ Debounce search inputs
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage
const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  return <TextField value={searchTerm} onChange={setSearchTerm} placeholder="Search cards..." />
}

// ✅ Throttle scroll handlers
const useThrottle = (callback, limit) => {
  const inThrottle = useRef(false)

  return useCallback(
    (...args) => {
      if (!inThrottle.current) {
        callback.apply(this, args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    },
    [callback, limit],
  )
}
```

## ✅ Code Review Checklist

### **Security Checklist**

- [ ] All database queries include tenant_id filtering
- [ ] User inputs are validated and sanitized
- [ ] Authentication is verified before sensitive operations
- [ ] No sensitive data in console.logs or error messages
- [ ] API responses don't leak internal implementation details

### **Performance Checklist**

- [ ] Database queries select only needed fields
- [ ] Large lists use pagination or virtualization
- [ ] Expensive calculations are memoized
- [ ] Search inputs are debounced
- [ ] Images are optimized before storage

### **Maintainability Checklist**

- [ ] Functions follow single responsibility principle
- [ ] Error handling is consistent and informative
- [ ] Complex logic includes explanatory comments
- [ ] Test coverage includes happy path, error, and edge cases
- [ ] Dependencies are properly imported and organized

### **React-Specific Checklist**

- [ ] Components handle loading and error states
- [ ] useEffect dependencies are correct
- [ ] Callbacks are memoized when passed as props
- [ ] Context providers include loading states
- [ ] Component files stay under 500 lines

---

**Version**: 2025-08-01
