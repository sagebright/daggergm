# Guest System Implementation Guide

**Purpose**: Token-based guest access allowing one free adventure before requiring signup.

**Security Level**: CRITICAL - 100% test coverage required

---

## Overview

The guest system allows unauthenticated users to generate one free adventure without creating an account. After using their free credit, they must sign up to continue.

### Key Features

- UUID-based token generation (cryptographically secure)
- 24-hour token expiry (enforced by RLS)
- Single-use credit per token
- Seamless conversion to authenticated user
- Full RLS isolation (guests cannot access each other's adventures)

---

## Database Schema

### Guest Tokens Table

```sql
-- Create guest_tokens table
CREATE TABLE guest_tokens (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Guest access token (used as tenant_id for RLS)
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),

  -- Credits remaining (starts at 1, consumed after first adventure)
  credits_remaining INTEGER NOT NULL DEFAULT 1 CHECK (credits_remaining >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  -- Optional: Track conversion to authenticated user
  converted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_guest_tokens_token ON guest_tokens(token);
CREATE INDEX idx_guest_tokens_expires_at ON guest_tokens(expires_at);
CREATE INDEX idx_guest_tokens_converted ON guest_tokens(converted_to_user_id);

-- Enable RLS on guest_tokens table
ALTER TABLE guest_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a guest token (public)
CREATE POLICY "Anyone can create guest tokens"
ON guest_tokens
FOR INSERT
WITH CHECK (true);

-- Policy: Guests can read their own token data
CREATE POLICY "Guests can read own token"
ON guest_tokens
FOR SELECT
USING (
  token::text = current_setting('app.guest_token', true)
  OR auth.uid() IS NOT NULL  -- Authenticated users can query for conversion
);

-- Policy: No updates or deletes (tokens are immutable)
-- Conversion is handled by Server Action with service role key
```

### Adventures Table Updates

```sql
-- Add guest_token_id column to adventures table
ALTER TABLE adventures
ADD COLUMN guest_token_id UUID REFERENCES guest_tokens(token) ON DELETE CASCADE;

-- Index for guest adventure lookups
CREATE INDEX idx_adventures_guest_token ON adventures(guest_token_id);

-- Updated RLS policy for guest access
CREATE POLICY "Guests can access own adventures"
ON adventures
FOR ALL
USING (
  -- Authenticated user access (existing)
  auth.uid() = tenant_id
  OR
  -- Guest token access (new)
  (
    guest_token_id IS NOT NULL
    AND guest_token_id::text = current_setting('app.guest_token', true)
    AND guest_token_id IN (
      SELECT token FROM guest_tokens
      WHERE expires_at > NOW()
      AND credits_remaining >= 0
    )
  )
);
```

---

## Server Actions

### Generate Guest Token

**File: `src/features/guest/actions/generateGuestToken.ts`**

```typescript
'use server'

import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function generateGuestToken() {
  const supabase = getSupabaseServer()

  // Create guest token
  const { data: guestToken, error } = await supabase
    .from('guest_tokens')
    .insert({
      // token auto-generated via DEFAULT gen_random_uuid()
      credits_remaining: 1,
    })
    .select('token')
    .single()

  if (error || !guestToken) {
    throw new Error('Failed to create guest token')
  }

  // Store token in secure HTTP-only cookie
  cookies().set('guest_token', guestToken.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return { token: guestToken.token }
}
```

### Consume Guest Credit

**File: `src/features/guest/actions/consumeGuestCredit.ts`**

```typescript
'use server'

import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function consumeGuestCredit(): Promise<{ success: boolean; remaining: number }> {
  const supabase = getSupabaseServer()
  const guestToken = cookies().get('guest_token')?.value

  if (!guestToken) {
    throw new Error('No guest token found')
  }

  // Atomic credit consumption using RPC
  const { data, error } = await supabase.rpc('consume_guest_credit', {
    token_value: guestToken,
  })

  if (error) {
    throw new Error('Failed to consume guest credit: ' + error.message)
  }

  return {
    success: true,
    remaining: data.credits_remaining,
  }
}
```

**Database Function:**

```sql
-- RPC function for atomic guest credit consumption
CREATE OR REPLACE FUNCTION consume_guest_credit(token_value UUID)
RETURNS TABLE(credits_remaining INTEGER) AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Lock row and check credits
  SELECT gt.credits_remaining INTO current_credits
  FROM guest_tokens gt
  WHERE gt.token = token_value
    AND gt.expires_at > NOW()
  FOR UPDATE;

  -- Check if token exists and has credits
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'Guest token not found or expired';
  END IF;

  IF current_credits < 1 THEN
    RAISE EXCEPTION 'No guest credits remaining';
  END IF;

  -- Decrement credit
  UPDATE guest_tokens
  SET credits_remaining = credits_remaining - 1
  WHERE token = token_value;

  -- Return updated balance
  RETURN QUERY
  SELECT gt.credits_remaining
  FROM guest_tokens gt
  WHERE gt.token = token_value;
END;
$$ LANGUAGE plpgsql;
```

### Convert Guest to User

**File: `src/features/guest/actions/convertGuestToUser.ts`**

```typescript
'use server'

import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function convertGuestToUser(userId: string) {
  const supabase = getSupabaseServer()
  const guestToken = cookies().get('guest_token')?.value

  if (!guestToken) {
    return { success: false, message: 'No guest token found' }
  }

  // Transfer guest adventures to authenticated user
  const { error: updateError } = await supabase
    .from('adventures')
    .update({
      user_id: userId,
      tenant_id: userId,
      guest_token_id: null, // Remove guest association
    })
    .eq('guest_token_id', guestToken)

  if (updateError) {
    throw new Error('Failed to transfer guest adventures')
  }

  // Mark guest token as converted
  const { error: tokenError } = await supabase
    .from('guest_tokens')
    .update({
      converted_to_user_id: userId,
      converted_at: new Date().toISOString(),
    })
    .eq('token', guestToken)

  if (tokenError) {
    console.error('Failed to mark token as converted:', tokenError)
  }

  // Clear guest token cookie
  cookies().delete('guest_token')

  // Revalidate user's adventures page
  revalidatePath('/adventures')

  return { success: true }
}
```

---

## Client-Side Usage

### Check Guest Status

**File: `src/features/guest/hooks/useGuestStatus.ts`**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { checkGuestStatus } from '../actions/checkGuestStatus'

export function useGuestStatus() {
  return useQuery({
    queryKey: ['guest-status'],
    queryFn: checkGuestStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**Server Action:**

```typescript
'use server'

import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function checkGuestStatus() {
  const supabase = getSupabaseServer()
  const guestToken = cookies().get('guest_token')?.value

  if (!guestToken) {
    return { isGuest: false, creditsRemaining: 0 }
  }

  const { data, error } = await supabase
    .from('guest_tokens')
    .select('credits_remaining, expires_at')
    .eq('token', guestToken)
    .single()

  if (error || !data) {
    return { isGuest: false, creditsRemaining: 0 }
  }

  // Check expiry
  const isExpired = new Date(data.expires_at) < new Date()

  return {
    isGuest: true,
    creditsRemaining: isExpired ? 0 : data.credits_remaining,
    expiresAt: data.expires_at,
  }
}
```

---

## Testing Requirements

### Integration Tests (100% Coverage Required)

**File: `tests/integration/guest/consumeGuestCredit.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createGuestToken, cleanupGuestToken } from '@/tests/helpers/testDb'
import { consumeGuestCredit } from '@/features/guest/actions/consumeGuestCredit'

describe('consumeGuestCredit (Integration - CRITICAL)', () => {
  let guestToken: string

  beforeEach(async () => {
    const guest = await createGuestToken()
    guestToken = guest.token
  })

  afterEach(async () => {
    await cleanupGuestToken(guestToken)
  })

  it('should consume guest credit atomically', async () => {
    const result = await consumeGuestCredit()

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(0) // Started with 1, now 0
  })

  it('should prevent double consumption (race condition test)', async () => {
    // Simulate concurrent requests
    const [result1, result2] = await Promise.allSettled([
      consumeGuestCredit(),
      consumeGuestCredit(),
    ])

    // One should succeed, one should fail
    const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled')
    const failed = [result1, result2].filter((r) => r.status === 'rejected')

    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
  })

  it('should reject consumption of expired token', async () => {
    // TODO: Set token expiry in past and verify rejection
  })
})
```

### RLS Tests (100% Coverage Required)

**File: `tests/integration/rls/guest-isolation.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { createGuestToken, createTestAdventure, cleanupGuestToken } from '@/tests/helpers/testDb'

describe('RLS: Guest Token Isolation (CRITICAL)', () => {
  it('should prevent guest A from accessing guest B adventures', async () => {
    const guestA = await createGuestToken()
    const guestB = await createGuestToken()

    // Guest A creates adventure
    const { adventure } = await createTestAdventure({
      guestToken: guestA.token,
    })

    // Guest B tries to access Guest A's adventure (should fail)
    const supabase = getTestSupabaseClient()

    // Set Guest B's token
    await supabase.rpc('set_guest_token', { token: guestB.token })

    const { data, error } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventure.id)
      .single()

    // RLS should block this
    expect(data).toBeNull()
    expect(error).toBeTruthy()

    await cleanupGuestToken(guestA.token)
    await cleanupGuestToken(guestB.token)
  })

  it('should prevent authenticated user from accessing guest adventures', async () => {
    const guest = await createGuestToken()
    const user = await createTestUser()

    // Guest creates adventure
    const { adventure } = await createTestAdventure({
      guestToken: guest.token,
    })

    // Authenticated user tries to access guest adventure (should fail)
    const supabase = getTestSupabaseClient()
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: 'test-password',
    })

    const { data, error } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventure.id)
      .single()

    // RLS should block this
    expect(data).toBeNull()
    expect(error).toBeTruthy()

    await cleanupGuestToken(guest.token)
    await cleanupTestData(user.id)
  })
})
```

---

## Security Checklist

Before deploying guest system:

- [ ] RLS policies tested (100% coverage)
- [ ] Token generation uses cryptographically secure UUIDs
- [ ] HTTP-only cookies prevent XSS attacks
- [ ] 24-hour expiry enforced by database trigger
- [ ] Atomic credit consumption prevents race conditions
- [ ] Guest cannot access other guests' adventures
- [ ] Guest cannot access authenticated users' adventures
- [ ] Authenticated users cannot access guest adventures
- [ ] Token conversion tested (guest → authenticated)
- [ ] Expired tokens rejected by RLS

---

## Common Pitfalls

### ❌ Pitfall: Forgetting to Set guest_token_id

```typescript
// BAD: Guest adventure without guest_token_id
await supabase.from('adventures').insert({
  title: 'Guest Adventure',
  // Missing guest_token_id!
})

// GOOD: Explicitly set guest_token_id
const guestToken = cookies().get('guest_token')?.value
await supabase.from('adventures').insert({
  title: 'Guest Adventure',
  guest_token_id: guestToken,
  tenant_id: guestToken, // Guest uses token as tenant_id
})
```

### ❌ Pitfall: Not Handling Token Expiry

```typescript
// BAD: Assuming token is always valid
const result = await consumeGuestCredit()

// GOOD: Check expiry first
const status = await checkGuestStatus()
if (!status.isGuest || status.creditsRemaining < 1) {
  redirect('/signup')
}
const result = await consumeGuestCredit()
```

### ❌ Pitfall: Leaking Guest Token in Client Code

```typescript
// BAD: Guest token in client-side state
const [guestToken, setGuestToken] = useState(token)

// GOOD: Guest token only in HTTP-only cookies
// Access via Server Actions only
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-18
**Test Coverage Required**: 100% (security-critical)
**Review Frequency**: Before every production deploy
