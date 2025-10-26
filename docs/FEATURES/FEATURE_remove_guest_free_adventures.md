# Feature: Remove Guest Free Adventures

**Status**: Not Started
**Priority**: 🔴 Critical
**Phase**: 1 - Fix Business Model
**Estimated Time**: 45 minutes
**Dependencies**: None

---

## Overview

Remove the ability for guests to generate free adventures. Per SYSTEM_OVERVIEW.md, MVP guests must have credits to generate. This fixes a critical business model flaw where guests currently get one free adventure.

---

## Acceptance Criteria

- [ ] Unauthenticated users cannot call `generateAdventure()`
- [ ] `generateAdventure()` returns clear error for unauthenticated requests
- [ ] Guest-related code removed from `generateAdventure()` Server Action
- [ ] Homepage "Try as Guest" button removed
- [ ] Integration tests verify guests are blocked
- [ ] No breaking changes to authenticated user flow
- [ ] All existing tests still pass

---

## Technical Specification

### Code Changes

#### 1. Update `app/actions/adventures.ts`

**Remove lines 83-106** (guest logic):

```typescript
// DELETE THIS SECTION:
// Check if this is a guest user
if (!userId && validatedConfig.guestEmail) {
  isGuest = true
  // For guests, we'll create one free adventure
  // In a full implementation, you'd check if this email has already created a free adventure
} else if (!userId) {
  return { success: false, error: 'Authentication required' }
}

// Only consume credit for authenticated users
if (userId && !isGuest) {
  try {
    await creditManager.consumeCredit(userId, 'adventure', { adventureId })
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return { success: false, error: 'Insufficient credits to generate adventure' }
    }
    throw error
  }
}
```

**Replace with**:

```typescript
// Require authentication
if (!userId) {
  return { success: false, error: 'Authentication required. Please log in to generate adventures.' }
}

// Consume credit
try {
  await creditManager.consumeCredit(userId, 'adventure', { adventureId })
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    return { success: false, error: 'Insufficient credits to generate adventure' }
  }
  throw error
}
```

**Remove `isGuest` variable** declaration (line 55):

```typescript
// DELETE:
let isGuest = false
```

**Remove guest token logic** (lines 168-173):

```typescript
// DELETE:
// Add user_id for authenticated users, guest_email for guests
if (isGuest) {
  adventureData.guest_email = validatedConfig.guestEmail || null
  adventureData.guest_token = crypto.randomUUID()
} else {
  adventureData.user_id = userId
}
```

**Replace with**:

```typescript
// Always add user_id for authenticated users
adventureData.user_id = userId
```

**Remove guest response logic** (lines 191-199):

```typescript
// DELETE:
// For guest users, return the guest token along with the adventure ID
if (isGuest && adventure.guest_token) {
  console.log('Returning guest adventure with token')
  return {
    success: true,
    adventureId: adventure.id,
    guestToken: adventure.guest_token,
    isGuest: true,
  }
}
```

**Update refund logic** (line 208):

```typescript
// CHANGE FROM:
if (userId && adventureId && !isGuest) {

// CHANGE TO:
if (userId && adventureId) {
```

**Remove `guestEmail` from config** (lines 16-28 and 41):

```typescript
// In AdventureConfig interface, DELETE:
guestEmail?: string

// In validation, DELETE:
guestEmail: config.guestEmail,
```

#### 2. Update `app/page.tsx`

**Remove "Try as Guest" button** (lines 35-39):

```typescript
// DELETE:
<Link href="/adventures/new">
  <Button variant="outline" size="lg">
    Try as Guest
  </Button>
</Link>
```

#### 3. Update `lib/validation/schemas.ts`

Find `adventureConfigSchema` and **remove `guestEmail` field** if present.

---

## Testing Requirements

### Integration Tests

**File**: `tests/integration/guest-restrictions.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { generateAdventure } from '@/app/actions/adventures'

describe('Guest Restrictions', () => {
  it('should reject unauthenticated adventure generation', async () => {
    const config = {
      frame: 'witherwild',
      focus: 'mystery',
      party_size: 4,
      party_level: 2,
      difficulty: 'standard' as const,
      stakes: 'personal' as const,
    }

    // Call without authentication (no userId in session)
    const result = await generateAdventure(config)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Authentication required')
  })

  it('should not accept guestEmail parameter', async () => {
    const config = {
      frame: 'witherwild',
      focus: 'mystery',
      party_size: 4,
      party_level: 2,
      difficulty: 'standard' as const,
      stakes: 'personal' as const,
      guestEmail: 'guest@example.com', // Should be ignored/rejected
    }

    const result = await generateAdventure(config)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Authentication required')
  })
})
```

### Update Existing Tests

**File**: `tests/integration/adventures.test.ts` (if exists)

Ensure all adventure generation tests use authenticated context. Remove any guest-related test cases.

---

## Implementation Steps

1. **Update `app/actions/adventures.ts`**
   - Remove all guest-related logic
   - Simplify authentication check
   - Remove `isGuest` variable and conditions

2. **Update `app/page.tsx`**
   - Remove "Try as Guest" button

3. **Update validation schema**
   - Remove `guestEmail` from `adventureConfigSchema`

4. **Write integration tests**
   - Create `tests/integration/guest-restrictions.test.ts`
   - Verify unauthenticated requests are blocked

5. **Run existing tests**
   - Ensure no regressions: `npm run test:coverage`
   - Fix any broken tests that relied on guest access

6. **Manual verification**
   - Start dev server: `npm run dev`
   - Verify homepage has no "Try as Guest" button
   - Verify `/adventures/new` redirects to login when not authenticated

7. **Commit changes**
   - Message: "feat: remove guest free adventures, require authentication"

---

## Verification Checklist

- [ ] `generateAdventure()` requires authentication
- [ ] No `isGuest` logic remains in codebase
- [ ] Homepage "Try as Guest" button removed
- [ ] New integration tests pass
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Manual QA: cannot generate adventure without login

---

## Migration Strategy

**Existing Guest Adventures**: This change does not affect existing guest adventures in the database. They can remain as historical data. Future features can:

- Display them on a public showcase page
- Convert them to sample adventures
- Delete them after 30 days

**No database migration needed** for this feature.

---

## References

- **Gap Analysis**: [docs/IMPLEMENTATION_GAP_ANALYSIS.md:174-193](../IMPLEMENTATION_GAP_ANALYSIS.md#L174-L193)
- **System Overview**: [docs/SYSTEM_OVERVIEW.md:122-131](../SYSTEM_OVERVIEW.md#L122-L131)
- **Current Implementation**: [app/actions/adventures.ts:83-106](../../app/actions/adventures.ts#L83-L106)

---

## Rollback Plan

If issues arise, revert commit. No database changes to rollback.

---

**Created**: 2025-10-24
**Last Updated**: 2025-10-24
