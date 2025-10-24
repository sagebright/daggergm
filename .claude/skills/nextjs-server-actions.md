---
name: 'Next.js Server Actions Enforcer'
description: 'Enforce Server Actions patterns for DaggerGM (NO Express routes - Server Actions only)'
---

# Next.js Server Actions Patterns (DaggerGM)

Auto-activates: Server Actions, mutations, API endpoints.

**CRITICAL**: DaggerGM uses **Server Actions ONLY** - NO Express server, NO API routes!

## MANDATORY SERVER ACTION PATTERN

### ✅ CORRECT: Server Action with Full Error Handling

```typescript
// features/adventures/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 1️⃣  Define validation schema
const AdventureSchema = z.object({
  title: z.string().min(3).max(100),
  frame: z.enum(['witherwild', 'celestial', 'undergrowth']),
  description: z.string().optional(),
})

// 2️⃣  Server Action with proper return type
export async function createAdventure(formData: FormData) {
  // 3️⃣  Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 4️⃣  Parse and validate input
  const rawData = {
    title: formData.get('title'),
    frame: formData.get('frame'),
    description: formData.get('description'),
  }

  const validation = AdventureSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    }
  }

  // 5️⃣  Database operation with user_id
  const { data, error } = await supabase
    .from('adventures')
    .insert({
      ...validation.data,
      user_id: user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create adventure:', error)
    return { success: false, error: 'Failed to create adventure' }
  }

  // 6️⃣  Revalidate cached pages
  revalidatePath('/adventures')
  revalidatePath(`/adventures/${data.id}`)

  // 7️⃣  Return success with data
  return { success: true, data }
}
```

### ❌ REJECT: API Route Pattern (DO NOT USE)

```typescript
// ❌ WRONG: API route (DaggerGM doesn't use these!)
// app/api/adventures/route.ts
export async function POST(request: Request) {
  // DON'T DO THIS - Use Server Actions instead
}

// ❌ WRONG: Client-side fetch
;('use client')
const response = await fetch('/api/adventures', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

---

## RETURN TYPE PATTERNS

### Pattern 1: Success/Error Object (Recommended)

```typescript
// ✅ Discriminated union for type safety
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

export async function updateAdventure(
  id: string,
  formData: FormData,
): Promise<ActionResult<Adventure>> {
  // ...

  if (error) {
    return { success: false, error: 'Update failed' }
  }

  return { success: true, data: adventure }
}
```

### Pattern 2: Redirect on Success

```typescript
import { redirect } from 'next/navigation'

export async function publishAdventure(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('adventures')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'Failed to publish' }
  }

  revalidatePath(`/adventures/${id}`)
  redirect(`/adventures/${id}`) // Redirect on success
}
```

---

## REVALIDATION PATTERNS

### Pattern 1: Path Revalidation

```typescript
import { revalidatePath } from 'next/cache'

// ✅ Revalidate specific paths
export async function deleteAdventure(id: string) {
  // ... delete operation

  revalidatePath('/adventures') // List page
  revalidatePath(`/adventures/${id}`) // Detail page
  revalidatePath('/', 'layout') // Revalidate layout (rare)
}
```

### Pattern 2: Tag Revalidation

```typescript
import { revalidateTag } from 'next/cache'

// ✅ Use tags for granular control
export async function getAdventure(id: string) {
  const supabase = await createClient()

  const { data } = await supabase.from('adventures').select('*').eq('id', id).single()

  // Cache with tag
  unstable_cache(async () => data, [`adventure-${id}`], { tags: [`adventure-${id}`] })

  return data
}

export async function updateAdventure(id: string, data: any) {
  // ... update

  revalidateTag(`adventure-${id}`) // Only revalidate this adventure
}
```

---

## FORM INTEGRATION PATTERNS

### Pattern 1: useFormState (Recommended)

```typescript
// features/adventures/AdventureForm.tsx
'use client'

import { useFormState } from 'react-dom'
import { createAdventure } from './actions'

export function AdventureForm() {
  const [state, formAction] = useFormState(createAdventure, {
    success: false,
    error: null
  })

  return (
    <form action={formAction}>
      <input name="title" required />
      <input name="frame" required />

      {state.error && (
        <p className="text-red-500">{state.error}</p>
      )}

      {state.errors?.title && (
        <p className="text-red-500">{state.errors.title[0]}</p>
      )}

      <button type="submit">Create Adventure</button>
    </form>
  )
}
```

### Pattern 2: useFormStatus (Loading States)

```typescript
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Adventure'}
    </button>
  )
}
```

---

## ERROR HANDLING PATTERNS

### Pattern 1: Structured Error Response

```typescript
export async function createAdventure(formData: FormData) {
  try {
    // Validation errors
    const validation = schema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors
      }
    }

    // Database errors
    const { data, error: dbError } = await supabase.from('adventures').insert(...)
    if (dbError) {
      console.error('Database error:', dbError)
      return {
        success: false,
        error: 'Database operation failed'
      }
    }

    return { success: true, data }

  } catch (error) {
    // Unexpected errors
    console.error('Unexpected error in createAdventure:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}
```

### Pattern 2: Custom Error Classes

```typescript
class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export async function protectedAction() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  // ... rest of action
}
```

---

## STREAMING PATTERNS (Advanced)

### Pattern 1: Server-Sent Events for LLM Generation

```typescript
'use server'

import { createStreamableValue } from 'ai/rsc'

export async function generateAdventureStream(prompt: string) {
  const stream = createStreamableValue('')

  ;(async () => {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || ''
      stream.update(content)
    }

    stream.done()
  })()

  return { stream: stream.value }
}

// Client usage:
;('use client')
const { stream } = await generateAdventureStream(prompt)

for await (const chunk of stream) {
  setContent((prev) => prev + chunk)
}
```

---

## SUCCESS CRITERIA (Binary)

```bash
# All must exit 0:

# 1. No API routes (app/api/**/*.ts should not exist)
! find app/api -name "*.ts" 2>/dev/null | grep -v "route.ts"

# 2. All Server Actions have 'use server'
grep -r "export.*async.*function" src/features/*/actions.ts 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    head -1 "$file" | grep -q "'use server'" || exit 1
  done

# 3. All Server Actions return structured result
grep -r "export.*async.*function" src/features/*/actions.ts 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    grep -q "success.*false\|success.*true" "$file" || exit 1
  done

# 4. No client-side fetch to /api
! grep -r "fetch.*['\"]\/api\/" src --include="*.tsx" 2>/dev/null

# 5. All mutations use revalidatePath or revalidateTag
grep -r "\.insert\|\.update\|\.delete" src/features/*/actions.ts 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    grep -q "revalidatePath\|revalidateTag" "$file" || exit 1
  done
```

**If ANY fails → Server Actions pattern violated → Fix before merge**

---

**Reference**: CLAUDE.md "Next.js Specific Gotchas" section
**Pattern**: Server Actions ONLY (no Express, no API routes)
**Framework**: Next.js 15 App Router
**Forms**: useFormState + useFormStatus
**Caching**: revalidatePath + revalidateTag
