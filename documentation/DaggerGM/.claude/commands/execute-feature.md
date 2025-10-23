# Execute Feature (TDD Workflow)

**Purpose**: Implement a new feature using Test-Driven Development (RED → GREEN → REFACTOR).

**When to use**:

- Implementing a new user-facing feature
- Adding new Server Actions
- Building new UI components with business logic

**Do NOT use for**:

- Simple UI changes (no business logic)
- Documentation updates
- Configuration changes

---

## Prerequisites

Before running this command:

1. Feature requirements are clear (if not, ask questions!)
2. Database schema changes are migrated (if needed)
3. Test infrastructure is set up (`/setup-testing-infrastructure`)

---

## Execution Steps

### Phase 1: Planning (5-10 minutes)

1. **Understand the feature**:
   - What problem does it solve?
   - What are the acceptance criteria?
   - What are the edge cases?

2. **Identify test types needed**:
   - [ ] Integration tests (Server Actions + Database)
   - [ ] E2E tests (User interactions)
   - [ ] Unit tests (Pure functions, validators)

3. **Plan file structure**:

   ```
   src/features/[feature-name]/
   ├── components/
   │   ├── [Component].tsx
   │   └── __tests__/
   │       └── [Component].test.tsx
   ├── actions/
   │   ├── [action].ts
   │   └── __tests__/
   │       └── [action].test.ts
   ├── hooks/
   │   ├── use[Feature].ts
   │   └── __tests__/
   │       └── use[Feature].test.ts
   └── schemas/
       ├── [feature].ts
       └── __tests__/
           └── [feature].test.ts
   ```

4. **Create TODO checklist**:
   Use TodoWrite tool to create tasks for:
   - Write integration tests (RED)
   - Implement Server Actions (GREEN)
   - Write component tests (RED)
   - Implement UI components (GREEN)
   - Write E2E tests (RED)
   - Implement E2E flow (GREEN)
   - Refactor for quality
   - Verify coverage (≥99%)

---

### Phase 2: RED - Write Failing Tests

#### 2.1 Start with Integration Tests (Server Actions + Database)

**Example: Implementing `regenerateMovement` Server Action**

**File: `src/features/adventure/actions/__tests__/regenerateMovement.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestAdventure, cleanupTestData } from '@/tests/helpers/testDb'
import { mockOpenAI } from '@/tests/helpers/mockLLM'
import { regenerateMovement } from '../regenerateMovement'

describe('regenerateMovement (Integration)', () => {
  let adventureId: string
  let movementId: string
  let userId: string

  beforeEach(async () => {
    const { adventure, movements, userId: uid } = await createTestAdventure()
    adventureId = adventure.id
    movementId = movements[0].id
    userId = uid
  })

  afterEach(async () => {
    await cleanupTestData(userId)
  })

  it('should regenerate movement with new LLM content', async () => {
    mockOpenAI.mockMovementResponse({
      description: 'NEW DESCRIPTION FROM LLM',
      npcs: [{ name: 'New NPC', role: 'ally' }],
      rewards: ['New reward'],
    })

    const result = await regenerateMovement(movementId)

    expect(result.description).toBe('NEW DESCRIPTION FROM LLM')
    expect(result.npcs[0].name).toBe('New NPC')
  })

  it('should throw error if movement not found', async () => {
    await expect(regenerateMovement('non-existent-id')).rejects.toThrow('Movement not found')
  })

  it('should respect RLS and block unauthorized regeneration', async () => {
    const { userId: attackerId } = await createTestAdventure()

    await expect(regenerateMovement(movementId, { actingUserId: attackerId })).rejects.toThrow(
      'Unauthorized',
    )

    await cleanupTestData(attackerId)
  })

  // TODO: Add more edge cases
})
```

**Run tests** (should FAIL):

```bash
npm run test:watch -- regenerateMovement
```

Expected output: `❌ Cannot find module '../regenerateMovement'`

#### 2.2 Write Component Tests

**File: `src/features/adventure/components/__tests__/MovementEditor.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MovementEditor } from '../MovementEditor';

describe('MovementEditor (Component)', () => {
  it('should display regenerate button', () => {
    const mockMovement = {
      id: 'movement-1',
      description: 'Test description',
      npcs: [],
      rewards: [],
    };

    render(<MovementEditor movement={mockMovement} />);

    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('should call regenerate action when button clicked', async () => {
    const mockRegenerate = vi.fn();
    const mockMovement = { id: 'movement-1', description: 'Test' };

    render(
      <MovementEditor
        movement={mockMovement}
        onRegenerate={mockRegenerate}
      />
    );

    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(mockRegenerate).toHaveBeenCalledWith('movement-1');
    });
  });

  // TODO: Add loading state tests, error handling tests
});
```

**Run tests** (should FAIL):

```bash
npm run test:watch -- MovementEditor
```

---

### Phase 3: GREEN - Implement Minimal Code

#### 3.1 Implement Server Action

**File: `src/features/adventure/actions/regenerateMovement.ts`**

```typescript
'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { generateMovement } from '@/features/generation/services/movementGenerator'
import { revalidatePath } from 'next/cache'

export async function regenerateMovement(movementId: string, options?: { actingUserId?: string }) {
  const supabase = getSupabaseServer()

  // Fetch existing movement with adventure context
  const { data: movement, error } = await supabase
    .from('movements')
    .select(
      `
      *,
      adventure:adventures(*)
    `,
    )
    .eq('id', movementId)
    .single()

  if (error || !movement) {
    throw new Error('Movement not found')
  }

  // RLS check (optional - RLS handles this, but explicit check is clearer)
  const user = await supabase.auth.getUser()
  if (options?.actingUserId && user.data.user?.id !== movement.tenant_id) {
    throw new Error('Unauthorized')
  }

  // Generate new content via LLM
  const newContent = await generateMovement({
    frame: movement.adventure.frame,
    movementNumber: movement.order + 1,
  })

  // Update database
  const { data: updated, error: updateError } = await supabase
    .from('movements')
    .update({
      description: newContent.description,
      npcs: newContent.npcs,
      rewards: newContent.rewards,
      updated_at: new Date().toISOString(),
    })
    .eq('id', movementId)
    .select()
    .single()

  if (updateError || !updated) {
    throw new Error('Failed to update movement')
  }

  // Revalidate cache
  revalidatePath(`/adventures/${movement.adventure_id}`)

  return updated
}
```

**Run tests** (should PASS):

```bash
npm run test:watch -- regenerateMovement
```

Expected output: `✅ All tests passing`

#### 3.2 Implement Component

**File: `src/features/adventure/components/MovementEditor.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { regenerateMovement } from '../actions/regenerateMovement';
import type { Movement } from '@/types/database.types';

interface MovementEditorProps {
  movement: Movement;
  onRegenerate?: (id: string) => void;
}

export function MovementEditor({ movement, onRegenerate }: MovementEditorProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    try {
      await regenerateMovement(movement.id);
      onRegenerate?.(movement.id);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">Movement {movement.order + 1}</h3>
      <p className="text-sm text-gray-600">{movement.description}</p>

      <Button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="mt-4"
      >
        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
      </Button>
    </Card>
  );
}
```

**Run tests** (should PASS):

```bash
npm run test:watch -- MovementEditor
```

---

### Phase 4: REFACTOR - Improve Code Quality

#### 4.1 Check for Improvements

Run through this checklist:

- [ ] Error handling comprehensive?
- [ ] Loading states handled?
- [ ] Optimistic updates implemented?
- [ ] Type safety complete?
- [ ] File under 300 lines?
- [ ] No code duplication?

#### 4.2 Apply Refactorings

**Example: Add optimistic updates**

```typescript
// src/features/adventure/hooks/useOptimisticMovement.ts
import { useOptimistic } from 'react'
import type { Movement } from '@/types/database.types'

export function useOptimisticMovement(movement: Movement) {
  const [optimisticMovement, setOptimisticMovement] = useOptimistic(
    movement,
    (state, newContent: Partial<Movement>) => ({
      ...state,
      ...newContent,
    }),
  )

  return {
    movement: optimisticMovement,
    updateOptimistic: setOptimisticMovement,
  }
}
```

Update component to use hook:

```typescript
export function MovementEditor({ movement, onRegenerate }: MovementEditorProps) {
  const { movement: optimisticMovement, updateOptimistic } = useOptimisticMovement(movement);

  const handleRegenerate = async () => {
    // Optimistic update
    updateOptimistic({ description: 'Regenerating...' });

    try {
      const updated = await regenerateMovement(movement.id);
      updateOptimistic(updated);
      onRegenerate?.(movement.id);
    } catch (error) {
      // Rollback on error
      updateOptimistic(movement);
      console.error('Failed to regenerate:', error);
    }
  };

  return (
    <Card className="p-4">
      <h3>Movement {optimisticMovement.order + 1}</h3>
      <p>{optimisticMovement.description}</p>
      <Button onClick={handleRegenerate}>Regenerate</Button>
    </Card>
  );
}
```

**Run tests again** (should still PASS):

```bash
npm run test:watch
```

---

### Phase 5: E2E Tests (If Needed)

**File: `tests/e2e/regenerate-movement.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { login, createTestAdventure } from './helpers'

test.describe('Regenerate Movement', () => {
  test('should regenerate movement on button click', async ({ page }) => {
    const { adventureId, movements, userId } = await createTestAdventure()
    await login(page, userId)

    await page.goto(`/adventures/${adventureId}/edit`)

    const originalDescription = await page.textContent('[data-testid="movement-1-description"]')

    await page.click('[data-testid="movement-1-regenerate"]')

    // Wait for regeneration to complete
    await page.waitForSelector('[data-testid="movement-1-description"]', {
      state: 'visible',
    })

    const newDescription = await page.textContent('[data-testid="movement-1-description"]')

    expect(newDescription).not.toBe(originalDescription)
  })
})
```

---

### Phase 6: Verify Coverage

Run coverage report:

```bash
npm run test:coverage
```

Check coverage for your new files:

- Integration tests: ≥99%
- Component tests: ≥99%
- E2E tests: User flows covered

If coverage is below 99%, add tests for uncovered branches:

```bash
open coverage/index.html
# Navigate to your file and identify uncovered lines
```

---

## Validation Checklist

- [ ] All integration tests pass
- [ ] All component tests pass
- [ ] All E2E tests pass (if applicable)
- [ ] Coverage ≥99% for new code
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] File size <300 lines (all new files)
- [ ] RLS policies tested (if database access)
- [ ] Error handling implemented
- [ ] Loading states implemented (UI)

---

## Troubleshooting

### Issue: Tests pass locally but fail in CI

**Solution**: Check for race conditions, use `waitFor` in React Testing Library, ensure database cleanup in `afterEach`.

### Issue: Coverage not reaching 99%

**Solution**: Open `coverage/index.html`, find uncovered branches, add tests for edge cases (error paths, null checks, etc.).

### Issue: E2E tests are flaky

**Solution**: Use Playwright's auto-waiting (`expect().toBeVisible()`), avoid hard-coded `setTimeout`, ensure test data is isolated.

---

**Command Version**: 1.0.0
**Last Updated**: 2025-10-18
**Maintainer**: DaggerGM Team
