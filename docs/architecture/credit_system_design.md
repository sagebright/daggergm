# Credit System Design

**Status**: Official Design (2025-10-29)
**Architecture**: Simple Balance Approach
**Related**: [FIX_003](../FIXES/FIX_003_e2e_credit_setup_issue.md)

---

## Overview

DaggerGM uses a **simple integer balance** approach for credit management. Users purchase credits via Stripe, and credits are consumed when generating adventures.

## Database Schema

### `daggerheart_user_profiles` (Credit Balance Storage)

```sql
CREATE TABLE daggerheart_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  credits INT DEFAULT 0 CHECK (credits >= 0),  -- Current balance
  total_purchased INT DEFAULT 0,                -- Lifetime purchases
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Design Decisions:**

- ✅ `credits` stores **current balance** as simple integer
- ✅ Atomic updates via `UPDATE ... SET credits = credits - 1`
- ✅ No expiration dates (credits never expire)
- ✅ No separate credit types (all credits are "adventure credits")

### `daggerheart_purchases` (Purchase Audit Trail)

```sql
CREATE TABLE daggerheart_purchases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INT NOT NULL,        -- Amount paid in cents
  credits INT NOT NULL,       -- Number of credits purchased
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:**

- ✅ Records all Stripe purchases
- ✅ Links payment_intent_id for reconciliation
- ✅ Provides audit trail for credit additions
- ✅ Supports refunds via Stripe webhooks

---

## Credit Operations

### 1. Add Credits (Purchase)

**Function**: `add_user_credits(user_id, amount, source)`

```sql
-- Increments credits balance and total_purchased
UPDATE daggerheart_user_profiles
SET credits = credits + p_amount,
    total_purchased = total_purchased + p_amount,
    updated_at = NOW()
WHERE id = p_user_id;
```

**Triggered by:**

- Stripe webhook: `payment_intent.succeeded`
- Admin credit grants (rare)

### 2. Consume Credit (Generate Adventure)

**Function**: `consume_adventure_credit(user_id, adventure_id)`

```sql
-- Atomically decrements credits
SELECT credits INTO v_credits
FROM daggerheart_user_profiles
WHERE id = p_user_id
FOR UPDATE;  -- Row lock prevents race conditions

IF v_credits < 1 THEN
  RAISE EXCEPTION 'Insufficient credits';
END IF;

UPDATE daggerheart_user_profiles
SET credits = credits - 1
WHERE id = p_user_id;
```

**Triggered by:**

- Server Action: `generateAdventureScaffold()`
- Only consumes credit if generation succeeds

### 3. Check Balance

**Direct query** (no function needed):

```sql
SELECT credits FROM daggerheart_user_profiles WHERE id = $1;
```

---

## Why Simple Balance (Not Ledger)?

### ❌ Rejected Design: Token-Based Ledger

We **explicitly rejected** a complex system with:

- `user_credits` table (individual credit tokens with expiration)
- `credit_transactions` table (full transaction ledger)
- Consumed_at timestamps per credit

**Reasons for rejection:**

1. **Overkill**: DaggerGM doesn't need expiring credits
2. **Complexity**: More tables = more code to maintain
3. **Performance**: Ledger queries slower than simple balance
4. **YAGNI**: "You Aren't Gonna Need It" - future proofing without requirements

### ✅ When to Revisit This Decision

Consider switching to ledger system if:

- Credits need expiration dates
- Need different credit types (e.g., "expansion credits")
- Require forensic audit trail beyond Stripe purchases
- Need to support credit refunds at granular level

**For MVP: Simple balance is sufficient!**

---

## Testing Patterns

### Unit Tests (Vitest)

```typescript
// Test credit consumption logic
test('consume credit decrements balance', async () => {
  const user = await createTestUser()

  // Add credits
  await supabaseAdmin.from('daggerheart_user_profiles').update({ credits: 5 }).eq('id', user.id)

  // Consume credit
  await consumeAdventureCredit(user.id, adventure.id)

  // Verify balance
  const { data } = await supabaseAdmin
    .from('daggerheart_user_profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  expect(data.credits).toBe(4)
})
```

### E2E Tests (Playwright)

```typescript
// Test credit flow from purchase to consumption
test('user can purchase and use credits', async ({ page }) => {
  // Login
  await signIn(page, 'user@example.com', 'password')

  // Purchase credits (Stripe test mode)
  await page.click('button:has-text("Buy Credits")')
  await fillStripeForm(page, testCard)

  // Verify balance updated
  await expect(page.locator('[data-testid="credit-balance"]')).toHaveText('5 credits')

  // Generate adventure
  await page.click('button:has-text("Generate New Adventure")')
  await fillAdventureForm(page)
  await page.click('button:has-text("Generate")')

  // Verify credit consumed
  await expect(page.locator('[data-testid="credit-balance"]')).toHaveText('4 credits')
})
```

---

## Server Actions Patterns

### Credit Check Before Operation

```typescript
'use server'

export async function generateAdventureScaffold(params: AdventureParams) {
  const user = await getCurrentUser()

  // 1. Check balance BEFORE expensive LLM calls
  const { data: profile } = await supabase
    .from('daggerheart_user_profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < 1) {
    return { error: 'Insufficient credits' }
  }

  // 2. Generate adventure (expensive!)
  const adventure = await generateWithLLM(params)

  // 3. Consume credit AFTER success
  await supabase.rpc('consume_adventure_credit', {
    p_user_id: user.id,
    p_adventure_id: adventure.id,
  })

  return { adventure }
}
```

**Key Pattern**: Check → Generate → Consume

- Prevents consuming credits on failed generations
- Race condition safe (database function uses row lock)

---

## Migration History

| Migration                                       | Purpose                                       | Status      |
| ----------------------------------------------- | --------------------------------------------- | ----------- |
| `00001_initial_schema.sql`                      | Created `user_profiles` with `credits` column | ✅ Applied  |
| `00003_credit_system.sql`                       | Created `credit_transactions` table (unused)  | ⚠️ Orphaned |
| `00016_rename_tables_to_daggerheart_prefix.sql` | Renamed to `daggerheart_user_profiles`        | ✅ Applied  |
| `00018_simplify_credit_system.sql`              | Removed complex credit functions              | ✅ Applied  |

---

## Security Considerations

### RLS Policies

```sql
-- Users can only view their own credit balance
CREATE POLICY "Users view own profile"
ON daggerheart_user_profiles FOR SELECT
USING (auth.uid() = id);

-- Only system (via functions) can update credits
CREATE POLICY "System updates credits"
ON daggerheart_user_profiles FOR UPDATE
USING (false);  -- Blocked at row level, use SECURITY DEFINER functions
```

### Attack Vectors

1. **Race Conditions**: ✅ Mitigated via `FOR UPDATE` row lock
2. **Double Spend**: ✅ CHECK constraint `credits >= 0` prevents negative balance
3. **Unauthorized Updates**: ✅ RLS blocks direct client updates
4. **SQL Injection**: ✅ Server Actions use parameterized queries

---

## Related Documentation

- [Testing Strategy](../TESTING_STRATEGY.md)
- [Server Actions Patterns](../SERVER_ACTIONS.md)
- [FIX_003: E2E Credit Setup Issue](../FIXES/FIX_003_e2e_credit_setup_issue.md)

---

**Last Updated**: 2025-10-29
**Owner**: DaggerGM Team
**Decision Authority**: Architecture Review
