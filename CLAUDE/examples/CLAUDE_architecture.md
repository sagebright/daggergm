# 🏗️ Architecture & Code Patterns

## 🎯 System Architecture Overview

### **Stack Components**

- **Backend**: Node.js/Express with middleware pattern
- **Frontend**: React with component-based architecture
- **Database**: Supabase (PostgreSQL) with tenant isolation
- **Storage**: File uploads via Sharp image processing
- **Monitoring**: Sentry for error tracking and performance

### **Monorepo Structure**

```
/
├── backend/
│   ├── src/
│   │   ├── routes/          # HTTP concerns only
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Cross-cutting concerns
│   │   └── utils/           # Shared utilities
│   └── tests/               # Mirrors src/ structure
├── frontend/
│   ├── src/
│   │   ├── components/      # Organized by feature
│   │   ├── services/        # API clients
│   │   ├── hooks/           # Reusable React logic
│   │   └── utils/           # Shared utilities
└── database/
    └── migrations/          # SQL migration files
```

## 🧱 Code Organization Principles

### **File Size Limits**

- **Maximum 500 lines per file** - refactor beyond this limit
- **Split by responsibility**: Feature-based modules over large files
- **Prefer composition over inheritance**

### **Backend Patterns**

#### **Three-Layer Architecture**

```javascript
// 1. Routes Layer - HTTP concerns only
router.post('/cards', validation, async (req, res) => {
  const result = await cardService.createCard(req.body, req.user.id)
  res.json({ success: true, data: result })
})

// 2. Service Layer - Business logic
class CardService {
  async createCard(cardData, userId) {
    // Business logic, database operations
    return await this.repository.create({ ...cardData, created_by: userId })
  }
}

// 3. Repository/Database Layer - Data access
class CardRepository {
  async create(data) {
    return await supabase.from('cards').insert(data)
  }
}
```

#### **Middleware Pattern**

```javascript
// Authentication middleware
const authMiddleware = (req, res, next) => {
  // JWT validation logic
  next()
}

// Audit middleware
const auditRequest = (req, res, next) => {
  // Log business operations
  next()
}

// Apply middleware in order
router.use(authMiddleware)
router.use(auditRequest)
```

### **Frontend Patterns**

#### **Component Organization**

```
components/
├── Auth/
│   ├── LoginForm.jsx
│   ├── ProtectedRoute.jsx
│   └── __tests__/
├── CardIntake/
│   ├── PhotoUpload.jsx
│   ├── CardIdentifier.jsx
│   └── __tests__/
└── Shared/
    ├── LoadingSpinner.jsx
    └── ErrorBoundary.jsx
```

#### **State Management Pattern**

```javascript
// Custom hooks for business logic
const useCardProcessing = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const processCard = async (imageData) => {
    try {
      setLoading(true)
      const result = await cardApi.process(imageData)
      setCards((prev) => [...prev, result])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { cards, loading, error, processCard }
}
```

## 🔄 Data Flow Architecture

### **Backend Request Flow**

```
HTTP Request
    ↓
Middleware (auth, rate limiting, audit)
    ↓
Route Handler (validation, HTTP concerns)
    ↓
Service Layer (business logic)
    ↓
Database/External APIs
    ↓
Response (standardized format)
```

### **Frontend Data Flow**

```
User Action
    ↓
Component Event Handler
    ↓
API Service Call
    ↓
State Update (React hooks)
    ↓
UI Re-render
```

## 🗄️ Database Architecture

### **Multi-Tenant Design**

```sql
-- Every business table includes tenant_id
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,  -- Tenant isolation
  pokemon_name VARCHAR,
  -- ... other fields
);

-- Row-level security through tenant_id filtering
```

### **Migration Pattern**

```sql
-- migrations/[timestamp]_descriptive_name.sql
BEGIN;

-- Add new column with default
ALTER TABLE cards
ADD COLUMN new_field VARCHAR DEFAULT 'default_value';

-- Update existing data if needed
UPDATE cards SET new_field = 'updated_value' WHERE condition;

-- Remove default after backfill
ALTER TABLE cards ALTER COLUMN new_field DROP DEFAULT;

COMMIT;
```

## 🔧 Service Integration Patterns

### **External API Integration**

```javascript
// Wrapper pattern for external services
class PricingService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.PRICING_API_URL,
      timeout: 10000,
    })
  }

  async getPrice(cardId) {
    try {
      const response = await this.client.get(`/cards/${cardId}`)
      return this.transformResponse(response.data)
    } catch (error) {
      throw new ServiceError('Pricing lookup failed', error)
    }
  }

  transformResponse(data) {
    // Normalize external API response to internal format
    return {
      price: parseFloat(data.market_price),
      currency: 'USD',
      updated_at: new Date(data.last_updated),
    }
  }
}
```

### **Error Handling Pattern**

```javascript
// Custom error types
class ServiceError extends Error {
  constructor(message, originalError, code = 'SERVICE_ERROR') {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.originalError = originalError
  }
}

// Centralized error handling
const errorHandler = (error, req, res, next) => {
  // Log to Sentry
  captureError(error, {
    user: req.user?.id,
    operation: req.path,
  })

  // Return appropriate response
  if (error instanceof ServiceError) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: error.code,
    })
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  })
}
```

## 📦 Module Import Patterns

### **Import Organization**

```javascript
// 1. Node modules first
const express = require('express')
const bcrypt = require('bcryptjs')

// 2. Local modules by category
const authService = require('../services/authService')
const { validation } = require('../middleware/validation')
const { trackApiOperation } = require('../utils/sentry')

// 3. Constants and configs last
const { JWT_SECRET } = require('../config/env')
```

### **Relative vs Absolute Imports**

```javascript
// ✅ Preferred: Relative imports within same package
const cardService = require('./cardService')
const { validateCard } = require('../utils/validation')

// ✅ Acceptable: Absolute for cross-package
const frontendUtils = require('../../frontend/src/utils/helpers')

// ❌ Avoid: Long relative paths
const helper = require('../../../shared/utils/helper')
```

## 🔍 Performance Patterns

### **Database Query Optimization**

```javascript
// ✅ Efficient: Select only needed fields
const cards = await supabase
  .from('cards')
  .select('id, pokemon_name, market_price')
  .eq('tenant_id', tenantId)
  .limit(50)

// ❌ Inefficient: Select all fields
const cards = await supabase.from('cards').select('*').eq('tenant_id', tenantId)
```

### **Frontend Performance**

```javascript
// ✅ Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return cards.reduce((sum, card) => sum + card.price, 0)
}, [cards])

// ✅ Debounced search
const debouncedSearch = useCallback(
  debounce((query) => fetchResults(query), 300),
  [],
)
```

## 🚨 Anti-Patterns to Avoid

### **Backend Anti-Patterns**

- **Fat controllers**: Business logic in route handlers
- **Database in routes**: Direct database calls from controllers
- **Missing error handling**: Unhandled promise rejections
- **Hardcoded values**: Config values in source code

### **Frontend Anti-Patterns**

- **Prop drilling**: Passing props through many components
- **Inline styles**: Styling without design system
- **Missing loading states**: No feedback during async operations
- **Uncontrolled state**: Component state without clear ownership

## 🚀 Feature Development Process

### **Development Order**

#### **1. Backend Development Order**

1. **Database Schema** (if needed)
   - Add migrations: `npm run migrate`
   - Update types/interfaces
   - Test with Supabase MCP queries

2. **Service Layer** (`services/[feature]Service.js`)
   - Business logic implementation
   - Error handling with Sentry integration
   - Database operations with `trackDatabaseOperation`

3. **Routes Layer** (`routes/[feature].js`)
   - HTTP concerns only
   - Input validation with express-validator
   - Authentication middleware
   - Audit logging

4. **Middleware** (if needed)
   - Cross-cutting concerns
   - Follow existing patterns

#### **2. Frontend Development Order**

1. **API Service** (`services/[feature]Api.js`)
   - HTTP client using existing api.js
   - Error handling patterns
   - Sentry integration

2. **Components** (`components/[Feature]/`)
   - Use Vibe Design System components
   - Follow existing naming conventions
   - State management patterns

3. **Routing** (update `App.jsx`)
   - Protected routes if needed
   - Navigation updates

### **✅ Feature Completion Checklist**

- [ ] Backend service tests pass
- [ ] Frontend component renders
- [ ] API integration works
- [ ] Authentication/authorization correct
- [ ] Error handling implemented
- [ ] Sentry integration added
- [ ] Code follows 500-line limit
- [ ] Documentation updated
- [ ] CI/CD pipeline passes

### **🚨 Common Feature Development Pitfalls**

- **Don't reinvent** existing auth/database patterns
- **Don't assume** libraries are available - check package.json
- **Don't skip** loading states in UI components
- **Don't forget** tenant isolation in multi-tenant features
- **Don't create** files over 500 lines

---

**Version**: 2025-09-05
