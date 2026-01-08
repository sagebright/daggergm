# DaggerGM System Overview

**Version**: 2.2 (Current Implementation)
**Date**: 2025-12-28
**Status**: Active Development
**Last Major Change**: Removed guest free adventures (PR #68)

---

## Executive Summary

**DaggerGM** is an AI-powered SaaS platform that enables Game Masters to generate, refine, and export complete Daggerheart TTRPG adventures in under 10 minutes. The system uses Frame-aware content generation with OpenAI GPT-4 to create contextually appropriate one-shot adventures (3-4 hour sessions).

### Core Value Proposition

- **For**: Game Masters preparing one-shot Daggerheart adventures
- **Problem**: Adventure prep is time-consuming (typically 2-4 hours) and creatively draining
- **Solution**: AI-guided generation with limited refinement cycles (10 at Scaffold, 20 at Expansion) and Frame-aware context
- **Business Model**: Credit-based purchases (NOT subscriptions) - 1 credit = 1 adventure generation
- **Access Model**: Authentication required for all adventure generation (no guest access)

---

## Tech Stack (Current Implementation)

### Frontend

- **Framework**: Next.js 15.5.4 (App Router) with React 19.2
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x with shadcn/ui components
- **State Management**:
  - Zustand (Focus Mode editor state)
  - TanStack Query v5 (server state/caching)
- **Forms**: React Hook Form v7 with Zod validation
- **Themes**: next-themes (dark mode support)
- **Animation**: Framer Motion

### Backend

- **Runtime**: Next.js Server Actions (NO separate API server, NO tRPC)
- **Database**: Supabase (PostgreSQL 15+ with pgvector 0.8.0+)
- **Authentication**: Supabase Auth with Row-Level Security (RLS)
- **LLM**: OpenAI GPT-4 with structured outputs (Zod validation)
- **Payments**: Stripe v19 (one-time credit purchases)
- **Analytics**: PostHog

### Infrastructure

- **Deployment**: Vercel (Edge Functions + ISR)
- **Database Hosting**: Supabase Cloud
- **Email**: Resend (transactional)
- **Monitoring**: Web Vitals + PostHog

### Testing

- **Unit/Integration**: Vitest (80% integration, 5% unit)
- **E2E**: Playwright (15% of coverage)
- **Target Coverage**: 90% lines/functions/statements, 100% for security-critical code

---

## System Architecture

### High-Level Flow

```
User → Next.js App (React 19)
         ↓
    Server Actions (validation with Zod)
         ↓
    Supabase (PostgreSQL + RLS)
         ↓
    OpenAI GPT-4 (Frame-aware prompts)
         ↓
    Generated Adventure → Export (Markdown)
```

### Key Architectural Decisions

1. **Server-First Design**: Leverage React Server Components for performance
2. **No Separate API**: Server Actions replace traditional REST/GraphQL API
3. **Credit-Based, Not Subscription**: One-time purchases (simpler than recurring billing)
4. **Frame-Aware Generation**: LLM context includes Daggerheart frames (Witherwild, etc.)
5. **Focus Mode**: Core UX for refining individual adventure sections
6. **Multi-Tenant via RLS**: All queries filtered by `user_id` (tenant = user in DaggerGM)

---

## Core Features

### 1. Adventure Generation Pipeline

**Workflow:**

```
Login/Guest Access
    ↓
Configure Adventure (guided form)
    ↓
Generate Scaffold (3-5 movement outlines)
    ↓
Review & Refine in Focus Mode
    ↓
Generate Full Content (expand movements)
    ↓
Export (Markdown)
```

**Generation Stages:**

1. **Configuration**: User selects frame, party size, difficulty, motifs
2. **Scaffold**: AI generates 3-5 high-level "movements" (acts/scenes)
3. **Focus Mode (Scaffold)**: User can regenerate, edit, or lock individual movements (10 regenerations max)
4. **Expansion**: AI generates 4 components per scene:
   - **NPCs**: 0, 1, or many non-player characters with stats/personality
   - **Enemies**: 0, 1, or many adversaries with combat stats
   - **Descriptions**: Text the GM can draw from to describe the scene and its components to players
   - **Narration**: (Optional) Text the GM reads aloud to players (dialogue, descriptive text)
5. **Focus Mode (Expansion)**: User can re-enter to regenerate, edit, or lock components (20 regenerations max)
   - Example: If Expansion generates 3 NPCs, user can lock 1, edit+lock another, and regenerate the third
6. **Export**: Download as Markdown file

### 2. Frame-Aware Content

**Frames** are Daggerheart campaign settings (e.g., Witherwild, Underdeep). The system:

- Stores frame lore in `game_content` table with vector embeddings
- Uses semantic search to inject relevant context into prompts
- Ensures generated adventures match frame tone/themes

### 3. Authentication System

**Authentication Requirements:**

- All users must create an account to generate adventures (Supabase Auth)
- No guest access for adventure generation (removed in v1.1)
- Free account creation (email/password via Supabase)
- Must purchase credits before generating first adventure

### 4. Credit System

**Pricing Model:**

- 1 credit = 1 adventure generation
- Credits purchased via Stripe (one-time payments, NOT subscriptions)
- No free credits in MVP - all users must purchase to generate
- Credits stored in `user_profiles.credits`

**Credit Consumption:**

- Initial adventure generation: 1 credit (consumed at start)
- Regenerations: FREE but LIMITED
  - Scaffold stage: 10 regenerations maximum
  - Expansion stage: 20 regenerations maximum
  - Regeneration counted each time button clicked (whether for individual NPC or high-level scene)

### 5. Focus Mode (Core UX Innovation)

**Purpose**: Section-by-section editing with AI assistance

**Features:**

- View all movements in sidebar
- Click to focus on one movement
- Regenerate button (AI rewrites that movement only)
- Manual edit with Markdown preview
- Lock/unlock mechanism (prevent accidental overwrites)
- Context-aware regeneration (considers locked movements)

**State Management**: Zustand store for editor state (undo/redo, selection, locks)

---

## Database Schema (Core Tables)

### user_profiles

```sql
id UUID (PK, refs auth.users)
email TEXT UNIQUE
credits INT DEFAULT 0 (CHECK >= 0)
total_purchased INT DEFAULT 0
created_at, updated_at TIMESTAMPTZ
```

**Key Points:**

- `credits`: Current balance (decremented on generation, starts at 0 in MVP)
- `total_purchased`: Lifetime spend (for analytics/support)

### adventures

```sql
id UUID (PK)
user_id UUID (FK to auth.users, nullable for guests)
guest_email TEXT (nullable, required if user_id is null)
guest_token UUID (24-hour validity)
title TEXT
frame TEXT (e.g., 'witherwild', 'underdeep')
focus TEXT (current movement in Focus Mode)
state TEXT (draft | finalized | exported)
config JSONB (party size, difficulty, motifs)
movements JSONB[] (array of movement objects)
metadata JSONB (generation timestamps, costs)
created_at, updated_at, exported_at TIMESTAMPTZ
```

**Key Points:**

- `user_id` XOR `guest_email` (enforced by CHECK constraint)
- `guest_token` for 24-hour guest access
- `focus`: Tracks which movement user is editing (for Focus Mode)
- `movements[]`: Array of movement objects with structure:
  ```typescript
  {
    id: string
    title: string
    summary: string
    content: string | null // null until expanded
    locked: boolean
    type: 'exploration' | 'combat' | 'social'
  }
  ```

### game_content (Frame-aware content)

```sql
id UUID (PK)
content_type TEXT (rule | frame_lore | npc | adversary)
frame TEXT (witherwild | underdeep | null for universal)
source_book TEXT (official book name)
game_element JSONB (structured data: stat blocks, rules)
searchable_text TEXT (for full-text + semantic search)
embedding vector(1536) (OpenAI embedding)
metadata JSONB
created_at TIMESTAMPTZ
```

**Key Points:**

- `embedding`: Vector embeddings for semantic search during generation
- `frame`: NULL = universal content, otherwise frame-specific
- Indexed with `ivfflat` for fast similarity search

### llm_cache (Cost optimization)

```sql
id UUID (PK)
prompt_hash TEXT UNIQUE (MD5 of prompt + params)
prompt_params JSONB
response TEXT
model TEXT (gpt-4-turbo, etc.)
temperature NUMERIC(3,2)
token_count INT
created_at, accessed_at TIMESTAMPTZ
access_count INT
```

**Key Points:**

- Caches LLM responses to avoid redundant API calls
- `prompt_hash`: Deterministic hash for exact match lookups
- `accessed_at` + `access_count`: Track cache hit rate

### purchases (Audit trail)

```sql
id UUID (PK)
user_id UUID (nullable for guest purchases)
guest_email TEXT (nullable)
stripe_payment_intent_id TEXT UNIQUE
amount INT (cents)
credits INT (credits purchased)
status TEXT (pending | succeeded | failed)
metadata JSONB
created_at TIMESTAMPTZ
```

**Key Points:**

- Immutable audit log of all transactions
- `stripe_payment_intent_id`: Links to Stripe for refunds/disputes

---

## Security Architecture

### Row-Level Security (RLS)

**ALL data tables have RLS enabled:**

```sql
-- Users can only read their own adventures
CREATE POLICY "users_read_own" ON adventures
FOR SELECT USING (auth.uid() = user_id);

-- Guests can read adventures with valid token (24-hour window)
CREATE POLICY "guests_read_with_token" ON adventures
FOR SELECT USING (
  guest_email = current_setting('request.headers')::json->>'x-guest-email'
  AND guest_token = (current_setting('request.headers')::json->>'x-guest-token')::uuid
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Similar policies for INSERT, UPDATE, DELETE
```

**Critical Rules:**

- **ALL database queries** must filter by `user_id` (or `guest_email` + `guest_token`)
- Server Actions validate user identity before DB operations
- `tenant_id` = `user_id` (multi-tenancy at row level)

### Authentication Flow

**All Users:**

- Supabase Auth (email/password or OAuth)
- Session token managed by `@supabase/ssr`
- `auth.uid()` used in RLS policies
- All adventure generation requires authenticated user with credits
- Landing page is public (read-only, sample download available)

### API Key Security

- **OpenAI API key**: Server-only (validated in `src/lib/validators/env.ts`)
- **Stripe secret key**: Server-only
- **Supabase service role key**: Server-only (for admin operations)
- **Public keys**: `NEXT_PUBLIC_` prefix (Supabase anon key, Stripe publishable key)

---

## LLM Integration Strategy

### OpenAI GPT-4 Configuration

**Models:**

- **Scaffold Generation**: GPT-4-turbo (fast, coherent outlines)
- **Movement Expansion**: GPT-4 (higher quality, detailed content)

**Temperature Settings:**

- Scaffold: 0.7 (creative but coherent)
- Combat encounters: 0.5 (mechanical accuracy)
- NPC dialogue: 0.9 (personality/creativity)
- Descriptions: 0.8 (vivid imagery)

**Structured Outputs:**

- All responses validated with Zod schemas
- TypeScript types generated from Zod schemas
- Retry logic (3 attempts) if response doesn't match schema

**Prompt Engineering:**

- **System prompt**: Daggerheart rules + frame lore (from vector search)
- **User prompt**: Adventure config + locked movements (for context)
- **Few-shot examples**: 2-3 example movements per frame
- **Output format**: JSON with strict schema (enforced by OpenAI structured outputs)

### Vector Search (Semantic Context Injection)

**Flow:**

```
User selects frame (e.g., "Witherwild")
    ↓
Query game_content WHERE frame = 'witherwild'
    ↓
Embed user's adventure config (party, motifs, difficulty)
    ↓
Similarity search: SELECT * FROM game_content
                   ORDER BY embedding <=> query_embedding
                   LIMIT 5
    ↓
Inject top 5 results into GPT-4 system prompt
    ↓
Generate adventure with frame-aware context
```

**Vector Index:**

- `ivfflat` index on `game_content.embedding`
- Cosine similarity (`<=>` operator)
- Embeddings generated with `text-embedding-3-small` (1536 dimensions)

---

## Stripe Integration (Credit Purchases)

### Payment Flow

```
User clicks "Buy Credits"
    ↓
Client calls Server Action: createCheckoutSession()
    ↓
Server creates Stripe Checkout Session
    ↓
Redirect to Stripe hosted checkout
    ↓
User completes payment
    ↓
Stripe webhook → Server Action: handleWebhook()
    ↓
Verify webhook signature
    ↓
Update user_profiles.credits += purchased_credits
    ↓
Insert purchase record
    ↓
Send confirmation email (Resend)
```

### Credit Packages

- **Starter**: 5 credits for $10 ($2/credit)
- **Standard**: 15 credits for $25 ($1.67/credit)
- **Pro**: 50 credits for $60 ($1.20/credit)

**Prices defined in:**

- `STRIPE_PRICES` constant in `src/lib/stripe/products.ts`

### Webhook Security

- **Endpoint**: `/api/webhooks/stripe`
- **Verification**: `stripe.webhooks.constructEvent()` with signing secret
- **Idempotency**: Check `purchases.stripe_payment_intent_id` to prevent duplicate credits

---

## Testing Strategy

### Test Distribution (80/15/5)

- **80% Integration Tests**: Full Server Actions with real Supabase test database
- **15% E2E Tests**: Playwright tests for critical user flows (signup → generate → export)
- **5% Unit Tests**: Pure utility functions (date formatting, token generation, etc.)

### Critical Test Coverage

**100% coverage required for:**

- Credit consumption logic (`app/actions/credits.ts`)
- RLS policy validation (`tests/helpers/assertRlsBlocks.ts`)
- Guest token generation/validation
- Stripe webhook handling

**90% coverage target for:**

- Server Actions (all mutations)
- LLM integration (with MSW mocks)
- Adventure generation pipeline

### Testing Tools

- **Vitest**: Unit + integration tests
- **Playwright**: E2E tests (Chromium only in CI)
- **MSW**: Mock OpenAI API (never mock own code or database!)
- **Test Database**: Real Supabase instance (catches RLS bugs)

**Test Commands:**

```bash
npm run test:watch      # TDD workflow
npm run test:coverage   # Enforce 90% threshold
npm run test:e2e        # Playwright tests
```

---

## Focus Mode (Detailed Specification)

### UX Requirements

**Layout:**

- **Sidebar (left)**: List of all movements with status indicators
  - Locked movements: 🔒 icon
  - Current focus: Highlighted background
  - Completed: ✓ checkmark

- **Main Panel (center)**: Selected movement editor
  - Title (editable)
  - Type selector (exploration | combat | social)
  - Content textarea (Markdown)
  - "Regenerate" button (calls LLM with locked context)
  - "Lock/Unlock" toggle

- **Preview Panel (right)**: Live Markdown preview
  - Read-only
  - Syntax highlighted
  - Scrolls independently

### State Management (Zustand Store)

```typescript
interface FocusMode Store {
  adventureId: string
  movements: Movement[]
  focusedMovementId: string | null
  history: Movement[][] // for undo/redo
  historyIndex: number

  // Actions
  focusMovement: (id: string) => void
  updateMovement: (id: string, updates: Partial<Movement>) => void
  regenerateMovement: (id: string) => Promise<void>
  toggleLock: (id: string) => void
  undo: () => void
  redo: () => void
  saveToServer: () => Promise<void>
}
```

### Regeneration Logic

**When user clicks "Regenerate":**

1. Collect all locked movements (for context)
2. Build prompt:
   - System: Frame lore + Daggerheart rules
   - User: Adventure config + locked movements + current movement summary
   - Output schema: `MovementSchema` (Zod)
3. Call OpenAI GPT-4 with structured output
4. Validate response with Zod
5. Update Zustand store (push to history for undo)
6. Auto-save to Supabase (debounced 2 seconds)

**Cost:** Regenerations are FREE (no credit deduction) to encourage iteration, but LIMITED:

- Scaffold stage: 10 regenerations maximum
- Expansion stage: 20 regenerations maximum

---

## User Flows

### 1. Guest User (MVP)

```
1. Land on homepage
2. See main features (most grayed out/disabled)
3. Two available actions:
   - Download sample adventure (pre-generated Markdown)
   - Click "Buy Credits" → Redirect to Stripe Checkout
4. Complete Stripe purchase
5. Create account (email + password, no payment info needed again)
6. Dashboard now shows:
   - Credit balance: [purchased amount]
   - "New Adventure" button (now enabled)
7. Click "New Adventure"
8. Configure adventure form:
   - Frame: Witherwild
   - Party size: 4
   - Difficulty: Standard
   - Motifs: Mystery + Exploration
9. Click "Generate Scaffold"
   - Deduct 1 credit
   - Show loading spinner (5-10 seconds)
   - Redirect to Focus Mode (Scaffold)
10. Review 3-5 movement outlines
11. Click movement → Edit/regenerate in Focus Mode (10 regenerations max)
12. Lock satisfied movements
13. Click "Generate Full Adventure"
   - Expand all movements with 4 components each (15-20 seconds)
14. Re-enter Focus Mode (Expansion) to refine components (20 regenerations max)
15. Click "Export Markdown"
```

### 2. Registered User (Repeat Purchase)

```
1. Login with Supabase Auth
2. Dashboard shows:
   - Credit balance: 3 credits
   - Past adventures: List with titles + dates
3. Click "New Adventure"
4. Configure → Generate Scaffold (same as guest flow)
5. Focus Mode → Edit → Generate Full
6. Export Markdown
7. Balance: 2 credits remaining
8. Click "Buy Credits" → Stripe Checkout → Redirect back with updated balance
```

### 3. Admin User (Seed Content)

```
1. Login with admin role
2. Navigate to /admin/content
3. Upload Daggerheart sourcebook PDF
4. Server extracts text → Chunks into sections
5. Generate embeddings (OpenAI) → Store in game_content
6. Test semantic search with sample query
```

---

## Deployment Architecture

### Vercel Configuration

**Environment:**

- **Edge Functions**: For Server Actions (low latency)
- **ISR**: Static pages with revalidation (homepage, pricing)
- **Region**: `iad1` (Washington D.C., close to Supabase US East)

**Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://... (for migrations only)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb... (server-only)

# LLM
OPENAI_API_KEY=sk-... (server-only)

# Payments
STRIPE_SECRET_KEY=sk_live_... (server-only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (server-only)

# Email
RESEND_API_KEY=re_... (server-only)

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### CI/CD Pipeline (GitHub Actions)

**Workflow:** `.github/workflows/ci.yml`

**Stages:**

1. **Lint & Typecheck** (5 min)
   - ESLint with strict rules
   - TypeScript strict mode
   - Prettier format validation
   - Security audit (`./scripts/security-audit.sh`)
   - File size validation (`./scripts/validate-file-size.sh`)

2. **Tests** (12 min)
   - Vitest with auto-retry (`--retry=2`)
   - 90% coverage enforcement
   - Real Supabase test database
   - MSW for LLM mocking

3. **E2E Tests** (10 min, parallel)
   - Playwright (Chromium + Firefox)
   - Uploads test reports on failure

4. **Build Check** (5 min)
   - `next build` (verifies production build)

5. **Deploy** (2 min, main branch only)
   - Vercel webhook trigger
   - Runs after ALL tests pass

**Coverage Threshold:**

- Lines: 90%
- Functions: 90%
- Statements: 90%
- Branches: 90%
- **Security-critical code**: 100% (credits, RLS, auth)

---

## Performance Targets

### Page Load Times

- **Homepage (static)**: < 1 second (FCP)
- **Dashboard (authenticated)**: < 2 seconds (FCP)
- **Focus Mode (dynamic)**: < 2 seconds (FCP)

### LLM Response Times

- **Scaffold generation**: 5-10 seconds (3-5 movements)
- **Movement expansion**: 3-5 seconds per movement (parallel)
- **Regeneration**: 3-5 seconds (single movement)

### Database Query Performance

- **Vector search**: < 100ms (ivfflat index)
- **User dashboard query**: < 50ms (indexed by user_id)
- **RLS-filtered queries**: < 100ms (auth.uid() cached in session)

### Optimization Strategies

- **LLM caching**: `llm_cache` table (hit rate target: 30%)
- **React Server Components**: Render on server, stream to client
- **Edge Functions**: Deploy close to users (latency < 50ms)
- **Image optimization**: Next.js Image component (WebP, lazy loading)

---

## Known Limitations & Future Work

### Current Limitations

1. **One-shot adventures only**: No multi-session campaigns (MVP scope)
2. **Frames limited**: Witherwild only in MVP (more frames post-launch)
3. **No collaboration**: Single-user editing (multiplayer future feature)
4. **Markdown export only**: No PDF (requires additional rendering library)
5. **English only**: No i18n (future feature)

### Post-MVP Roadmap

**Phase 2 (Next 3 months):**

- [ ] PDF export (with layout templates)
- [ ] Additional frames (Underdeep, Drakkenheim, Tangled Fates)
- [ ] Community adventure marketplace (share/remix)
- [ ] Advanced customization (custom NPCs, adversaries)

**Phase 3 (6-12 months):**

- [ ] Multi-session campaign support
- [ ] Collaborative editing (real-time with Supabase Realtime)
- [ ] Mobile app (React Native)
- [ ] Offline mode (for premium users)

---

## Success Metrics

### Technical KPIs

- **Uptime**: 99.9% (excluding planned maintenance)
- **API error rate**: < 1%
- **LLM failure rate**: < 2% (with retries)
- **Test coverage**: ≥ 90% (enforced in CI)

### User Experience KPIs

- **Time to first adventure**: < 10 minutes (configuration + generation)
- **Scaffold satisfaction**: > 80% (first generation)
- **Export completion rate**: > 90% (users who start → finish)
- **Regeneration rate**: < 30% (indicates good initial quality)

### Business KPIs

- **Guest → Registered conversion**: > 20% (post-first adventure)
- **Credit purchase rate**: > 40% (registered users who buy credits)
- **Average purchase value**: $25 (Standard package)
- **Monthly active users**: > 1000 (Month 3 post-launch)

---

## Technical Debt & Risks

### Known Technical Debt

1. **No LLM fallback**: If OpenAI is down, entire generation fails
   - **Mitigation**: Add Anthropic Claude as fallback provider

2. **Guest token security**: 24-hour window is generous
   - **Mitigation**: Reduce to 6 hours post-MVP

3. **No rate limiting**: Users could spam generation
   - **Mitigation**: Add rate limiter (Upstash Redis) in Server Actions

4. **Single-region deployment**: Supabase US East only
   - **Mitigation**: Add EU/APAC regions post-MVP

### Security Risks

1. **Prompt injection**: Users could manipulate LLM prompts
   - **Mitigation**: Strict input validation with Zod, sanitize user inputs

2. **Credit fraud**: Users could reverse Stripe charges after using credits
   - **Mitigation**: Monitor Stripe dispute rate, freeze accounts with chargebacks

3. **Guest token sharing**: Users could share tokens to get free adventures
   - **Mitigation**: Limit guest tokens to 1 adventure per 24 hours per email

---

## Questions for Alignment

### Product Scope

1. **Frame support**: Which frames should MVP include? (Witherwild only, or add 2-3 more?)
2. **Party size limits**: 1-6 players, or restrict to 3-5 for quality?
3. **Adventure length**: Hard cap at "one-shot" (3-4 hours), or allow "short" (1-2 hours)?

### Monetization

1. **Credit pricing**: Current packages OK, or adjust ($2/credit seems high)?
2. **Guest limit**: 1 free adventure per email lifetime, or allow 1 per week?
3. **Refund policy**: How to handle disputes? (Stripe allows 120-day chargeback window)

### Technical

1. **LLM provider**: OpenAI only, or add Anthropic Claude as fallback?
2. **Vector search**: Current `ivfflat` index OK, or upgrade to `hnsw` for better accuracy?
3. **Export formats**: Markdown only for MVP, or add JSON/HTML?

### Operations

1. **Support**: Email-only support, or add in-app chat (e.g., Intercom)?
2. **Analytics**: PostHog sufficient, or add Mixpanel/Amplitude for funnels?
3. **Monitoring**: Basic web vitals OK, or add Sentry for error tracking?

---

## Appendices

### A. Glossary

- **Frame**: Daggerheart campaign setting (e.g., Witherwild, Underdeep)
- **Movement**: A major scene/act in an adventure (3-5 per adventure)
- **Scaffold**: High-level outline of movements (before expansion)
- **Focus Mode**: Editor interface for refining individual movements
- **RLS**: Row-Level Security (Supabase/PostgreSQL feature for multi-tenancy)
- **Server Action**: Next.js server-side function (replaces REST API)

### B. Related Documents

- **[archive/PRPs/daggergm_mvp_implementation.md](./archive/PRPs/daggergm_mvp_implementation.md)**: Original implementation plan (archived)
- **[archive/PRPs/INITIAL_daggergm_REVISED.md](./archive/PRPs/INITIAL_daggergm_REVISED.md)**: Initial feature overview (archived)
- **[tasks/](./tasks/)**: Active feature and fix tasks
- **[architecture/TESTING_STRATEGY.md](./architecture/TESTING_STRATEGY.md)**: Testing philosophy
- **[architecture/STATE_MANAGEMENT_DECISION.md](./architecture/STATE_MANAGEMENT_DECISION.md)**: Zustand rationale
- **[ops/GITHUB_ACTIONS.md](./ops/GITHUB_ACTIONS.md)**: CI/CD pipeline docs

---

**Version**: 2.2
**Last Updated**: 2025-12-28
**Author**: Claude Code
**Status**: Living document (update as system evolves)
