# Focus Mode State Management: Zustand vs Jotai

## Recommendation: **Zustand** (with caveat)

### The Use Case

Focus Mode needs to manage:

- Collapsed/expanded state for 3-5 Movements
- Active movement ID (only one can be focused)
- Optimistic updates during AI regeneration
- Browser back button integration
- Mobile gesture state (swipe to collapse)

### Why Zustand Wins for DaggerGM

```typescript
// store/focusMode.ts (Zustand approach)
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FocusState {
  activeMovementId: string | null;
  collapsedIds: Set<string>;

  // Actions
  focusMovement: (id: string) => void;
  collapseAll: () => void;
  toggleCollapse: (id: string) => void;
}

export const useFocusMode = create<FocusState>()(
  devtools((set) => ({
    activeMovementId: null,
    collapsedIds: new Set(),

    focusMovement: (id) => set((state) => ({
      activeMovementId: id,
      collapsedIds: new Set(
        state.collapsedIds.add(id).delete(id) // Expand focused, keep others collapsed
      )
    })),

    collapseAll: () => set({ activeMovementId: null }),
    toggleCollapse: (id) => set((state) => {
      const newCollapsed = new Set(state.collapsedIds);
      newCollapsed.has(id) ? newCollapsed.delete(id) : newCollapsed.add(id);
      return { collapsedIds: newCollapsed };
    })
  }))
);

// Usage in component
function MovementCard({ movement }) {
  const { activeMovementId, focusMovement } = useFocusMode();
  const isActive = activeMovementId === movement.id;

  return (
    <Card onClick={() => focusMovement(movement.id)}>
      {isActive ? <FullMovementView /> : <CollapsedHeader />}
    </Card>
  );
}
```

**Pros:**

- Single store = easy to serialize for URL state (`?focus=movement-3`)
- Middleware ecosystem (devtools, persist, immer)
- Simpler mental model for team new to React state
- Good TypeScript inference

**Cons:**

- Slightly more boilerplate than Jotai
- All state in one store (but this is actually good for Focus Mode)

### Why NOT Jotai (for this specific case)

```typescript
// atoms/focusMode.ts (Jotai approach)
import { atom } from 'jotai'

export const activeMovementAtom = atom<string | null>(null)
export const collapsedIdsAtom = atom(new Set<string>())

// Derived atom for URL sync
export const focusUrlAtom = atom(
  (get) => {
    const active = get(activeMovementAtom)
    return active ? `?focus=${active}` : ''
  },
  (get, set, url: string) => {
    const params = new URLSearchParams(url)
    set(activeMovementAtom, params.get('focus'))
  },
)
```

**Pros:**

- More granular re-renders (but not needed for 3-5 movements)
- Less boilerplate for simple cases
- Atomic updates prevent race conditions

**Cons:**

- Atoms scattered across files (harder to understand for new team)
- URL sync requires custom atom (Zustand middleware exists)
- Overkill for this use case

### Verdict

**Use Zustand** unless you have 20+ independent UI states. For Focus Mode's cohesive state tree (active movement + collapsed states), Zustand's single store is clearer.

### React Query's Role

**DO NOT use React Query for Focus Mode state** - it's for server state only:

```typescript
// ✅ CORRECT: Server state via React Query
const { data: adventure } = useQuery({
  queryKey: ['adventure', adventureId],
  queryFn: () => getAdventure(adventureId),
})

// ✅ CORRECT: Client state via Zustand
const { activeMovementId } = useFocusMode()

// ❌ WRONG: Trying to use React Query for UI state
const { data: focusState } = useQuery({
  queryKey: ['focus-mode'], // This is client state!
  queryFn: () => ({ activeMovementId: 'movement-1' }),
})
```

### Implementation Checklist

- [ ] Install zustand: `npm install zustand`
- [ ] Create `src/stores/focusMode.ts` with devtools middleware
- [ ] Add URL sync via `shallow` compare to prevent loops
- [ ] Write Vitest tests for state transitions
- [ ] Document in CLAUDE.md under "State Management Patterns"

---

**Version**: 2025-10-18
**Decision Owner**: DaggerGM Team
**Revisit If**: Movement count exceeds 10, or real-time collab added
