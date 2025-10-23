# Server State Management with React Query + Server Actions

**Purpose**: Guide for managing server state in Next.js 15 App Router using React Query + Server Actions.

**Key Insight**: Server Actions replace traditional API routes, but React Query still handles caching, optimistic updates, and revalidation.

---

## Overview

### The Stack

- **Server Actions**: Mutations and data fetching (replaces `/api` routes)
- **React Query**: Client-side caching, optimistic updates, revalidation
- **Next.js Cache**: Server-side caching (App Router built-in)

### When to Use What

| Task                  | Tool                         | Why                                       |
| --------------------- | ---------------------------- | ----------------------------------------- |
| **Read data**         | Server Action → React Query  | Cache on client, revalidate automatically |
| **Mutate data**       | Server Action → useMutation  | Optimistic updates, error rollback        |
| **Real-time updates** | Supabase Realtime → useQuery | Invalidate cache on DB changes            |
| **Initial page data** | Server Component             | SSR, no loading state                     |

---

## Setup

### 1. Install React Query

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Create Query Provider

**File: `src/app/providers.tsx`**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long data is considered fresh
            staleTime: 60 * 1000, // 1 minute

            // Cache time: How long unused data stays in cache
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

            // Refetch on window focus (disabled by default for UX)
            refetchOnWindowFocus: false,

            // Retry failed requests (useful for flaky networks)
            retry: 1,

            // Refetch on mount (only if stale)
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### 3. Wrap App with Provider

**File: `src/app/layout.tsx`**

```typescript
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Reading Data (useQuery + Server Actions)

### Server Action for Data Fetching

**File: `src/features/adventure/actions/getAdventure.ts`**

```typescript
'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

export const getAdventure = unstable_cache(
  async (adventureId: string) => {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('adventures')
      .select(
        `
        *,
        movements (
          *,
          combat_encounters (*)
        )
      `,
      )
      .eq('id', adventureId)
      .single()

    if (error) {
      throw new Error('Adventure not found')
    }

    return data
  },
  ['adventure'], // Cache key
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ['adventure'], // Tag for on-demand revalidation
  },
)
```

### Client Hook with useQuery

**File: `src/features/adventure/hooks/useAdventure.ts`**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { getAdventure } from '../actions/getAdventure'

export function useAdventure(adventureId: string) {
  return useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: () => getAdventure(adventureId),

    // Only run if adventureId exists
    enabled: !!adventureId,

    // Stale time (override default if needed)
    staleTime: 2 * 60 * 1000, // 2 minutes for adventures (they change infrequently)
  })
}
```

### Usage in Component

**File: `src/features/adventure/components/AdventureEditor.tsx`**

```typescript
'use client';

import { useAdventure } from '../hooks/useAdventure';
import { Card } from '@/components/ui/card';

export function AdventureEditor({ adventureId }: { adventureId: string }) {
  const { data: adventure, isLoading, error } = useAdventure(adventureId);

  if (isLoading) {
    return <div>Loading adventure...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Card>
      <h1>{adventure.title}</h1>
      {adventure.movements.map((movement) => (
        <MovementCard key={movement.id} movement={movement} />
      ))}
    </Card>
  );
}
```

---

## Mutating Data (useMutation + Server Actions)

### Server Action for Mutation

**File: `src/features/adventure/actions/regenerateMovement.ts`**

```typescript
'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { generateMovement } from '@/features/generation/services/movementGenerator'
import { revalidateTag } from 'next/cache'

export async function regenerateMovement(movementId: string) {
  const supabase = getSupabaseServer()

  // Fetch existing movement
  const { data: movement, error: fetchError } = await supabase
    .from('movements')
    .select('*, adventure:adventures(*)')
    .eq('id', movementId)
    .single()

  if (fetchError || !movement) {
    throw new Error('Movement not found')
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

  // Revalidate Next.js cache
  revalidateTag('adventure')

  return updated
}
```

### Client Hook with useMutation

**File: `src/features/adventure/hooks/useRegenerateMovement.ts`**

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { regenerateMovement } from '../actions/regenerateMovement'
import type { Movement } from '@/types/database.types'

export function useRegenerateMovement(adventureId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateMovement,

    // Optimistic update (instant UI feedback)
    onMutate: async (movementId) => {
      // Cancel outgoing refetches (don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey: ['adventure', adventureId] })

      // Snapshot previous value
      const previousAdventure = queryClient.getQueryData(['adventure', adventureId])

      // Optimistically update UI
      queryClient.setQueryData(['adventure', adventureId], (old: any) => {
        if (!old) return old

        return {
          ...old,
          movements: old.movements.map((m: Movement) =>
            m.id === movementId
              ? { ...m, description: 'Regenerating...' } // Optimistic state
              : m,
          ),
        }
      })

      // Return context for rollback
      return { previousAdventure }
    },

    // On success, invalidate and refetch
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adventure', adventureId] })
    },

    // On error, rollback optimistic update
    onError: (_error, _variables, context) => {
      if (context?.previousAdventure) {
        queryClient.setQueryData(['adventure', adventureId], context.previousAdventure)
      }
    },

    // Always refetch after mutation (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adventure', adventureId] })
    },
  })
}
```

### Usage in Component

**File: `src/features/adventure/components/MovementCard.tsx`**

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRegenerateMovement } from '../hooks/useRegenerateMovement';
import type { Movement } from '@/types/database.types';

export function MovementCard({ movement, adventureId }: { movement: Movement; adventureId: string }) {
  const { mutate: regenerate, isPending } = useRegenerateMovement(adventureId);

  return (
    <Card className="p-4">
      <h3>Movement {movement.order + 1}</h3>
      <p>{movement.description}</p>

      <Button
        onClick={() => regenerate(movement.id)}
        disabled={isPending}
      >
        {isPending ? 'Regenerating...' : 'Regenerate'}
      </Button>
    </Card>
  );
}
```

---

## Advanced Patterns

### 1. Prefetching Data

**Prefetch on hover for instant navigation:**

```typescript
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getAdventure } from '../actions/getAdventure';
import Link from 'next/link';

export function AdventureLink({ adventureId, title }: { adventureId: string; title: string }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch adventure data on hover
    queryClient.prefetchQuery({
      queryKey: ['adventure', adventureId],
      queryFn: () => getAdventure(adventureId),
    });
  };

  return (
    <Link
      href={`/adventures/${adventureId}`}
      onMouseEnter={handleMouseEnter}
    >
      {title}
    </Link>
  );
}
```

### 2. Infinite Queries (Pagination)

**For loading adventures with "Load More":**

```typescript
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getAdventures } from '../actions/getAdventures';

export function useAdventures() {
  return useInfiniteQuery({
    queryKey: ['adventures'],
    queryFn: ({ pageParam = 0 }) => getAdventures({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 10) return undefined; // No more pages
      return pages.length; // Next page number
    },
    initialPageParam: 0,
  });
}

// Usage
function AdventuresList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdventures();

  return (
    <div>
      {data?.pages.map((page) =>
        page.map((adventure) => <AdventureCard key={adventure.id} adventure={adventure} />)
      )}

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
```

### 3. Dependent Queries

**Load movements only after adventure loads:**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { getAdventure } from '../actions/getAdventure'
import { getMovements } from '../actions/getMovements'

export function useAdventureWithMovements(adventureId: string) {
  // First query: Get adventure
  const adventureQuery = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: () => getAdventure(adventureId),
  })

  // Second query: Get movements (only runs after adventure loads)
  const movementsQuery = useQuery({
    queryKey: ['movements', adventureId],
    queryFn: () => getMovements(adventureId),
    enabled: !!adventureQuery.data, // Only run if adventure exists
  })

  return {
    adventure: adventureQuery.data,
    movements: movementsQuery.data,
    isLoading: adventureQuery.isLoading || movementsQuery.isLoading,
  }
}
```

### 4. Real-Time Updates with Supabase

**Invalidate React Query cache when Supabase broadcasts changes:**

```typescript
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useRealtimeAdventure(adventureId: string) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Subscribe to adventure updates
    const channel = supabase
      .channel(`adventure:${adventureId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'adventures',
          filter: `id=eq.${adventureId}`,
        },
        () => {
          // Invalidate React Query cache when DB changes
          queryClient.invalidateQueries({ queryKey: ['adventure', adventureId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adventureId, queryClient, supabase]);
}

// Usage in component
function AdventureEditor({ adventureId }: { adventureId: string }) {
  const { data: adventure } = useAdventure(adventureId);

  // Enable real-time updates
  useRealtimeAdventure(adventureId);

  return <div>{adventure.title}</div>;
}
```

---

## Testing

### Testing useQuery Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdventure } from '../useAdventure';
import { getAdventure } from '../../actions/getAdventure';

// Mock Server Action
vi.mock('../../actions/getAdventure');

describe('useAdventure', () => {
  it('should fetch adventure data', async () => {
    const mockAdventure = {
      id: 'adv-1',
      title: 'Test Adventure',
      frame: 'Witherwild',
    };

    vi.mocked(getAdventure).mockResolvedValueOnce(mockAdventure);

    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAdventure('adv-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAdventure);
  });
});
```

### Testing useMutation Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegenerateMovement } from '../useRegenerateMovement';
import { regenerateMovement } from '../../actions/regenerateMovement';

vi.mock('../../actions/regenerateMovement');

describe('useRegenerateMovement', () => {
  it('should regenerate movement and invalidate cache', async () => {
    const mockUpdatedMovement = {
      id: 'mov-1',
      description: 'NEW DESCRIPTION',
    };

    vi.mocked(regenerateMovement).mockResolvedValueOnce(mockUpdatedMovement);

    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRegenerateMovement('adv-1'), { wrapper });

    // Trigger mutation
    result.current.mutate('mov-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUpdatedMovement);
  });
});
```

---

## Validation Checklist

- [ ] React Query provider wraps entire app
- [ ] useQuery for all data fetching
- [ ] useMutation for all mutations
- [ ] Optimistic updates implemented for mutations
- [ ] Error handling with rollback
- [ ] Cache invalidation after mutations
- [ ] DevTools enabled in development
- [ ] Tests for all query/mutation hooks
- [ ] Real-time updates (if needed) invalidate cache

---

## Common Pitfalls

### ❌ Pitfall: Not Invalidating Cache After Mutation

```typescript
// BAD: Cache never updates
const { mutate } = useMutation({
  mutationFn: regenerateMovement,
  // Missing onSuccess!
})

// GOOD: Invalidate cache to refetch fresh data
const { mutate } = useMutation({
  mutationFn: regenerateMovement,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['adventure', adventureId] })
  },
})
```

### ❌ Pitfall: Calling Server Actions Directly Instead of useQuery

```typescript
// BAD: No caching, refetches on every render
const [adventure, setAdventure] = useState(null)
useEffect(() => {
  getAdventure(id).then(setAdventure)
}, [id])

// GOOD: React Query handles caching
const { data: adventure } = useQuery({
  queryKey: ['adventure', id],
  queryFn: () => getAdventure(id),
})
```

### ❌ Pitfall: Forgetting to Enable Query Conditionally

```typescript
// BAD: Query runs even when adventureId is undefined
const { data } = useQuery({
  queryKey: ['adventure', adventureId],
  queryFn: () => getAdventure(adventureId),
  // Missing enabled!
})

// GOOD: Only run when adventureId exists
const { data } = useQuery({
  queryKey: ['adventure', adventureId],
  queryFn: () => getAdventure(adventureId),
  enabled: !!adventureId,
})
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-18
**Next Review**: After implementing first feature with React Query
