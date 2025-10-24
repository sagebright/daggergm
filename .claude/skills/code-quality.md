---
name: 'Code Quality Enforcer'
description: 'Enforce 300-line file limit, code organization, and Next.js patterns for DaggerGM'
---

# Code Quality Standards (DaggerGM)

Auto-activates: All code changes, refactoring, new files.

## FILE SIZE VALIDATION (Execute First)

```bash
#!/bin/bash
# scripts/validate-file-size.sh

echo "📏 Validating file sizes (DaggerGM: 300-line limit)..."

MAX_LINES=300
FAIL=0

# Check all TypeScript/TSX files in src
for file in $(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
  lines=$(wc -l < "$file" | tr -d ' ')

  if [ "$lines" -gt $MAX_LINES ]; then
    echo "❌ $file: $lines lines (max $MAX_LINES)"
    echo "   → REFACTOR REQUIRED"
    FAIL=1
  elif [ "$lines" -gt 250 ]; then
    echo "⚠️  $file: $lines lines (approaching limit)"
  fi
done

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "🚨 FILE SIZE VIOLATIONS DETECTED"
  echo "Files must be ≤300 lines. Refactor before committing."
  exit 1
fi

echo "✅ All files within size limits"
exit 0
```

**Usage:**

```bash
chmod +x scripts/validate-file-size.sh
./scripts/validate-file-size.sh
```

---

## REFACTORING TRIGGERS (When to Split Files)

### Trigger 1: File >300 lines

```bash
# Check file size
wc -l src/features/adventures/AdventureEditor.tsx
# 320 lines → MUST REFACTOR

# Target: Split into:
# - AdventureEditor.tsx (main component, <150 lines)
# - AdventureEditorToolbar.tsx (toolbar logic, <100 lines)
# - useAdventureState.ts (state management, <80 lines)
```

### Trigger 2: Mixed Server/Client Code

```typescript
// ❌ Server and Client logic in one file (450 lines)
'use client'
export default function AdventurePage() {
  // 200 lines of client-side UI
  // 150 lines of API calls (should be Server Actions)
  // 100 lines of utilities
}

// ✅ Split by Server/Client boundary
// app/adventures/[id]/page.tsx (50 lines) - Server Component
export default async function AdventurePage({ params }: { params: { id: string } }) {
  const adventure = await getAdventure(params.id)
  return <AdventureClient adventure={adventure} />
}

// features/adventures/AdventureClient.tsx (150 lines) - Client Component
'use client'
export function AdventureClient({ adventure }: { adventure: Adventure }) {
  // Client-side interactivity only
}

// features/adventures/actions.ts (100 lines) - Server Actions
'use server'
export async function getAdventure(id: string) {
  // Database operations
}
```

### Trigger 3: >5 dependencies

```typescript
// ❌ Too many imports = too many responsibilities
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { stripe } from '@/lib/stripe'
import { storage } from '@/lib/storage'
import { email } from '@/lib/email'
import { analytics } from '@/lib/analytics'
import { cache } from '@/lib/cache'

// ✅ Split into focused modules
```

---

## NEXT.JS-SPECIFIC PATTERNS

### Pattern 1: Server Components (Default)

```typescript
// ✅ CORRECT: Server Component (no 'use client')
// app/adventures/page.tsx
import { getAdventures } from '@/features/adventures/actions'

export default async function AdventuresPage() {
  const adventures = await getAdventures()

  return (
    <div>
      {adventures.map(adventure => (
        <AdventureCard key={adventure.id} adventure={adventure} />
      ))}
    </div>
  )
}
```

### Pattern 2: Client Components (When Needed)

```typescript
// ✅ CORRECT: Client Component (with 'use client')
// features/adventures/AdventureCard.tsx
'use client'

import { useState } from 'react'

export function AdventureCard({ adventure }: { adventure: Adventure }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {/* Interactive UI */}
    </div>
  )
}
```

### Pattern 3: Server Actions (Database Operations)

```typescript
// ✅ CORRECT: Server Actions
// features/adventures/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAdventure(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('adventures')
    .insert({
      title: formData.get('title') as string,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/adventures')
  return { success: true, data }
}
```

---

## FEATURE-BASED ORGANIZATION (Mandatory)

```bash
# ✅ DaggerGM organization
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   └── signup/
│   ├── adventures/               # Adventures routes
│   │   ├── [id]/
│   │   │   └── page.tsx          # Server Component (<100 lines)
│   │   └── page.tsx
│   └── layout.tsx
├── features/                     # Feature modules
│   ├── adventures/
│   │   ├── actions.ts            # Server Actions (<200 lines)
│   │   ├── AdventureClient.tsx   # Client Component (<200 lines)
│   │   ├── AdventureEditor.tsx   # Client Component (<250 lines)
│   │   └── hooks/
│   │       └── useAdventureState.ts  # Hook (<150 lines)
│   ├── generation/
│   │   ├── actions.ts            # LLM generation (<200 lines)
│   │   └── GenerationStatus.tsx  # Client Component (<100 lines)
│   └── credits/
│       ├── actions.ts
│       └── CreditBalance.tsx
├── lib/                          # Shared utilities
│   ├── supabase/
│   │   ├── server.ts             # Server client (<100 lines)
│   │   └── client.ts             # Client client (<100 lines)
│   ├── openai/
│   │   └── client.ts             # OpenAI client (<150 lines)
│   └── validators/
│       └── env.ts                # Env validation (<100 lines)
├── stores/                       # Zustand stores
│   └── focusModeStore.ts         # Focus Mode state (<200 lines)
└── components/                   # Shared UI
    ├── ui/                       # shadcn/ui components
    └── layout/
        └── Nav.tsx               # Navigation (<150 lines)
```

---

## PERFORMANCE PATTERNS (Copy These)

### ✅ Pattern 1: Server-Side Data Fetching

```typescript
// ✅ CORRECT: Fetch data in Server Component
// app/adventures/[id]/page.tsx
export default async function AdventurePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: adventure } = await supabase
    .from('adventures')
    .select('*, scenes(*)')  // Fetch relations in one query
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  return <AdventureClient adventure={adventure} />
}

// ❌ WRONG: Client-side fetching
'use client'
export default function AdventurePage() {
  const [adventure, setAdventure] = useState(null)

  useEffect(() => {
    fetch(`/api/adventures/${id}`).then(...)  // Extra network request
  }, [])
}
```

### ✅ Pattern 2: Revalidation

```typescript
// ✅ CORRECT: Revalidate after mutations
'use server'
export async function updateAdventure(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase.from('adventures').update(data).eq('id', id)

  if (error) return { success: false, error: error.message }

  // Revalidate cached pages
  revalidatePath(`/adventures/${id}`)
  revalidatePath('/adventures')

  return { success: true }
}
```

### ✅ Pattern 3: Select Specific Fields

```typescript
// ❌ WRONG: SELECT *
const { data } = await supabase.from('adventures').select('*') // Fetches all columns

// ✅ CORRECT: Explicit fields
const { data } = await supabase.from('adventures').select('id, title, frame, status, created_at') // Only needed fields
```

---

## SUCCESS CRITERIA (Binary)

```bash
# All must exit 0:

# 1. No files >300 lines
! find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
  xargs wc -l 2>/dev/null | awk '{if($1>300) exit 1}'

# 2. No SELECT * queries
! grep -r "\.select('\*')" src --include="*.ts" --include="*.tsx" 2>/dev/null

# 3. All Server Actions use 'use server'
grep -r "export.*async.*function" src/features/*/actions.ts 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    head -1 "$file" | grep -q "'use server'" || exit 1
  done

# 4. No console.log in production code
! grep -r "console\.log" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v "node_modules" | grep -v ".test.ts"

# 5. All client components have 'use client'
grep -r "useState\|useEffect" src --include="*.tsx" 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    head -5 "$file" | grep -q "'use client'" || exit 1
  done
```

**If ANY fails → Code quality issues → Refactor before merge**

---

**Reference**: CLAUDE.md "Code Quality" section
**File Limit**: 300 lines (strict)
**Organization**: Feature-based
**Framework**: Next.js 15 App Router patterns
