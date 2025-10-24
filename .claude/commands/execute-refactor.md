# Execute Refactor - File Size Reduction

**Purpose**: Refactor large files (>300 lines) into smaller, focused modules using checkpoint-driven approach for DaggerGM.

## Target: $ARGUMENTS

---

## 🎯 DaggerGM File Size Limit: 300 Lines

Files exceeding 300 lines MUST be refactored into smaller modules.

**Enforced by**: ESLint rule `max-lines` and `./scripts/validate-file-size.sh`

---

## 🚨 CRITICAL: Checkpoint-Driven Workflow

This command uses **mandatory checkpoints** to prevent incomplete refactorings.

### Workflow Pattern

```
PHASE → VALIDATE → ✋ CHECKPOINT → USER APPROVES → NEXT PHASE
```

---

## 📋 PHASE 0: Setup & Analysis

### Actions:

1. **Read the refactor spec**: `$ARGUMENTS`
2. **Create feature branch**: `refactor/[module-name]-$(date +%Y%m%d)`
3. **Verify clean state**: Run `npm run lint && npm test` (must pass)
4. **Analyze target file**:
   - Count exact lines: `wc -l [file]`
   - Identify if Server Component or Client Component
   - Map Server Actions vs client-side logic
   - Check existing tests
5. **Create refactoring plan** using TodoWrite

### Next.js-Specific Analysis:

```typescript
// Identify component type:
// ❌ Mixed concerns in one file (400 lines)
'use client' // Client Component with Server logic mixed in

export default function AdventurePage() {
  // 100 lines of Server Action calls
  // 100 lines of Zustand state
  // 100 lines of UI components
  // 100 lines of utilities
}

// ✅ Target structure:
// app/adventures/[id]/page.tsx (50 lines) - Server Component
// features/adventures/AdventureClient.tsx (100 lines) - Client Component
// features/adventures/actions.ts (80 lines) - Server Actions
// features/adventures/hooks/useAdventureState.ts (70 lines) - Zustand/hooks
// lib/utils/adventure-helpers.ts (50 lines) - Utilities
```

### Validation:

```bash
git branch --show-current       # Must show feature branch
npm run lint                    # Must pass
npm test                        # Must pass
wc -l [target-file]            # Document baseline
```

### ✋ CHECKPOINT 0

**STOP HERE. Report to user:**

- Branch name: [feature-branch]
- Target file: [path] ([current-lines] lines)
- Component type: Server / Client / Mixed
- Proposed extraction plan: [TodoWrite summary]
- Estimated difficulty: Low / Medium / High

**Wait for user approval to proceed.**

---

## 📋 PHASE 1: Extract Server Actions (If Applicable)

### Actions:

1. **Identify Server Actions** (`'use server'` functions)
2. **Create actions file**: `features/[feature]/actions.ts`
3. **Move all Server Actions** to new file
4. **Add proper validation**:
   - Zod schemas for input validation
   - User authentication checks
   - RLS policy enforcement
5. **Update imports** in main file
6. **Run tests**: `npm test -- [test-file]`
7. **Commit**: `refactor: extract Server Actions from [module]`

### DaggerGM Server Actions Pattern:

```typescript
// features/adventures/actions.ts
'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const updateAdventureSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string(),
})

export async function updateAdventure(data: z.infer<typeof updateAdventureSchema>) {
  // Validate input
  const validated = updateAdventureSchema.parse(data)

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Update with RLS enforcement (user_id filter)
  const { data: adventure, error } = await supabase
    .from('adventures')
    .update({
      title: validated.title,
      content: validated.content,
    })
    .eq('id', validated.id)
    .eq('user_id', user.id) // CRITICAL: user isolation
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/adventures/${validated.id}`)
  return adventure
}
```

### Validation:

```bash
npm run lint                    # Must pass
npm test -- features/adventures # Must pass
grep -r "use server" features/  # Verify Server Actions extracted
```

### ✋ CHECKPOINT 1

**STOP HERE. Report to user:**

- Server Actions file: [path] ([lines])
- Main file reduced: [before] → [after] lines
- Tests passing: ✅/❌
- Commit hash: [hash]

**Wait for user approval to proceed.**

---

## 📋 PHASE 2: Extract Client Components

### Actions:

1. **Identify Client Component logic** (`useState`, `useEffect`, event handlers)
2. **Create component file**: `features/[feature]/components/[ComponentName].tsx`
3. **Add `'use client'` directive** at top
4. **Move client-side logic** and UI
5. **Update main file** to import and use component
6. **Run tests**: `npm test`
7. **Commit**: `refactor: extract [ComponentName] from [module]`

### Next.js Client Component Pattern:

```typescript
// features/adventures/components/AdventureEditor.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateAdventure } from '../actions'
import { useToast } from '@/hooks/use-toast'

interface AdventureEditorProps {
  adventureId: string
  initialTitle: string
  initialContent: string
}

export function AdventureEditor({
  adventureId,
  initialTitle,
  initialContent,
}: AdventureEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateAdventure({ id: adventureId, title, content })
      toast({ title: 'Saved successfully' })
    } catch (error) {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={handleSave} disabled={isSaving}>
        Save
      </Button>
    </div>
  )
}
```

### Main File Integration:

```typescript
// app/adventures/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { AdventureEditor } from '@/features/adventures/components/AdventureEditor'

export default async function AdventurePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Fetch data server-side
  const { data: adventure } = await supabase
    .from('adventures')
    .select()
    .eq('id', params.id)
    .single()

  if (!adventure) {
    return <div>Adventure not found</div>
  }

  // Pass data to Client Component
  return (
    <AdventureEditor
      adventureId={adventure.id}
      initialTitle={adventure.title}
      initialContent={adventure.content}
    />
  )
}
```

### Validation:

```bash
npm run lint                    # Must pass
npm test                        # Must pass
npm run dev                     # Verify page loads
wc -l [main-file]              # Document reduction
```

### ✋ CHECKPOINT 2

**STOP HERE. Report to user:**

- Client component: [path] ([lines])
- Main file reduced: [before] → [after] lines
- Main file uses component: ✅/❌
- Tests passing: ✅/❌
- Commit hash: [hash]

**CRITICAL**: Show code snippet proving main file uses the component.

**Wait for user approval to proceed.**

---

## 📋 PHASE 3: Extract Custom Hooks & State

### Actions:

1. **Identify Zustand stores or custom hooks**
2. **Create hook file**: `features/[feature]/hooks/use[HookName].ts`
3. **Move state management logic**
4. **Update component imports**
5. **Run tests**: `npm test`
6. **Commit**: `refactor: extract [hook-name] from [module]`

### Zustand Store Pattern:

```typescript
// stores/focusModeStore.ts
import { create } from 'zustand'

interface FocusModeStore {
  isFocusModeActive: boolean
  focusedFrameId: string | null
  setFocusMode: (active: boolean, frameId?: string | null) => void
}

export const useFocusModeStore = create<FocusModeStore>((set) => ({
  isFocusModeActive: false,
  focusedFrameId: null,
  setFocusMode: (active, frameId = null) =>
    set({ isFocusModeActive: active, focusedFrameId: frameId }),
}))
```

### Custom Hook Pattern:

```typescript
// features/adventures/hooks/useAdventureActions.ts
import { useTransition } from 'react'
import { updateAdventure, deleteAdventure } from '../actions'
import { useToast } from '@/hooks/use-toast'

export function useAdventureActions(adventureId: string) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleUpdate = (data: { title: string; content: string }) => {
    startTransition(async () => {
      try {
        await updateAdventure({ id: adventureId, ...data })
        toast({ title: 'Updated successfully' })
      } catch (error) {
        toast({ title: 'Update failed', variant: 'destructive' })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAdventure(adventureId)
        toast({ title: 'Deleted successfully' })
      } catch (error) {
        toast({ title: 'Delete failed', variant: 'destructive' })
      }
    })
  }

  return { handleUpdate, handleDelete, isPending }
}
```

### Validation:

```bash
npm run lint                    # Must pass
npm test                        # Must pass
wc -l [main-file]              # Should be close to <300
```

### ✋ CHECKPOINT 3

**STOP HERE. Report to user:**

- Hook/store created: [path] ([lines])
- Main file reduced: [before] → [after] lines
- Goal progress: [current-lines] / 300 target
- Tests passing: ✅/❌
- Commit hash: [hash]

**If main file is under 300 lines, proceed to Phase 4.**
**If still over 300, repeat Phase 2/3 for more extractions.**

**Wait for user approval to proceed.**

---

## 📋 PHASE 4: Extract Utilities & Helpers

### Actions:

1. **Identify pure utility functions**
2. **Create utils file**: `lib/utils/[feature]-helpers.ts`
3. **Move utility functions**
4. **Update imports** across all files
5. **Run tests**: `npm test`
6. **Commit**: `refactor: extract utilities from [module]`

### Utility Pattern:

```typescript
// lib/utils/adventure-helpers.ts

/**
 * Format adventure title for display
 */
export function formatAdventureTitle(title: string): string {
  return title.trim().slice(0, 100)
}

/**
 * Calculate adventure completion percentage
 */
export function calculateCompletionPercentage(
  totalFrames: number,
  completedFrames: number,
): number {
  if (totalFrames === 0) return 0
  return Math.round((completedFrames / totalFrames) * 100)
}

/**
 * Validate guest token expiry
 */
export function isGuestTokenValid(expiresAt: string | Date): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return expiry > new Date()
}
```

### Validation:

```bash
npm run lint                    # Must pass
npm test                        # Must pass
wc -l [main-file]              # Must be <300!
./scripts/validate-file-size.sh # Verify all files <300
```

### ✋ CHECKPOINT 4

**STOP HERE. Report to user:**

- Utilities created: [path] ([lines])
- **Main file: [lines] lines** (✅ under 300 / ❌ still over)
- Tests passing: ✅/❌
- Commit hash: [hash]

**If main file is under 300 lines, proceed to Phase 5.**
**If still over 300, identify remaining extraction opportunities.**

**Wait for user approval to proceed.**

---

## 📋 PHASE 5: Cleanup & Validation (Final)

### Actions:

1. **Remove dead code** and unused imports
2. **Add JSDoc comments** to exported functions
3. **Run full test suite**: `npm test`
4. **Run coverage**: `npm run test:coverage` (must be ≥90%)
5. **Run linter**: `npm run lint`
6. **Verify build**: `npm run build`
7. **Commit**: `refactor: finalize [module] - cleanup and docs`

### Final Validation:

```bash
# File size validation
./scripts/validate-file-size.sh

# Full test suite
npm test

# Coverage check
npm run test:coverage  # Must be ≥90%

# Lint check
npm run lint

# Build check
npm run build

# List all refactored files
git diff --stat main
```

### ✋ CHECKPOINT 5 (FINAL)

**STOP HERE. Report to user:**

**Refactoring Complete! Summary:**

- Main file: [before-lines] → [after-lines] (✅ under 300)
- Files created: [N] files
  - [file1]: [lines]
  - [file2]: [lines]
  - [file3]: [lines]
- All tests passing: ✅
- Coverage: [percentage]% (≥90% required)
- All commits: [list commit hashes]

**Next Steps:**

1. Push to GitHub: `git push -u origin [branch-name]`
2. Monitor CI/CD: `gh run watch`
3. Create PR when CI passes

**Wait for user to push and create PR.**

---

## 📋 PHASE 6: CI/CD & PR Creation

### User Actions:

```bash
# 1. Push feature branch
git push -u origin [branch-name]

# 2. Monitor CI/CD
gh run watch

# 3. Create PR when tests pass
gh pr create --title "refactor: [module-name] - reduce to <300 lines" \
             --body "Refactored [module] from [before] to [after] lines..."
```

### ✋ CHECKPOINT 6 (FINAL VALIDATION)

**Report when CI/CD completes:**

- CI/CD status: ✅ passing / ❌ failing
- Test results: [X/Y tests passing]
- Coverage: [percentage]%
- PR created: [URL]

**Refactoring workflow complete!**

---

## 🚨 Emergency Protocols

### If Tests Fail:

1. **STOP immediately**
2. **Investigate** the failing test
3. **Fix the issue** in current phase
4. **Re-run validation**
5. **Only proceed** when green

### If Main File Integration Broken:

1. **Verify import** exists in main file
2. **Verify component** is rendered/called
3. **Check for missing props** or type mismatches
4. **Run type check**: `npx tsc --noEmit`
5. **Fix before proceeding**

---

## 🎯 Success Criteria

### After Each Checkpoint:

- ✅ New file(s) created and under 300 lines each
- ✅ Main file line count reduced
- ✅ Main file USES the extracted code
- ✅ All tests passing
- ✅ TypeScript compiles (strict mode)
- ✅ Commit created with clear message

### Final Success Criteria:

- ✅ Main file under 300 lines
- ✅ All extracted files under 300 lines
- ✅ All tests passing
- ✅ Coverage ≥90%
- ✅ No behavior changes
- ✅ Clean commit history
- ✅ PR created and CI/CD passing

---

## 📚 Related Documentation

- **Code Quality**: [.claude/skills/code-quality.md](../skills/code-quality.md)
- **Server Actions**: [documentation/SERVER_ACTIONS.md](../../documentation/SERVER_ACTIONS.md)
- **Testing Strategy**: [documentation/TESTING_STRATEGY.md](../../documentation/TESTING_STRATEGY.md)

---

**Version**: 1.0 (DaggerGM)
**Adapted From**: bachlezard execute-refactor.md
**Target**: 300 lines (not 500)
**Next.js Specific**: Server Components, Client Components, Server Actions separation
**Usage**: `/execute-refactor documentation/REFACTOR/[file].md`
