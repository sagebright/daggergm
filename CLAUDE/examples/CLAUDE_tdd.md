# 🧪 Test-Driven Development (TDD) Guide

## ⚡ Quick Start - TDD in 5 Minutes

### TDD Checklist (Copy This!)

```bash
☐ Write failing test first (RED)
☐ Run test to verify it fails
☐ Write minimal code to pass (GREEN)
☐ Refactor while keeping tests green (REFACTOR)
☐ Add edge cases and error scenarios
☐ Verify 99% coverage achieved naturally
```

### When to Use TDD

- User says "take a TDD approach" or "reference CLAUDE_tdd.md"
- Building new features from scratch
- Fixing bugs (write regression test first)
- Refactoring complex code
- Implementing business logic

## 🎯 Why TDD is MANDATORY for This Project

### The Hard Truth from Experience

- **Sales Cart Feature**: Required 237 tests retrofitted AFTER implementation
- **Time Cost**: Retrofitting tests took 3x longer than TDD would have
- **Design Issues**: Poor API design discovered only during testing phase
- **Coverage Struggle**: Achieving 99% coverage after coding is exponentially harder

### TDD Benefits We've Proven

1. **Better Design**: Tests force clean interfaces and modular code
2. **Faster Development**: Less debugging, fewer rewrites
3. **Natural Coverage**: 99% coverage happens naturally, not forced
4. **Documentation**: Tests serve as living documentation
5. **Confidence**: Refactoring is safe with comprehensive test suite

## 🔄 The TDD Cycle

### 1. 🔴 RED Phase - Write a Failing Test

```javascript
// Start with the test that describes what you want
test('should calculate batch discount for orders over 10 cards', () => {
  const result = calculateBatchDiscount({ cards: 15, total: 150 })
  expect(result.discount).toBe(0.05)
  expect(result.finalPrice).toBe(142.5)
})
```

### 2. 🟢 GREEN Phase - Make it Pass

```javascript
// Write MINIMAL code to make the test pass
function calculateBatchDiscount({ cards, total }) {
  const discount = cards > 10 ? 0.05 : 0
  return {
    discount,
    finalPrice: total * (1 - discount),
  }
}
```

### 3. 🔵 REFACTOR Phase - Improve the Code

```javascript
// Now make it better while keeping tests green
const BATCH_DISCOUNT_THRESHOLD = 10
const BATCH_DISCOUNT_RATE = 0.05

function calculateBatchDiscount({ cards, total }) {
  const qualifiesForDiscount = cards > BATCH_DISCOUNT_THRESHOLD
  const discount = qualifiesForDiscount ? BATCH_DISCOUNT_RATE : 0

  return {
    discount,
    finalPrice: total * (1 - discount),
    savedAmount: total * discount,
  }
}
```

## 📋 TDD Workflow for Features

### Step 1: Start with User Stories

```gherkin
Feature: Batch Card Processing
  As a card shop employee
  I want to process multiple cards at once
  So that I can save time on bulk submissions

  Scenario: Apply discount for large batches
    Given I have 15 cards in my batch
    When I calculate the total price
    Then I should receive a 5% discount
```

### Step 2: Convert to Test Cases (TCG Examples)

```javascript
describe('Card Grading Service', () => {
  describe('Condition Assessment', () => {
    test('should grade mint condition card as PSA 10', () => {
      const card = {
        corners: 'perfect',
        edges: 'perfect',
        surface: 'no_scratches',
        centering: '50/50',
      }

      const grade = assessCardCondition(card)

      expect(grade.psa).toBe(10)
      expect(grade.label).toBe('Gem Mint')
    })

    test('should downgrade for off-center cards', () => {
      const card = {
        corners: 'perfect',
        edges: 'perfect',
        surface: 'no_scratches',
        centering: '60/40', // Off-center
      }

      const grade = assessCardCondition(card)

      expect(grade.psa).toBe(9)
      expect(grade.label).toBe('Mint')
    })
  })
})

describe('Trade-In Calculator', () => {
  test('should calculate 75% cash value for standard cards', () => {
    const card = {
      market_price: 100,
      condition: 'near_mint',
    }

    const tradeIn = calculateTradeInValue(card, 'cash')

    expect(tradeIn.amount).toBe(75)
    expect(tradeIn.type).toBe('cash')
  })

  test('should calculate 90% store credit value', () => {
    const card = {
      market_price: 100,
      condition: 'near_mint',
    }

    const tradeIn = calculateTradeInValue(card, 'store_credit')

    expect(tradeIn.amount).toBe(90)
    expect(tradeIn.type).toBe('store_credit')
  })

  test('should apply condition modifiers', () => {
    const card = {
      market_price: 100,
      condition: 'heavily_played', // 60% modifier
    }

    const tradeIn = calculateTradeInValue(card, 'cash')

    expect(tradeIn.amount).toBe(45) // 100 * 0.75 * 0.60
  })
})
```

### Step 3: Implement Feature

Only NOW do you write the actual implementation!

## 🏗️ TDD Patterns by Component Type

### Backend Service TDD Pattern (TCG Business Logic)

```javascript
// 1. Start with OCR service test
describe('OCRService', () => {
  let service
  let mockTesseract
  let mockCardDatabase

  beforeEach(() => {
    mockTesseract = createMockTesseract()
    mockCardDatabase = createMockCardDatabase()
    service = new OCRService(mockTesseract, mockCardDatabase)
  })

  describe('identifyCard', () => {
    test('should identify Pokémon card from image', async () => {
      // Arrange
      const imageBuffer = await readTestImage('pikachu-base-set.jpg')
      mockTesseract.recognize.mockResolvedValue({
        text: 'Pikachu\n58/102\nBase Set',
      })

      // Act
      const result = await service.identifyCard(imageBuffer, 'tenant-123')

      // Assert
      expect(result).toMatchObject({
        card_name: 'Pikachu',
        set_name: 'Base Set',
        card_number: '58/102',
        confidence: expect.any(Number),
        tenant_id: 'tenant-123',
      })
    })

    test('should handle Japanese cards', async () => {
      const imageBuffer = await readTestImage('japanese-card.jpg')
      mockTesseract.recognize.mockResolvedValue({
        text: 'ピカチュウ\n025/165\nSV2a',
      })

      const result = await service.identifyCard(imageBuffer, 'tenant-123')

      expect(result.language).toBe('JPN')
      expect(result.card_name).toBe('ピカチュウ')
    })
  })
})

// 2. Then implement OCR service
class OCRService {
  async identifyCard(imageBuffer, tenantId) {
    // Process image for better OCR
    const processed = await this.preprocessImage(imageBuffer)

    // Extract text
    const { text, confidence } = await this.tesseract.recognize(processed)

    // Parse card details
    const cardDetails = this.parseCardText(text)

    // Match against database
    const matchedCard = await this.findBestMatch(cardDetails)

    return {
      ...matchedCard,
      confidence,
      tenant_id: tenantId,
      identified_at: new Date(),
    }
  }
}
```

### API Route TDD Pattern (TCG Endpoints)

```javascript
// 1. Start with batch processing route test
describe('POST /api/v1/cards/batch-process', () => {
  test('should process multiple card images', async () => {
    const formData = new FormData()
    formData.append('images', testCardImage1, 'charizard.jpg')
    formData.append('images', testCardImage2, 'blastoise.jpg')
    formData.append('processing_type', 'trade_in')

    const response = await request(app)
      .post('/api/v1/cards/batch-process')
      .set('Authorization', 'Bearer valid-token')
      .send(formData)

    expect(response.status).toBe(202) // Accepted for processing
    expect(response.body).toMatchObject({
      success: true,
      batch_id: expect.any(String),
      cards_queued: 2,
      estimated_time: expect.any(Number),
    })
  })

  test('should enforce tenant limits', async () => {
    // Mock tenant at limit
    mockTenantService.checkLimits.mockResolvedValue({
      can_process: false,
      limit: 1000,
      current: 1000,
    })

    const response = await request(app)
      .post('/api/v1/cards/batch-process')
      .set('Authorization', 'Bearer valid-token')
      .send(formData)

    expect(response.status).toBe(429) // Too Many Requests
    expect(response.body.error).toContain('limit reached')
  })
})

// 2. Then implement batch processing route
router.post(
  '/cards/batch-process',
  authMiddleware,
  tenantMiddleware,
  upload.array('images', 100),
  [body('processing_type').isIn(['trade_in', 'inventory', 'pricing_only'])],
  validateRequest,
  async (req, res) => {
    const { tenant_id } = req.user

    // Check tenant limits
    const limits = await tenantService.checkLimits(tenant_id)
    if (!limits.can_process) {
      return res.status(429).json({
        success: false,
        error: `Monthly limit reached: ${limits.current}/${limits.limit}`,
      })
    }

    // Queue for processing
    const batch = await batchService.createBatch({
      tenant_id,
      images: req.files,
      processing_type: req.body.processing_type,
    })

    res.status(202).json({
      success: true,
      batch_id: batch.id,
      cards_queued: req.files.length,
      estimated_time: req.files.length * 3, // 3 seconds per card
    })
  },
)
```

### React Component TDD Pattern (TCG UI Components)

```javascript
// 1. Start with card grading component test
describe('CardGradingForm', () => {
  test('should calculate grade based on condition inputs', async () => {
    render(<CardGradingForm />)

    // Select condition options
    await userEvent.selectOptions(screen.getByLabelText(/corners/i), 'perfect')
    await userEvent.selectOptions(screen.getByLabelText(/edges/i), 'perfect')
    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'light_scratches')
    await userEvent.selectOptions(screen.getByLabelText(/centering/i), '50/50')

    // Grade should update automatically
    expect(screen.getByText(/PSA 9/)).toBeInTheDocument()
    expect(screen.getByText(/Mint/)).toBeInTheDocument()
  })

  test('should show trade-in values for graded card', async () => {
    const mockCard = { market_price: 100 }
    render(<CardGradingForm card={mockCard} />)

    // Set to Near Mint condition
    await userEvent.selectOptions(screen.getByLabelText(/overall condition/i), 'near_mint')

    expect(screen.getByText(/Cash Value: \$75/)).toBeInTheDocument()
    expect(screen.getByText(/Store Credit: \$90/)).toBeInTheDocument()
  })

  test('should disable submission for damaged cards', async () => {
    render(<CardGradingForm />)

    await userEvent.selectOptions(screen.getByLabelText(/surface/i), 'heavy_damage')

    const submitButton = screen.getByRole('button', { name: /submit grade/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/Card too damaged/i)).toBeInTheDocument()
  })
})

// 2. Then implement grading component
function CardGradingForm({ card, onSubmit }) {
  const [condition, setCondition] = useState({
    corners: '',
    edges: '',
    surface: '',
    centering: '',
  })

  const grade = useMemo(() => {
    if (!Object.values(condition).every(Boolean)) return null
    return calculatePSAGrade(condition)
  }, [condition])

  const tradeInValues = useMemo(() => {
    if (!card?.market_price || !grade) return null
    return {
      cash: card.market_price * 0.75 * getConditionModifier(grade.psa),
      credit: card.market_price * 0.9 * getConditionModifier(grade.psa),
    }
  }, [card, grade])

  const canSubmit = grade && grade.psa >= 3 // No heavily damaged

  return (
    <Box>
      <Flex direction="column" gap={Size.MEDIUM}>
        <Dropdown
          label="Corners"
          value={condition.corners}
          onChange={(val) => setCondition((prev) => ({ ...prev, corners: val }))}
          options={CONDITION_OPTIONS}
        />
        {/* Other condition dropdowns... */}

        {grade && (
          <Box>
            <Heading size={HeadingSize.H3}>PSA {grade.psa}</Heading>
            <Text>{grade.label}</Text>
          </Box>
        )}

        {tradeInValues && (
          <Box>
            <Text>Cash Value: ${tradeInValues.cash.toFixed(2)}</Text>
            <Text>Store Credit: ${tradeInValues.credit.toFixed(2)}</Text>
          </Box>
        )}

        <Button onClick={() => onSubmit({ condition, grade })} disabled={!canSubmit}>
          Submit Grade
        </Button>

        {!canSubmit && grade && (
          <AttentionBox type="warning" text="Card too damaged for trade-in" />
        )}
      </Flex>
    </Box>
  )
}
```

## 🎯 TDD Best Practices

### 1. One Test, One Assertion (When Possible)

```javascript
// ❌ Bad - Multiple concerns in one test
test('should create and validate card', async () => {
  const card = await createCard({ name: 'Pikachu' })
  expect(card.id).toBeDefined()
  expect(card.name).toBe('Pikachu')
  expect(card.validated).toBe(true)
  expect(card.price).toBeGreaterThan(0)
})

// ✅ Good - Separated concerns
test('should generate ID when creating card', async () => {
  const card = await createCard({ name: 'Pikachu' })
  expect(card.id).toBeDefined()
})

test('should preserve card name', async () => {
  const card = await createCard({ name: 'Pikachu' })
  expect(card.name).toBe('Pikachu')
})
```

### 2. Test Behavior, Not Implementation

```javascript
// ❌ Bad - Testing implementation details
test('should call database.insert', async () => {
  await service.createCard(data)
  expect(mockDb.insert).toHaveBeenCalledWith('cards', data)
})

// ✅ Good - Testing behavior
test('should persist card and return with ID', async () => {
  const result = await service.createCard(data)
  const saved = await service.getCard(result.id)
  expect(saved).toEqual(result)
})
```

### 3. Use Descriptive Test Names

```javascript
// ❌ Bad
test('discount', () => {})
test('error', () => {})

// ✅ Good
test('should apply 5% discount when batch contains more than 10 cards', () => {})
test('should return 400 when required fields are missing', () => {})
```

### 4. Follow AAA Pattern

```javascript
test('should calculate batch total with discount', () => {
  // Arrange
  const cards = [{ price: 10 }, { price: 20 }, { price: 15 }]

  // Act
  const result = calculateBatchTotal(cards)

  // Assert
  expect(result).toBe(45)
})
```

## 🚫 Common TDD Mistakes to Avoid

### 1. Writing Too Much Code

```javascript
// ❌ Bad - Implementing features not required by current test
function calculateDiscount(items) {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const discount = items.length > 10 ? 0.05 : 0
  const tax = total * 0.08 // <- Not tested yet!
  const shipping = total > 100 ? 0 : 10 // <- Not tested yet!
  return {
    total,
    discount,
    tax,
    shipping,
    final: total * (1 - discount) + tax + shipping,
  }
}

// ✅ Good - Only what the test requires
function calculateDiscount(items) {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const discount = items.length > 10 ? 0.05 : 0
  return { total, discount }
}
```

### 2. Not Refactoring

```javascript
// ❌ Bad - Leaving messy code after green
function calc(i) {
  let t = 0
  for (let x = 0; x < i.length; x++) {
    t += i[x].p
  }
  return t > 100 ? t * 0.95 : t
}

// ✅ Good - Refactored for clarity
const DISCOUNT_THRESHOLD = 100
const DISCOUNT_RATE = 0.05

function calculateTotal(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const qualifiesForDiscount = subtotal > DISCOUNT_THRESHOLD
  return qualifiesForDiscount ? subtotal * (1 - DISCOUNT_RATE) : subtotal
}
```

### 3. Testing Too Much at Once

```javascript
// ❌ Bad - Giant integration test
test('should process entire order', async () => {
  const user = await createUser()
  const cards = await createCards(10)
  const order = await createOrder(user, cards)
  const payment = await processPayment(order)
  const shipment = await createShipment(order)
  // ... 50 more lines
})

// ✅ Good - Focused unit tests
test('should create order with user and cards', async () => {
  const order = await createOrder(mockUser, mockCards)
  expect(order.userId).toBe(mockUser.id)
  expect(order.items).toHaveLength(mockCards.length)
})
```

## 📊 Measuring TDD Success

### Coverage Metrics That Matter

```bash
# Run coverage with:
npm run test:coverage

# Look for:
- Lines: 99%+ (non-negotiable)
- Functions: 99%+ (non-negotiable)
- Branches: 97%+ (some error branches ok)
- Statements: 99%+

# Red flags:
- Uncovered lines in business logic
- Untested error scenarios
- Missing edge cases
```

### TDD Health Indicators

✅ **Good Signs**:

- Tests written before code
- Small, focused test methods
- Fast test execution (< 5 seconds for unit tests)
- High coverage achieved naturally
- Easy to add new features

❌ **Bad Signs**:

- Large blocks of uncovered code
- Complex test setup/teardown
- Slow tests (> 1 second per test)
- Difficulty achieving coverage
- Fear of refactoring

## 🔗 Integration with CI/CD

### Pre-commit Hooks

```json
// .husky/pre-commit
"npm run test:changed"
```

### CI Pipeline Requirements

```yaml
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:coverage

- name: Check Coverage
  run: |
    npm run coverage:check # Fails if < 99%
```

## 📚 Resources and Examples

### Example TDD Features in This Codebase

1. **Good Example**: `organizationRegistration.test.js` - Comprehensive test-first approach
2. **Retrofitted Example**: `SalesCartPage.test.jsx` - Shows the pain of testing after

### TDD Workflow Commands

```bash
# Start TDD session
npm run test:watch -- CardService

# Run specific test file in watch mode
npm run test:watch -- --testPathPattern=CardService

# Check coverage for specific file
npm run test:coverage -- --collectCoverageFrom=src/services/CardService.js
```

## 🎯 TDD Checklist for New Features

- [ ] Write user story/acceptance criteria
- [ ] Create test file before implementation file
- [ ] Write first failing test
- [ ] Run test, see it fail (RED)
- [ ] Write minimal code to pass (GREEN)
- [ ] Refactor if needed (REFACTOR)
- [ ] Write next test
- [ ] Repeat until feature complete
- [ ] Verify 99% coverage
- [ ] Run full test suite
- [ ] Run Docker CI/CD commands
- [ ] Commit with confidence!

## 🚀 TCG-Specific TDD Examples

### Supabase Integration TDD

```javascript
describe('Supabase RLS Policies', () => {
  test('should enforce tenant isolation', async () => {
    // Create cards for different tenants
    await supabase.from('cards').insert([
      { pokemon_name: 'Pikachu', tenant_id: 'tenant-1' },
      { pokemon_name: 'Charizard', tenant_id: 'tenant-2' },
    ])

    // Set session for tenant-1
    const { data } = await supabase
      .rpc('set_current_tenant', { tenant_id: 'tenant-1' })
      .select('*')
      .from('cards')

    // Should only see tenant-1 cards
    expect(data).toHaveLength(1)
    expect(data[0].tenant_id).toBe('tenant-1')
  })
})
```

### Edge Function TDD

```javascript
describe('Card Pricing Edge Function', () => {
  test('should fetch real-time market prices', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/card-pricing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_name: 'Charizard',
        set_name: 'Base Set',
        card_number: '4/102',
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      market_price: expect.any(Number),
      price_trend: expect.stringMatching(/up|down|stable/),
      last_updated: expect.any(String),
    })
  })
})
```

### Performance Test Example

```javascript
describe('Batch OCR Processing Performance', () => {
  test('should process 100 cards within 5 minutes', async () => {
    const images = await loadTestImages(100)
    const startTime = Date.now()

    const results = await batchService.processImages(images, 'tenant-123')

    const duration = Date.now() - startTime

    expect(results).toHaveLength(100)
    expect(duration).toBeLessThan(300000) // 5 minutes
    expect(results.filter((r) => r.confidence > 0.8)).toHaveLength(95) // 95% accuracy
  })
})
```

---

**Version**: 2025-09-08 | **Previous**: 2025-08-18 | **Changes**: Added TCG-specific examples, quick-start section, explicit trigger instructions, and domain-specific patterns for card grading, trade-ins, and OCR
