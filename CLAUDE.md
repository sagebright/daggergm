# 🎯 CLAUDE.md - DaggerGM AI Development Guide

## 🚨 CRITICAL - READ FIRST

### After ANY Code Changes (MANDATORY):

```bash
☐ Check git status & current branch
☐ Run tests: npm test (99% coverage required)
☐ Run linter: npm run lint:fix
☐ Type check: npm run typecheck
☐ Use TodoWrite for multi-step tasks
```

### Testing Standards (NON-NEGOTIABLE):

```bash
# 99% coverage requirements:
- Lines: 99%
- Functions: 99%
- Statements: 99%
- Branches: 97%

# TDD workflow:
☐ Write failing test first (RED)
☐ Implement minimal code (GREEN)
☐ Refactor while keeping tests green
☐ Run coverage: npm run test:coverage
```

---

## 🔄 Project Context

**DaggerGM** - AI-powered adventure generator for Daggerheart TTRPG

- **Stack**: Next.js 14 + Supabase + GPT-4 + TypeScript
- **Domain**: Frame-aware adventure generation with Focus Mode editing
- **Architecture**: Server Actions, RLS everywhere, Credits-based monetization
- **Testing**: 99% coverage requirement with TDD approach
- **Status**: Database ready, implementing MVP features

---

## 🚦 TASK ROUTING - Choose Your Path

### 🏗️ Development Workflows

- **Test-Driven Development** → Always start here for new features
- **Bug Investigation** → Check tests first, then implementation
- **Performance Issues** → Profile first, optimize second
- **LLM Integration** → Mock first, implement second

### 📚 Technical References

- **PRP Document** → `/PRPs/daggergm_mvp_implementation.md`
- **Initial Requirements** → `/INITIAL_daggergm.md`
- **Database Schema** → `/supabase/migrations/`
- **Type Definitions** → `/types/database.generated.ts`

---

## ⚡ QUICK PATTERNS

### 🔐 Security & Data Access (ALWAYS):

- **All queries**: Must respect RLS policies
- **Guest users**: Use token-based access, no auth required
- **Credits**: Atomic consumption with Stripe integration
- **API keys**: Never exposed client-side

### 🎨 UI/UX Standards:

- **Components**: shadcn/ui only (no custom components)
- **Focus Mode**: Collapse other sections when editing
- **Mobile-first**: Touch-friendly interactions
- **Loading states**: Every async operation needs feedback

### 📏 Code Quality (ENFORCE):

- **File size**: 300 lines max (split if larger)
- **Test coverage**: 99% minimum for all code
- **Type safety**: No `any` types allowed
- **Error handling**: Every edge case covered

### 🧪 TDD Checkpoint (BEFORE CODING):

```bash
☐ Create test file first
☐ Write test describing desired behavior
☐ Run test to see it fail (RED)
☐ Write minimal implementation (GREEN)
☐ Refactor for clarity (REFACTOR)
☐ Check coverage remains at 99%
```

### 🧠 Development Patterns:

- **Server Actions**: All data mutations (no API routes)
- **Frame-aware**: Every feature respects Frame context
- **Credits model**: Not subscriptions
- **Guest-first**: One free adventure before signup

---

## 🔧 ESSENTIAL COMMANDS

### Local Development:

```bash
npm run dev              # Start Next.js dev server
npm test                 # Run tests in watch mode
npm run test:coverage    # Check coverage (must be 99%)
npm run lint:fix         # Fix linting issues
npm run typecheck        # TypeScript validation
npm run db:types         # Generate Supabase types
```

### Docker Operations:

```bash
npm run docker:up        # Start all containers
npm run docker:down      # Stop containers
npm run docker:test      # Run tests in Docker
npm run docker:logs      # View container logs
```

### Database Commands:

```bash
npm run db:setup         # Run migrations (already done)
npm run db:types         # Generate TypeScript types
```

---

## 📊 DaggerGM-Specific Patterns

### Frame-Aware Generation:

```typescript
// ALWAYS include Frame context
interface GenerationContext {
  frame: 'witherwild' | 'custom' | string
  focus: string // Frame-specific focus
  partySize: number
  partyLevel: number
  difficulty: 'easier' | 'standard' | 'harder'
  stakes: 'low' | 'personal' | 'high' | 'world'
}
```

### Focus Mode Editor:

```typescript
// Collapse non-active movements
interface FocusModeState {
  activeMovementId: string | null
  sidePanel: 'chat' | 'preview' | 'actions' | null
  isGenerating: boolean
}
```

### Credits System:

```typescript
// Atomic credit consumption
async function consumeCredit(userId: string) {
  const { data, error } = await supabase.rpc('consume_adventure_credit', { user_id: userId })

  if (error) throw new CreditError(error)
  return data
}
```

### LLM Integration:

```typescript
// Variable temperature by content type
const TEMPERATURES = {
  scaffold: 0.7, // Creative but coherent
  combat: 0.5, // Mechanical accuracy
  dialogue: 0.9, // Personality and flair
  description: 0.8, // Vivid but grounded
} as const
```

---

## 🧪 Testing Patterns

### Component Testing:

```typescript
describe('MovementEditor', () => {
  it('should collapse other movements in focus mode', async () => {
    const { rerender } = render(
      <MovementEditor movements={mockMovements} />
    );

    // Click to focus
    await userEvent.click(screen.getByText('Movement 2'));

    // Others should be collapsed
    expect(screen.getByTestId('movement-1')).toHaveClass('collapsed');
    expect(screen.getByTestId('movement-3')).toHaveClass('collapsed');
    expect(screen.getByTestId('movement-2')).not.toHaveClass('collapsed');
  });
});
```

### Server Action Testing:

```typescript
describe('generateAdventure', () => {
  it('should consume exactly one credit', async () => {
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.rpc.mockResolvedValueOnce({ data: 1 })

    await generateAdventure(mockConfig, 'user-123')

    expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_adventure_credit', {
      user_id: 'user-123',
    })
  })
})
```

### LLM Mock Testing:

```typescript
// Mock OpenAI responses for consistent tests
vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: mockAdventureScaffold,
              },
            },
          ],
        }),
      },
    },
  })),
}))
```

---

## 🚨 Common Pitfalls

### RLS Violations:

- Always test with both anon and service keys
- Guest users need special handling
- Check policies after schema changes

### Credit Race Conditions:

- Use database transactions
- Implement idempotency keys
- Handle double-click scenarios

### LLM Costs:

- Cache responses aggressively
- Use semantic similarity for deduplication
- Monitor token usage per adventure

### Focus Mode Edge Cases:

- Handle browser back button
- Preserve state on page refresh
- Mobile keyboard interactions

---

## 📋 Feature Implementation Checklist

When implementing new features:

1. [ ] Write user story first
2. [ ] Create comprehensive test suite
3. [ ] Mock external dependencies
4. [ ] Implement with TDD approach
5. [ ] Ensure 99% coverage
6. [ ] Add proper TypeScript types
7. [ ] Include loading/error states
8. [ ] Test RLS policies
9. [ ] Verify mobile responsiveness
10. [ ] Document in code comments

---

## 🎯 Success Metrics

### Code Quality:

- Test coverage: 99% (lines, functions, statements), 97% (branches)
- TypeScript strict mode: No errors
- Bundle size: < 500KB for initial load
- Lighthouse score: > 95 on all metrics

### User Experience:

- Adventure generation: < 10 seconds total
- Focus Mode transition: < 100ms
- Credit purchase: < 3 clicks
- Export generation: < 2 seconds

---

**Version**: 2025-09-08 | **Updated**: When any patterns change | **Next**: Begin TDD implementation
