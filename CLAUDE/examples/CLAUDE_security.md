# 🔐 Security & Authentication Patterns

## 🎯 Authentication Architecture

### **JWT Token Strategy**

- **Access tokens**: Short-lived (7 days), contain user claims
- **Refresh tokens**: Long-lived, used to generate new access tokens
- **Token storage**: localStorage for access, httpOnly cookies for refresh
- **Automatic refresh**: Handled by axios interceptors

### **Authentication Flow**

```
1. User Login
   ↓
2. Validate credentials
   ↓
3. Generate JWT with user claims
   ↓
4. Return token + refresh token
   ↓
5. Client stores tokens
   ↓
6. Automatic refresh before expiry
```

## 🔑 Authentication Implementation

### **Backend JWT Patterns**

#### **Token Generation**

```javascript
// authService.js pattern
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenant_id: user.tenant_id,
    isSuperAdmin: user.role === 'super_admin',
  }

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    audience: 'tcg-employees',
    issuer: 'tcg-card-management',
  })

  const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })

  return { token, refreshToken }
}
```

#### **Authentication Middleware**

```javascript
// middleware/auth.js patterns
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req)
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    })
  }
}

// Role-based middleware
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required',
      code: 'INSUFFICIENT_PRIVILEGES',
    })
  }
  next()
}
```

### **Frontend Authentication Patterns**

#### **Auth Context Setup**

```javascript
// hooks/useAuth.js pattern
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('tcg_auth_token'))

  // Critical: Always handle loading state
  const validateAndRefreshToken = useCallback(async () => {
    try {
      setLoading(true)
      const storedToken = localStorage.getItem('tcg_auth_token')

      if (!storedToken) {
        setLoading(false)
        return
      }

      // Validate token and refresh if needed
      const response = await api.get('/auth/validate')
      setUser(response.data.user)
    } catch (error) {
      // Clear invalid tokens
      localStorage.removeItem('tcg_auth_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading, // ⚠️ Critical for preventing auth flashes
        login,
        logout,
        isSuperAdmin: () => user?.role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
```

#### **Protected Route Patterns**

```javascript
// components/Auth/ProtectedRoute.jsx
const ProtectedRoute = ({ children, requiredRoles, fallback }) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth()

  // ⚠️ Critical: Check loading state first
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles) {
    const hasRequiredRole = Array.isArray(requiredRoles)
      ? requiredRoles.some((role) => hasRole(role))
      : hasRole(requiredRoles)

    if (!hasRequiredRole) {
      return <UnauthorizedMessage requiredRoles={requiredRoles} userRole={user?.role} />
    }
  }

  return children
}

// Specialized components
export const RequireSuperAdmin = ({ children, fallback }) => {
  const { isSuperAdmin, loading, user } = useAuth()

  // ⚠️ Always check loading state to prevent auth flashes
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  if (!isSuperAdmin()) {
    return (
      <UnauthorizedMessage
        requiredRoles="super_admin"
        userRole={user?.role || 'insufficient privileges'}
      />
    )
  }

  return children
}
```

## 🏢 Multi-Tenant Security

### **Tenant Isolation Patterns**

#### **Backend Tenant Filtering**

```javascript
// ⚠️ CRITICAL: All business queries must include tenant_id
const getUserCards = async (userId, tenantId) => {
  // ✅ Correct: Explicit tenant filtering
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('created_by', userId)
    .eq('tenant_id', tenantId) // Never omit this!

  return data
}

// ❌ DANGEROUS: Missing tenant isolation
const getAllCards = async (userId) => {
  const { data, error } = await supabase.from('cards').select('*').eq('created_by', userId) // Could access other tenants' data!

  return data
}
```

#### **Middleware Tenant Validation**

```javascript
const validateTenantAccess = (req, res, next) => {
  const requestedTenantId = req.params.tenantId || req.body.tenant_id
  const userTenantId = req.user.tenant_id
  const isSuperAdmin = req.user.role === 'super_admin'

  // Super admins can access any tenant
  if (isSuperAdmin) {
    return next()
  }

  // Regular users can only access their own tenant
  if (requestedTenantId && requestedTenantId !== userTenantId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied to this tenant',
      code: 'TENANT_ACCESS_DENIED',
    })
  }

  next()
}
```

### **Super Admin Security**

#### **Cross-Tenant Access Pattern**

```javascript
// Super admin service pattern
class SuperAdminService {
  async getAllUsersAcrossTenants(options = {}) {
    // Only callable by super admin - enforced by middleware
    return await trackDatabaseOperation('SELECT', 'users', async () => {
      const client = supabaseService.getClient()

      let query = client
        .from('users')
        .select('id, name, email, role, tenant_id, is_active')
        .order('created_at', { ascending: false })

      // Super admin can filter by specific tenant if needed
      if (options.tenant_id) {
        query = query.eq('tenant_id', options.tenant_id)
      }

      const { data, error } = await query
      if (error) throw error

      return data
    })
  }
}
```

## 🛡️ Input Security & Validation

### **Input Validation Patterns**

```javascript
// Route validation with express-validator
router.post(
  '/cards',
  [
    body('pokemon_name').trim().isLength({ min: 1, max: 100 }),
    body('set_name').trim().isLength({ min: 1, max: 100 }),
    body('market_price').isFloat({ min: 0 }),
    body('condition').isIn(['mint', 'near_mint', 'excellent', 'good', 'played', 'poor']),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      })
    }

    // Process validated input
  },
)
```

### **Database Security**

```javascript
// ✅ Parameterized queries (Supabase handles this)
const findCards = async (searchTerm, tenantId) => {
  return await supabase
    .from('cards')
    .select('*')
    .ilike('pokemon_name', `%${searchTerm}%`) // Safe parameterization
    .eq('tenant_id', tenantId)
}

// ❌ Never build raw SQL strings
const unsafeQuery = `SELECT * FROM cards WHERE name = '${userInput}'` // SQL injection risk!
```

## 🖼️ File Upload Security

### **Image Processing Security**

```javascript
// Sharp image processing pattern
const processUploadedImage = async (fileBuffer) => {
  try {
    // Validate file type
    const metadata = await sharp(fileBuffer).metadata()
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp']

    if (!allowedFormats.includes(metadata.format)) {
      throw new Error('Invalid file format')
    }

    // Process and sanitize
    const processedBuffer = await sharp(fileBuffer)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer()

    return processedBuffer
  } catch (error) {
    throw new Error('Image processing failed')
  }
}
```

## 🔒 Security Headers & Middleware

### **Security Middleware Stack**

```javascript
// Apply in order
app.use(helmet()) // Security headers
app.use(cors(corsOptions)) // CORS policy
app.use(rateLimit(rateLimitOptions)) // Rate limiting
app.use(authMiddleware) // Authentication
app.use(auditRequest) // Audit logging
```

### **Audit Logging Pattern**

```javascript
const auditRequest = (req, res, next) => {
  // Log sensitive operations
  const sensitiveOperations = ['POST', 'PUT', 'DELETE']
  const sensitiveRoutes = ['/admin', '/super-admin', '/auth']

  const isSensitive =
    sensitiveOperations.includes(req.method) ||
    sensitiveRoutes.some((route) => req.path.includes(route))

  if (isSensitive) {
    logBusinessEvent('sensitive_operation', {
      user_id: req.user?.id,
      operation: `${req.method} ${req.path}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      tenant_id: req.user?.tenant_id,
    })
  }

  next()
}
```

## 🚨 Common Security Issues & Fixes

### **Authentication Flash Issue**

```javascript
// ❌ Problem: Showing unauthorized before auth loads
const Component = () => {
  const { isSuperAdmin } = useAuth()
  return isSuperAdmin() ? <Content /> : <Unauthorized /> // Flashes!
}

// ✅ Solution: Always check loading state
const Component = () => {
  const { isSuperAdmin, loading } = useAuth()
  if (loading) return <Loading />
  return isSuperAdmin() ? <Content /> : <Unauthorized />
}
```

### **Tenant Leakage Prevention**

```javascript
// ✅ Always validate tenant access in services
const updateCard = async (cardId, updates, userId, userTenantId) => {
  // First verify the card belongs to user's tenant
  const existingCard = await supabase.from('cards').select('tenant_id').eq('id', cardId).single()

  if (existingCard.tenant_id !== userTenantId) {
    throw new Error('Access denied')
  }

  // Then perform update
  return await supabase.from('cards').update(updates).eq('id', cardId).eq('tenant_id', userTenantId) // Double-check on update
}
```

---

**Version**: 2025-08-01
