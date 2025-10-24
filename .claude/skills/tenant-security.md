---
name: 'User Isolation Security Enforcer'
description: 'Auto-verify user_id isolation in all database operations - CRITICAL security validation'
---

# Multi-Tenant Security Enforcement (DaggerGM)

Auto-activates: ANY database query, Server Action, or data access code.

## AUTOMATED SECURITY AUDIT (Run First)

```bash
#!/bin/bash
# Execute this before ANY database-related code review

echo "🔒 USER ISOLATION SECURITY AUDIT (DaggerGM)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FAIL_COUNT=0

# 1. CRITICAL: Find Supabase queries WITHOUT user_id
echo "1️⃣  Scanning for queries missing user_id..."
MISSING_USER=$(grep -rn "supabase\.from" src --include="*.ts" --include="*.tsx" 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check next 10 lines for user_id or .auth.getUser()
  if ! sed -n "$linenum,$((linenum+10))p" "$file" 2>/dev/null | grep -q "user_id\|getUser()"; then
    echo "❌ $file:$linenum - Missing user_id filtering"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_USER" -gt 0 ]; then
  echo "   ❌ CRITICAL: $MISSING_USER queries without user_id"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_USER))
else
  echo "   ✅ All queries have user_id filtering"
fi

# 2. CRITICAL: Find Server Actions WITHOUT authentication
echo ""
echo "2️⃣  Scanning for Server Actions missing auth..."
MISSING_AUTH=$(grep -rn "'use server'" src --include="*.ts" --include="*.tsx" 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check next 20 lines for auth.getUser()
  if ! sed -n "$linenum,$((linenum+20))p" "$file" 2>/dev/null | grep -q "getUser()"; then
    echo "❌ $file:$linenum - Server Action missing auth check"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_AUTH" -gt 0 ]; then
  echo "   ❌ CRITICAL: $MISSING_AUTH Server Actions without auth"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_AUTH))
else
  echo "   ✅ All Server Actions have authentication"
fi

# 3. Check for hardcoded user_id values (UUIDs)
echo ""
echo "3️⃣  Scanning for hardcoded user_id..."
HARDCODED=$(grep -rn "user_id.*['\"].*-.*-.*-.*-" src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | wc -l | tr -d ' ')

if [ "$HARDCODED" -gt 0 ]; then
  echo "   ⚠️  WARNING: $HARDCODED potential hardcoded user_id (UUIDs)"
  grep -rn "user_id.*['\"].*-.*-.*-.*-" src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | head -5
else
  echo "   ✅ No hardcoded user_id values"
fi

# 4. Verify INSERT operations include user_id
echo ""
echo "4️⃣  Scanning INSERT operations..."
MISSING_INSERT_USER=$(grep -rn "\.insert(" src --include="*.ts" --include="*.tsx" 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check previous 10 lines for user_id assignment
  if ! sed -n "$((linenum-10)),$linenum p" "$file" 2>/dev/null | grep -q "user_id"; then
    echo "❌ $file:$linenum - INSERT missing user_id"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_INSERT_USER" -gt 0 ]; then
  echo "   ❌ CRITICAL: $MISSING_INSERT_USER INSERT without user_id"
  FAIL_COUNT=$((FAIL_COUNT + MISSING_INSERT_USER))
else
  echo "   ✅ All INSERT operations include user_id"
fi

# 5. Final verdict
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ SECURITY AUDIT FAILED: $FAIL_COUNT critical violations"
  echo "🚨 DO NOT MERGE - Fix violations before proceeding"
  exit 1
else
  echo "✅ SECURITY AUDIT PASSED: No critical violations"
  exit 0
fi
```

**Usage:**

```bash
# Save as: scripts/security-audit.sh
chmod +x scripts/security-audit.sh
./scripts/security-audit.sh
```

---

## MANDATORY QUERY PATTERN

### ✅ CORRECT: All database operations

```typescript
// 1️⃣  VALIDATE user exists (Server Action)
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAdventure(data: FormData) {
  const supabase = await createClient()

  // ALWAYS get authenticated user first
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2️⃣  SELECT with user_id
  const { data: adventures, error } = await supabase
    .from('adventures')
    .select('*')
    .eq('user_id', user.id) // ✅ REQUIRED - First filter
    .eq('status', 'published')

  // 3️⃣  INSERT with user_id
  const { data: adventure, error: insertError } = await supabase
    .from('adventures')
    .insert({
      title: data.get('title') as string,
      user_id: user.id, // ✅ REQUIRED - Inject before insert
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    return { success: false, error: 'Failed to create adventure' }
  }

  // 4️⃣  UPDATE with user_id
  const { error: updateError } = await supabase
    .from('adventures')
    .update({ title: 'New Title' })
    .eq('id', adventure.id)
    .eq('user_id', user.id) // ✅ REQUIRED - Double-verify ownership

  // 5️⃣  DELETE with user_id
  const { error: deleteError } = await supabase
    .from('adventures')
    .delete()
    .eq('id', adventure.id)
    .eq('user_id', user.id) // ✅ REQUIRED - Prevent cross-user delete

  revalidatePath('/adventures')
  return { success: true, data: adventure }
}
```

### ❌ REJECT: Security violations

```typescript
// ❌ CRITICAL: No user authentication
export async function getAdventures() {
  const supabase = await createClient()
  const { data } = await supabase.from('adventures').select('*')
  // Missing: auth.getUser() check
  return data
}

// ❌ CRITICAL: No user_id filter
export async function getAdventure(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data } = await supabase.from('adventures').select('*').eq('id', id)
  // Missing: .eq('user_id', user.id)
  return data
}

// ❌ CRITICAL: Client-side fetch (should use Server Action)
;('use client')
const response = await fetch('/api/adventures', {
  method: 'POST',
  body: JSON.stringify(data),
})
  // ❌ CRITICAL: Hardcoded user_id
  .eq('user_id', '00000000-0000-0000-0000-000000000000')
```

---

## MULTI-TENANT TEST REQUIREMENTS

Every Server Action MUST have this test pattern:

```typescript
import { describe, test, expect, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { createTestUser, createTestAdventure } from '@/tests/helpers'

describe('User isolation', () => {
  let user1: any, user2: any, adventure1: any

  beforeEach(async () => {
    // ✅ Setup two different users
    user1 = await createTestUser()
    user2 = await createTestUser()

    // ✅ Create adventure for user1
    adventure1 = await createTestAdventure(user1.id)
  })

  test('user2 CANNOT access user1 data', async () => {
    const supabase = await createClient()

    // Mock user2 session
    const { data, error } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventure1.id)
      .eq('user_id', user2.id) // Wrong user

    // ✅ MUST return empty (RLS blocks access)
    expect(data).toHaveLength(0)
  })

  test('user1 CAN access user1 data', async () => {
    const supabase = await createClient()

    const { data } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventure1.id)
      .eq('user_id', user1.id) // Correct user

    expect(data).toHaveLength(1)
    expect(data[0].user_id).toBe(user1.id)
  })

  test('unauthenticated request REJECTED', async () => {
    // Test Server Action without authentication
    const result = await createAdventure(new FormData())

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })
})
```

---

## SUCCESS CRITERIA (Binary Pass/Fail)

```bash
# All must exit 0:

# 1. No queries without user_id
! grep -r "supabase\.from" src --include="*.ts" --include="*.tsx" -A 5 2>/dev/null | grep -v "user_id\|getUser()"
# Exit 0 = PASS ✅

# 2. All Server Actions have auth
! grep -r "'use server'" src --include="*.ts" --include="*.tsx" -A 10 2>/dev/null | grep -v "getUser()"
# Exit 0 = PASS ✅

# 3. All tests include user isolation checks
grep -r "describe.*[Uu]ser.*isolation" src --include="*.test.ts" --include="*.test.tsx" 2>/dev/null | wc -l
# Result > 0 = PASS ✅

# 4. No hardcoded user IDs
! grep -r "user_id.*['\"].*-.*-.*-.*-" src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "//"
# Exit 0 = PASS ✅
```

**If ANY check fails → Code is NOT secure → DO NOT MERGE**

---

**Reference**: CLAUDE.md "Security & Multi-tenancy" section
**Enforcement**: CRITICAL - Zero tolerance for violations
**Auto-activate**: On ANY database or authentication code
