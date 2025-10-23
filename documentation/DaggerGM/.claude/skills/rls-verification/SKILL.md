# RLS Verification Skill

**Purpose**: Automated verification of Row-Level Security (RLS) policies to prevent cross-tenant data leakage.

**Critical**: Run this skill BEFORE merging any database-related code.

---

## When to Use

- [ ] After creating new database tables
- [ ] After modifying RLS policies
- [ ] After adding new Server Actions that query the database
- [ ] Before deploying to production
- [ ] Weekly security audit (automated via cron)

---

## RLS Policy Checklist

### For Every Table

#### 1. Verify RLS is Enabled

```sql
-- Run in Supabase SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Expected: No rows (all tables have RLS enabled)
```

#### 2. Verify tenant_id Column Exists

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id'
ORDER BY table_name;

-- Expected: All data tables (adventures, movements, etc.)
-- Excluded: lookup tables (frames, etc.)
```

#### 3. List All Policies

```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Expected: At least SELECT, INSERT, UPDATE, DELETE policies per table
```

---

## Automated RLS Tests

### Test 1: Cross-Tenant Read Prevention

**File: `tests/integration/rls/cross-tenant-read.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestUser,
  createTestAdventure,
  cleanupTestData,
  getTestSupabaseClient,
} from '@/tests/helpers/testDb'

describe('RLS: Cross-Tenant Read Prevention', () => {
  let victim: { id: string; adventureId: string }
  let attacker: { id: string }

  beforeEach(async () => {
    // Create victim user with adventure
    const victimUser = await createTestUser({ credits: 5 })
    const { adventure } = await createTestAdventure({ userId: victimUser.id })

    victim = { id: victimUser.id, adventureId: adventure.id }

    // Create attacker user
    const attackerUser = await createTestUser({ credits: 0 })
    attacker = { id: attackerUser.id }
  })

  afterEach(async () => {
    await cleanupTestData(victim.id)
    await cleanupTestData(attacker.id)
  })

  it('should prevent reading adventures owned by another user', async () => {
    // Attacker tries to read victim's adventure
    const attackerClient = getTestSupabaseClient() // Not authenticated

    const { data, error } = await attackerClient
      .from('adventures')
      .select('*')
      .eq('id', victim.adventureId)
      .single()

    // RLS should block this
    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })

  it('should allow reading own adventures', async () => {
    const { adventure } = await createTestAdventure({ userId: attacker.id })

    const attackerClient = getTestSupabaseClient() // Authenticated as attacker

    const { data, error } = await attackerClient
      .from('adventures')
      .select('*')
      .eq('id', adventure.id)
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBe(adventure.id)

    await cleanupTestData(attacker.id)
  })
})
```

### Test 2: Cross-Tenant Write Prevention

**File: `tests/integration/rls/cross-tenant-write.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestUser,
  createTestAdventure,
  cleanupTestData,
  getTestSupabaseClient,
} from '@/tests/helpers/testDb'

describe('RLS: Cross-Tenant Write Prevention', () => {
  let victim: { id: string; adventureId: string }
  let attacker: { id: string }

  beforeEach(async () => {
    const victimUser = await createTestUser({ credits: 5 })
    const { adventure } = await createTestAdventure({ userId: victimUser.id })

    victim = { id: victimUser.id, adventureId: adventure.id }

    const attackerUser = await createTestUser({ credits: 0 })
    attacker = { id: attackerUser.id }
  })

  afterEach(async () => {
    await cleanupTestData(victim.id)
    await cleanupTestData(attacker.id)
  })

  it('should prevent updating adventures owned by another user', async () => {
    const attackerClient = getTestSupabaseClient() // Not authenticated

    const { data, error } = await attackerClient
      .from('adventures')
      .update({ title: 'HACKED' })
      .eq('id', victim.adventureId)
      .select()
      .single()

    // RLS should block this
    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })

  it('should prevent deleting adventures owned by another user', async () => {
    const attackerClient = getTestSupabaseClient() // Not authenticated

    const { error } = await attackerClient.from('adventures').delete().eq('id', victim.adventureId)

    // RLS should block this
    expect(error).toBeTruthy()
  })
})
```

### Test 3: Guest Token Isolation

**File: `tests/integration/rls/guest-token-isolation.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createGuestToken, cleanupGuestToken, getTestSupabaseClient } from '@/tests/helpers/testDb'

describe('RLS: Guest Token Isolation', () => {
  it('should prevent guest token from accessing other guests adventures', async () => {
    const guest1 = await createGuestToken()
    const guest2 = await createGuestToken()

    // Guest 1 creates adventure
    const client1 = getTestSupabaseClient()
    const { data: adventure1 } = await client1
      .from('adventures')
      .insert({
        guest_token_id: guest1.token,
        tenant_id: guest1.token, // Guest uses token as tenant_id
        title: 'Guest 1 Adventure',
        frame: 'Witherwild',
      })
      .select()
      .single()

    // Guest 2 tries to read Guest 1's adventure
    const client2 = getTestSupabaseClient()
    const { data: stolenAdventure, error } = await client2
      .from('adventures')
      .select('*')
      .eq('id', adventure1!.id)
      .single()

    // RLS should block this
    expect(stolenAdventure).toBeNull()
    expect(error).toBeTruthy()

    await cleanupGuestToken(guest1.token)
    await cleanupGuestToken(guest2.token)
  })
})
```

---

## Manual Verification Steps

### 1. Test with Supabase SQL Editor

**Simulate attacker scenario:**

```sql
-- Step 1: Create two users
INSERT INTO auth.users (id, email) VALUES
  ('user-1-uuid', 'victim@example.com'),
  ('user-2-uuid', 'attacker@example.com');

-- Step 2: Create adventure as victim
INSERT INTO adventures (id, user_id, tenant_id, title, frame)
VALUES ('adv-1', 'user-1-uuid', 'user-1-uuid', 'Victim Adventure', 'Witherwild');

-- Step 3: Try to read as attacker (should return 0 rows)
SET request.jwt.claims.sub = 'user-2-uuid';
SELECT * FROM adventures WHERE id = 'adv-1';

-- Expected: 0 rows (RLS blocked it)
```

### 2. Test with Postman/Insomnia

**Setup:**

1. Create two users in Supabase Auth
2. Get JWT tokens for both users
3. Create adventure as User 1
4. Try to access adventure with User 2's JWT

**Expected**: 403 Forbidden or empty result

---

## RLS Policy Template

For new tables, use this template:

```sql
-- Enable RLS
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- SELECT policy (read own data)
CREATE POLICY "Users can read own data"
ON your_table_name
FOR SELECT
USING (auth.uid() = tenant_id);

-- INSERT policy (create own data)
CREATE POLICY "Users can insert own data"
ON your_table_name
FOR INSERT
WITH CHECK (auth.uid() = tenant_id);

-- UPDATE policy (update own data)
CREATE POLICY "Users can update own data"
ON your_table_name
FOR UPDATE
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

-- DELETE policy (delete own data)
CREATE POLICY "Users can delete own data"
ON your_table_name
FOR DELETE
USING (auth.uid() = tenant_id);

-- Guest policy (if table supports guest access)
CREATE POLICY "Guest tokens can access own data"
ON your_table_name
FOR ALL
USING (
  guest_token_id IS NOT NULL
  AND guest_token_id IN (
    SELECT token FROM guest_tokens WHERE expires_at > NOW()
  )
  AND tenant_id = guest_token_id
);
```

---

## Automated Audit Script

**File: `scripts/audit-rls.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function auditRLS() {
  console.log('🔍 Starting RLS audit...\n')

  // Check 1: RLS enabled on all tables
  const { data: tablesWithoutRLS } = await supabase.rpc('get_tables_without_rls')

  if (tablesWithoutRLS && tablesWithoutRLS.length > 0) {
    console.error('❌ Tables without RLS:')
    tablesWithoutRLS.forEach((t) => console.error(`  - ${t.table_name}`))
    process.exit(1)
  }

  console.log('✅ All tables have RLS enabled')

  // Check 2: tenant_id column exists
  const { data: tablesWithoutTenantId } = await supabase.rpc('get_tables_without_tenant_id')

  if (tablesWithoutTenantId && tablesWithoutTenantId.length > 0) {
    console.warn('⚠️  Tables without tenant_id (verify these are lookup tables):')
    tablesWithoutTenantId.forEach((t) => console.warn(`  - ${t.table_name}`))
  }

  // Check 3: All tables have policies
  const { data: tablesWithoutPolicies } = await supabase.rpc('get_tables_without_policies')

  if (tablesWithoutPolicies && tablesWithoutPolicies.length > 0) {
    console.error('❌ Tables without RLS policies:')
    tablesWithoutPolicies.forEach((t) => console.error(`  - ${t.table_name}`))
    process.exit(1)
  }

  console.log('✅ All tables have RLS policies')
  console.log('\n🎉 RLS audit passed!')
}

auditRLS()
```

**Run audit:**

```bash
npx tsx scripts/audit-rls.ts
```

---

## Validation Checklist

Before merging database changes:

- [ ] RLS enabled on all new tables
- [ ] `tenant_id` column exists on all data tables
- [ ] Policies created for SELECT, INSERT, UPDATE, DELETE
- [ ] Automated RLS tests pass: `npm run test -- rls`
- [ ] Manual SQL verification completed
- [ ] Audit script passes: `npx tsx scripts/audit-rls.ts`

---

## Common Pitfalls

### ❌ Pitfall: Forgetting to Set tenant_id on INSERT

```typescript
// BAD: No tenant_id (RLS will block this!)
await supabase.from('adventures').insert({ title: 'My Adventure' })

// GOOD: Set tenant_id explicitly
const user = await supabase.auth.getUser()
await supabase.from('adventures').insert({
  title: 'My Adventure',
  tenant_id: user.data.user.id,
})
```

### ❌ Pitfall: Using Service Role Key in Client Code

```typescript
// BAD: Bypasses RLS (security hole!)
const supabase = createClient(url, serviceRoleKey)

// GOOD: Use anon key (respects RLS)
const supabase = createClient(url, anonKey)
```

### ❌ Pitfall: Not Testing Guest Access

Always test:

1. Authenticated user cannot access guest data
2. Guest cannot access authenticated user data
3. Guest A cannot access Guest B data

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-10-18
**Maintainer**: DaggerGM Team
**Audit Frequency**: Weekly + Before Production Deploy
