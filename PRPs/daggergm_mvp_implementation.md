# DaggerGM MVP Implementation Plan

## Executive Summary

DaggerGM is a greenfield SaaS application that revolutionizes TTRPG adventure preparation through AI-guided generation with Frame-aware content creation and semantic search capabilities. Built on Next.js 14 with Server Actions, Supabase, and GPT-4, the platform enables Game Masters to generate, refine, and export complete one-shot adventures in under 10 minutes.

This document provides a comprehensive implementation blueprint for the MVP, including architectural decisions, validation strategies, security considerations, and performance optimization approaches.

---

## 🏗️ Architecture Overview

### Technology Stack

```yaml
Frontend:
  - React 18.2+ with Next.js 14.2+
  - TypeScript 5.3+
  - Tailwind CSS 3.4+
  - shadcn/ui (latest)
  - TanStack Query v5
  - React Hook Form v7
  - next-themes for theme management

Backend:
  - Next.js Server Actions (no separate API layer)
  - Supabase (PostgreSQL 15+)
  - pgvector 0.8.0+
  - OpenAI API (GPT-4-turbo)
  - Stripe API v13+

Infrastructure:
  - Vercel (primary deployment)
  - Supabase Cloud
  - OpenAI API
  - Stripe
  - Resend (email)
```

### Architecture Principles

1. **Server-First Design**: Leverage React Server Components for optimal performance
2. **Edge-Ready**: Deploy close to users with Vercel Edge Functions
3. **Type-Safe**: End-to-end TypeScript with generated Supabase types
4. **Secure by Default**: RLS on all tables, encrypted Server Actions
5. **Cost-Optimized**: Semantic caching, efficient vector storage

---

## 📊 Database Architecture

### Core Schema Implementation

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- User profiles with credit system
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    credits INT DEFAULT 1 CHECK (credits >= 0),
    total_purchased INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adventures with comprehensive metadata
CREATE TABLE adventures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    guest_email TEXT,
    guest_token UUID DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    frame TEXT NOT NULL,
    focus TEXT NOT NULL,
    state TEXT DEFAULT 'draft' CHECK (state IN ('draft', 'finalized', 'exported')),
    config JSONB NOT NULL DEFAULT '{}',
    movements JSONB[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    exported_at TIMESTAMPTZ,

    -- Ensure guest adventures have email
    CONSTRAINT guest_adventure_email CHECK (
        (user_id IS NOT NULL) OR (guest_email IS NOT NULL)
    )
);

-- Frame-aware content with vector embeddings
CREATE TABLE game_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    frame TEXT,
    source_book TEXT NOT NULL,
    game_element JSONB NOT NULL,
    searchable_text TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic caching for LLM responses
CREATE TABLE llm_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_hash TEXT UNIQUE NOT NULL,
    prompt_params JSONB NOT NULL,
    response TEXT NOT NULL,
    response_metadata JSONB DEFAULT '{}',
    model TEXT NOT NULL,
    temperature NUMERIC(3,2),
    token_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INT DEFAULT 1
);

-- Purchase history for auditing
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    guest_email TEXT,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount INT NOT NULL,
    credits INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_adventures_user_id ON adventures(user_id);
CREATE INDEX idx_adventures_guest_email ON adventures(guest_email);
CREATE INDEX idx_adventures_state ON adventures(state);
CREATE INDEX idx_game_content_frame ON game_content(frame);
CREATE INDEX idx_game_content_type ON game_content(content_type);
CREATE INDEX idx_game_content_embedding ON game_content USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_llm_cache_prompt_hash ON llm_cache(prompt_hash);
CREATE INDEX idx_llm_cache_accessed ON llm_cache(accessed_at);

-- Full-text search indexes
CREATE INDEX idx_game_content_search ON game_content USING GIN (to_tsvector('english', searchable_text));
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Adventures policies (supporting guest access)
CREATE POLICY "Users can view own adventures" ON adventures
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Guests can view adventures with token" ON adventures
    FOR SELECT TO anon
    USING (
        guest_email IS NOT NULL
        AND guest_token::text = current_setting('app.guest_token', true)
    );

CREATE POLICY "Users can create adventures" ON adventures
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can create adventures" ON adventures
    FOR INSERT TO anon
    WITH CHECK (
        user_id IS NULL
        AND guest_email IS NOT NULL
        AND guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

CREATE POLICY "Users can update own adventures" ON adventures
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Game content policies (read-only for all)
CREATE POLICY "Anyone can read game content" ON game_content
    FOR SELECT TO authenticated, anon
    USING (true);

-- Cache policies (system use only via service role)
CREATE POLICY "System can manage cache" ON llm_cache
    FOR ALL TO service_role
    USING (true);
```

---

## 🔐 Authentication & Authorization

### Magic Link Implementation

```typescript
// lib/auth/magic-link.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function sendMagicLink(email: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) throw error
  return { success: true }
}
```

### Guest Checkout System

```typescript
// lib/auth/guest-checkout.ts
interface GuestCheckoutSession {
  email: string
  adventureId: string
  guestToken: string
}

export async function createGuestSession(
  email: string,
  adventureId: string,
): Promise<GuestCheckoutSession> {
  const guestToken = crypto.randomUUID()

  // Store in encrypted cookie
  cookies().set(
    'guest_session',
    JSON.stringify({
      email,
      adventureId,
      guestToken,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  )

  return { email, adventureId, guestToken }
}
```

---

## 🤖 LLM Integration Architecture

### Provider Abstraction Layer

```typescript
// lib/llm/types.ts
export interface LLMProvider {
  generateAdventureScaffold(params: ScaffoldParams): Promise<ScaffoldResult>
  expandMovement(params: ExpansionParams): Promise<MovementResult>
  refineContent(params: RefinementParams): Promise<RefinementResult>
}

export interface TemperatureStrategy {
  scaffoldGeneration: number // 0.7-0.8
  combatEncounters: number // 0.5
  npcDialogue: number // 0.9
  descriptions: number // 0.8
  mechanicalElements: number // 0.3
}

// lib/llm/openai-provider.ts
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  private temperatures: TemperatureStrategy

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    this.temperatures = {
      scaffoldGeneration: 0.75,
      combatEncounters: 0.5,
      npcDialogue: 0.9,
      descriptions: 0.8,
      mechanicalElements: 0.3,
    }
  }

  async generateAdventureScaffold(params: ScaffoldParams) {
    // Check cache first
    const cached = await this.checkCache(params)
    if (cached) return cached

    const systemPrompt = await this.loadFramePrompt(params.frame, 'scaffold')

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: this.temperatures.scaffoldGeneration,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildScaffoldPrompt(params) },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content!)
    await this.cacheResponse(params, result)

    return result
  }

  private async checkCache(params: any): Promise<any | null> {
    const promptHash = await this.hashPrompt(params)
    const { data } = await supabase
      .from('llm_cache')
      .select('*')
      .eq('prompt_hash', promptHash)
      .single()

    if (data) {
      // Update access timestamp and count
      await supabase
        .from('llm_cache')
        .update({
          accessed_at: new Date().toISOString(),
          access_count: data.access_count + 1,
        })
        .eq('id', data.id)

      return JSON.parse(data.response)
    }

    return null
  }
}
```

### Frame-Aware Prompt System

```typescript
// lib/prompts/frame-prompts.ts
export const FRAME_PROMPTS = {
  witherwild: {
    scaffold: `You are an expert Daggerheart GM crafting adventures in The Witherwild.
    
Key themes:
- Ancient corruption spreading through nature
- Fey bargains and trickery
- Lost civilizations reclaimed by the forest
- The balance between civilization and wilderness

When generating adventures:
1. Include at least one corruption-themed encounter
2. Feature Frame-specific adversaries (Tangle Brambles, Dryads)
3. Incorporate environmental hazards unique to the Witherwild
4. Reference the Frame's core conflict`,

    movementTypes: {
      combat: `Design encounters featuring Witherwild adversaries.
      Consider corruption effects on creatures.
      Include environmental hazards like spreading brambles.`,

      exploration: `Create scenes showcasing the Witherwild's dual nature.
      Ancient ruins overtaken by aggressive plant life.
      Fey crossings and their unpredictable effects.`,

      social: `NPCs should reflect the Frame's themes:
      - Druids fighting corruption
      - Fey creatures with alien morality
      - Survivors of lost settlements`,
    },
  },
}
```

### Vector Search Integration

```typescript
// lib/vector/search.ts
export async function searchRelevantContent(
  query: string,
  frame: string,
  contentType: string[],
  limit: number = 10
): Promise<GameContent[]> {
  // Generate embedding for query
  const embedding = await generateEmbedding(query);

  // Perform vector similarity search
  const { data, error } = await supabase.rpc('search_game_content', {
    query_embedding: embedding,
    match_frame: frame,
    match_types: contentType,
    match_count: limit,
  });

  if (error) throw error;
  return data;
}

// Supabase function for vector search
CREATE OR REPLACE FUNCTION search_game_content(
  query_embedding vector(1536),
  match_frame text,
  match_types text[],
  match_count int
)
RETURNS TABLE (
  id uuid,
  content_type text,
  frame text,
  game_element jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.content_type,
    gc.frame,
    gc.game_element,
    1 - (gc.embedding <=> query_embedding) as similarity
  FROM game_content gc
  WHERE
    (match_frame IS NULL OR gc.frame = match_frame)
    AND gc.content_type = ANY(match_types)
  ORDER BY gc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 🎨 UI/UX Implementation

### Component Architecture

```typescript
// components/ui/focus-mode.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarkdownPreview } from '@/components/markdown-preview';
import { AIChat } from '@/components/ai-chat';
import { useHotkeys } from '@/hooks/use-hotkeys';

interface FocusModeProps {
  movements: Movement[];
  onUpdate: (movementId: string, updates: Partial<Movement>) => void;
  onExit: () => void;
}

export function FocusMode({ movements, onUpdate, onExit }: FocusModeProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Keyboard shortcuts
  useHotkeys('escape', () => {
    if (focusedId) {
      setFocusedId(null);
    } else {
      onExit();
    }
  });

  useHotkeys('cmd+k', () => setIsPanelOpen(!isPanelOpen));

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Movement List */}
      <div className="h-full overflow-y-auto p-4 pb-20">
        <AnimatePresence mode="wait">
          {movements.map((movement) => (
            <motion.div
              key={movement.id}
              layout
              initial={{ opacity: 0 }}
              animate={{
                opacity: focusedId === null || focusedId === movement.id ? 1 : 0.3,
                scale: focusedId === movement.id ? 1 : 0.98,
              }}
              exit={{ opacity: 0 }}
              className={cn(
                "mb-4 cursor-pointer transition-all",
                focusedId === movement.id && "ring-2 ring-primary"
              )}
              onClick={() => setFocusedId(movement.id)}
            >
              <Card className="p-6">
                {focusedId !== movement.id ? (
                  // Collapsed view
                  <div>
                    <h3 className="text-lg font-semibold">{movement.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {movement.type} • {movement.estimatedTime}
                    </p>
                  </div>
                ) : (
                  // Expanded view
                  <div>
                    <MarkdownEditor
                      value={movement.content}
                      onChange={(content) => onUpdate(movement.id, { content })}
                      placeholder="Start writing your movement..."
                    />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {isPanelOpen && focusedId && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-96 bg-card border-l"
          >
            <AIChat
              context={{
                movementId: focusedId,
                movement: movements.find(m => m.id === focusedId)!,
                adventure: getCurrentAdventure(),
              }}
              onSuggestionApply={(suggestion) => {
                const movement = movements.find(m => m.id === focusedId);
                if (movement) {
                  onUpdate(focusedId, {
                    content: applyAISuggestion(movement.content, suggestion),
                  });
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4"
        onClick={onExit}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### Responsive Design Patterns

```typescript
// hooks/use-media-query.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);

    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
}

// components/layouts/responsive-layout.tsx
export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  if (isTablet) {
    return <TabletLayout>{children}</TabletLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
```

---

## 💰 Monetization Implementation

### Credit System Architecture

```typescript
// lib/credits/credit-manager.ts
export class CreditManager {
  async getUserCredits(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.credits;
  }

  async consumeCredit(userId: string, adventureId: string): Promise<boolean> {
    // Use transaction to ensure atomicity
    const { data, error } = await supabase.rpc('consume_adventure_credit', {
      p_user_id: userId,
      p_adventure_id: adventureId,
    });

    if (error) {
      if (error.code === 'P0001') { // Custom error code for insufficient credits
        throw new InsufficientCreditsError();
      }
      throw error;
    }

    return true;
  }

  async addCredits(userId: string, amount: number, source: string): Promise<void> {
    const { error } = await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_source: source,
    });

    if (error) throw error;
  }
}

// Database function for atomic credit consumption
CREATE OR REPLACE FUNCTION consume_adventure_credit(
  p_user_id UUID,
  p_adventure_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INT;
BEGIN
  -- Lock the user profile row
  SELECT credits INTO v_credits
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check sufficient credits
  IF v_credits < 1 THEN
    RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0001';
  END IF;

  -- Consume credit
  UPDATE user_profiles
  SET credits = credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Mark adventure as credit consumed
  UPDATE adventures
  SET metadata = metadata || jsonb_build_object('credit_consumed', true)
  WHERE id = p_adventure_id;

  RETURN TRUE;
END;
$$;
```

### Stripe Integration

```typescript
// app/api/stripe/create-checkout/route.ts
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { priceId, quantity } = await request.json()
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user?.email,
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    metadata: {
      userId: user?.id || 'guest',
      credits: getCreditAmount(priceId),
    },
  })

  return Response.json({ url: session.url })
}

// Webhook handler
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      await fulfillPurchase(session)
      break
  }
}

async function fulfillPurchase(session: Stripe.Checkout.Session) {
  const { userId, credits } = session.metadata

  // Add credits to user
  await creditManager.addCredits(userId, parseInt(credits), 'stripe_purchase')

  // Record purchase
  await supabase.from('purchases').insert({
    user_id: userId !== 'guest' ? userId : null,
    guest_email: session.customer_email,
    stripe_payment_intent_id: session.payment_intent as string,
    amount: session.amount_total!,
    credits: parseInt(credits),
    status: 'succeeded',
  })
}
```

---

## 🚀 Performance Optimization

### Server Component Strategies

```typescript
// app/adventures/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAdventure } from '@/lib/data/adventures';
import { AdventureViewer } from '@/components/adventure-viewer';
import { AdventureSkeleton } from '@/components/skeletons';

// Static params for common adventures
export async function generateStaticParams() {
  const adventures = await getPopularAdventures();
  return adventures.map((adventure) => ({
    id: adventure.id,
  }));
}

export default async function AdventurePage({
  params
}: {
  params: { id: string }
}) {
  return (
    <Suspense fallback={<AdventureSkeleton />}>
      <AdventureContent id={params.id} />
    </Suspense>
  );
}

async function AdventureContent({ id }: { id: string }) {
  const adventure = await getAdventure(id);

  if (!adventure) {
    notFound();
  }

  return <AdventureViewer adventure={adventure} />;
}
```

### Caching Strategies

```typescript
// lib/cache/strategies.ts
export const cacheStrategies = {
  // Semantic cache for LLM responses
  llmResponse: {
    ttl: 60 * 60 * 24 * 7, // 7 days
    revalidate: 60 * 60 * 24, // 1 day
  },

  // Frame content cache
  frameContent: {
    ttl: 60 * 60 * 24 * 30, // 30 days
    revalidate: 60 * 60 * 24 * 7, // 7 days
  },

  // User data cache
  userData: {
    ttl: 60 * 5, // 5 minutes
    revalidate: 60, // 1 minute
  },
}

// Next.js caching
export async function getCachedAdventure(id: string) {
  return unstable_cache(async () => getAdventure(id), [`adventure-${id}`], {
    revalidate: 60,
    tags: [`adventure-${id}`],
  })()
}
```

### Bundle Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@shadcn/ui', 'lucide-react'],
  },

  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    }

    return config
  },
}
```

---

## 🔒 Security Implementation

### Input Validation

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const adventureConfigSchema = z.object({
  frame: z.enum(['witherwild', 'custom']),
  focus: z.string().min(1).max(100),
  partySize: z.number().min(1).max(6),
  partyLevel: z.number().min(1).max(3),
  difficulty: z.enum(['easier', 'standard', 'harder']),
  stakes: z.enum(['low', 'personal', 'high', 'world']),
})

export const movementUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).optional(),
  type: z.enum(['combat', 'exploration', 'social']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Server action with validation
export async function updateMovement(
  adventureId: string,
  movementId: string,
  updates: z.infer<typeof movementUpdateSchema>,
) {
  // Validate input
  const validated = movementUpdateSchema.parse(updates)

  // Check permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership
  const { data: adventure } = await supabase
    .from('adventures')
    .select('user_id')
    .eq('id', adventureId)
    .single()

  if (adventure?.user_id !== user.id) {
    throw new Error('Forbidden')
  }

  // Perform update
  const { error } = await supabase
    .from('adventures')
    .update({
      movements: supabase.raw(`jsonb_set(movements, '{${movementId}}', ?::jsonb)`, [
        JSON.stringify({ ...validated, updatedAt: new Date() }),
      ]),
      updated_at: new Date(),
    })
    .eq('id', adventureId)

  if (error) throw error

  revalidatePath(`/adventures/${adventureId}`)
}
```

### Rate Limiting

```typescript
// lib/rate-limit/limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Different limits for different operations
export const rateLimiters = {
  // Adventure generation: 10 per hour
  generation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
  }),

  // API calls: 100 per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
  }),

  // Auth attempts: 5 per 15 minutes
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  }),
}

// Middleware usage
export async function rateLimitMiddleware(request: Request, limiter: keyof typeof rateLimiters) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success, limit, reset, remaining } = await rateLimiters[limiter].limit(ip)

  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    })
  }

  return null
}
```

---

## 🧪 Testing Strategy

### Unit Testing

```typescript
// __tests__/lib/llm/prompt-builder.test.ts
import { describe, it, expect } from 'vitest'
import { buildScaffoldPrompt } from '@/lib/llm/prompt-builder'

describe('Prompt Builder', () => {
  it('includes frame-specific context', () => {
    const prompt = buildScaffoldPrompt({
      frame: 'witherwild',
      focus: 'corruption',
      partySize: 4,
      partyLevel: 2,
    })

    expect(prompt).toContain('Witherwild')
    expect(prompt).toContain('corruption')
    expect(prompt).toMatch(/party of 4.*level 2/i)
  })

  it('handles custom frames correctly', () => {
    const prompt = buildScaffoldPrompt({
      frame: 'custom',
      focus: 'mystery',
      customFrameDescription: 'A world of floating islands',
    })

    expect(prompt).toContain('floating islands')
    expect(prompt).not.toContain('Witherwild')
  })
})
```

### Integration Testing

```typescript
// __tests__/integration/adventure-generation.test.ts
import { test, expect } from '@playwright/test'

test.describe('Adventure Generation Flow', () => {
  test('completes full generation flow', async ({ page }) => {
    await page.goto('/')

    // Start generation
    await page.click('text=Generate Adventure')

    // Quick start option
    await page.click('text=Quick Start')

    // Wait for generation
    await page.waitForSelector('[data-testid="adventure-scaffold"]', {
      timeout: 15000,
    })

    // Verify scaffold
    const movements = await page.$$('[data-testid="movement-card"]')
    expect(movements.length).toBeGreaterThanOrEqual(3)

    // Enter focus mode
    await page.click('[data-testid="movement-card"]:first-child')
    await page.waitForSelector('[data-testid="focus-mode"]')

    // Test AI refinement
    await page.fill('[data-testid="ai-prompt"]', 'Add more tension')
    await page.click('text=Apply Suggestion')

    // Export
    await page.click('text=Export Adventure')
    const download = await page.waitForEvent('download')
    expect(download.suggestedFilename()).toMatch(/\.md$/)
  })
})
```

### RLS Testing

```sql
-- Test RLS policies
CREATE OR REPLACE FUNCTION test_adventure_rls()
RETURNS TABLE (test_name TEXT, passed BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  test_user_id UUID;
  test_adventure_id UUID;
  other_user_id UUID;
BEGIN
  -- Create test users
  test_user_id := gen_random_uuid();
  other_user_id := gen_random_uuid();

  -- Test: User can create adventure
  BEGIN
    SET LOCAL "app.current_user_id" TO test_user_id;
    INSERT INTO adventures (user_id, title, frame, focus, config)
    VALUES (test_user_id, 'Test Adventure', 'witherwild', 'test', '{}')
    RETURNING id INTO test_adventure_id;

    RETURN QUERY SELECT 'User can create adventure', TRUE;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'User can create adventure', FALSE;
  END;

  -- Test: User can read own adventure
  BEGIN
    SET LOCAL "app.current_user_id" TO test_user_id;
    PERFORM * FROM adventures WHERE id = test_adventure_id;
    RETURN QUERY SELECT 'User can read own adventure', FOUND;
  END;

  -- Test: Other user cannot read adventure
  BEGIN
    SET LOCAL "app.current_user_id" TO other_user_id;
    PERFORM * FROM adventures WHERE id = test_adventure_id;
    RETURN QUERY SELECT 'Other user cannot read adventure', NOT FOUND;
  END;

  -- Cleanup
  DELETE FROM adventures WHERE id = test_adventure_id;
END;
$$;
```

---

## 📈 Analytics & Monitoring

### Event Tracking

```typescript
// lib/analytics/events.ts
export const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
  // PostHog for product analytics
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, properties)
  }

  // Custom analytics to Supabase
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      properties,
      user_id: getCurrentUserId(),
      session_id: getSessionId(),
      timestamp: new Date(),
    })
  }
}

// Key events to track
export const ANALYTICS_EVENTS = {
  ADVENTURE_STARTED: 'adventure_started',
  SCAFFOLD_GENERATED: 'scaffold_generated',
  MOVEMENT_EXPANDED: 'movement_expanded',
  AI_REFINEMENT_USED: 'ai_refinement_used',
  ADVENTURE_EXPORTED: 'adventure_exported',
  CREDIT_PURCHASED: 'credit_purchased',
  FOCUS_MODE_ENTERED: 'focus_mode_entered',
}
```

### Performance Monitoring

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

// Custom performance tracking
export function measureLLMPerformance() {
  return async function measure<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      // Log to monitoring
      await logPerformance({
        operation,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      await logPerformance({
        operation,
        duration,
        success: false,
        error: error.message,
      });

      throw error;
    }
  };
}
```

---

## 🚢 Deployment Strategy

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OPENAI_API_KEY=your-openai-key

STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key

# Feature flags
NEXT_PUBLIC_ENABLE_MCP=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Security
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=your-encryption-key
```

### Deployment Checklist

```yaml
Pre-deployment:
  - [ ] Run full test suite
  - [ ] Check bundle size < 300KB (First Load JS)
  - [ ] Verify all environment variables
  - [ ] Test RLS policies in staging
  - [ ] Load test API endpoints
  - [ ] Security audit with npm audit

Deployment:
  - [ ] Deploy database migrations
  - [ ] Deploy to Vercel preview
  - [ ] Run smoke tests
  - [ ] Check Core Web Vitals
  - [ ] Deploy to production
  - [ ] Monitor error rates

Post-deployment:
  - [ ] Verify Stripe webhooks
  - [ ] Check analytics events
  - [ ] Monitor LLM costs
  - [ ] Review performance metrics
  - [ ] Update status page
```

### Rollback Procedures

```typescript
// scripts/rollback.ts
async function rollback(version: string) {
  console.log(`Rolling back to version ${version}`)

  // 1. Revert Vercel deployment
  await exec(`vercel rollback ${version} --prod`)

  // 2. Run down migrations if needed
  const migrations = await getMigrationsSince(version)
  for (const migration of migrations.reverse()) {
    await runDownMigration(migration)
  }

  // 3. Clear caches
  await clearRedisCache()
  await purgeeCDN()

  // 4. Notify team
  await notifySlack(`Rolled back to version ${version}`)
}
```

---

## 📅 Implementation Timeline

### Week 1: Foundation (Days 1-7)

**Day 1-2: Project Setup**

- Initialize Next.js 14 with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Set up Supabase project
- Implement database schema and migrations

**Day 3-4: Authentication**

- Magic link authentication flow
- Guest checkout system
- RLS policies implementation
- User profile management

**Day 5-7: Core Data Models**

- Adventure CRUD operations
- Server Actions setup
- Type generation from Supabase
- Basic UI components

### Week 2: Generation Flow (Days 8-14)

**Day 8-9: Wizard UI**

- Frame selection component
- Multi-step form with validation
- Quick Start option
- State management setup

**Day 10-11: LLM Integration**

- OpenAI provider implementation
- Prompt template system
- Temperature strategies
- Response caching

**Day 12-14: Scaffold Generation**

- Generation server action
- Loading states and progress
- Error handling and retries
- Initial testing

### Week 3: Editing Experience (Days 15-21)

**Day 15-16: Focus Mode**

- Focus Mode UI implementation
- Movement card interactions
- Keyboard shortcuts
- Mobile responsive design

**Day 17-18: Content Expansion**

- Movement expansion logic
- Variable temperature application
- Markdown editor integration
- Preview functionality

**Day 19-21: AI Refinement**

- Chat interface for refinements
- Context-aware suggestions
- Suggestion application logic
- Performance optimization

### Week 4: Monetization & Polish (Days 22-28)

**Day 22-23: Payment Integration**

- Stripe checkout flow
- Credit system implementation
- Purchase fulfillment
- Guest checkout support

**Day 24-25: Export Functionality**

- Markdown export generator
- Formatting and styling
- Download implementation
- Email delivery option

**Day 26-28: Testing & Launch Prep**

- Integration test suite
- Performance optimization
- Security audit
- Documentation
- Deployment preparation

---

## 🎯 Success Metrics & Monitoring

### Technical KPIs

```yaml
Performance:
  - First Contentful Paint: < 1.2s
  - Time to Interactive: < 2.5s
  - Cumulative Layout Shift: < 0.1
  - Adventure Generation Time: < 10s (95th percentile)
  - API Response Time: < 500ms (95th percentile)

Reliability:
  - Uptime: > 99.9%
  - Error Rate: < 1%
  - Failed Generations: < 5%
  - Payment Success Rate: > 95%

Efficiency:
  - LLM Cost per Adventure: < $0.50
  - Cache Hit Rate: > 60%
  - Database Query Time: < 100ms (95th percentile)
```

### Business KPIs

```yaml
User Acquisition:
  - Guest → Registered: > 30%
  - Time to First Adventure: < 5 minutes
  - Onboarding Completion: > 80%

Engagement:
  - Adventures per User: > 3 (first month)
  - Focus Mode Usage: > 60%
  - AI Refinement Usage: > 40%
  - Export Rate: > 70%

Monetization:
  - Free → Paid Conversion: > 20%
  - Average Revenue per User: > $10/month
  - Credit Bundle Adoption: > 40%
  - Churn Rate: < 10% monthly
```

---

## 🔮 Future Considerations

### Phase 2 Features (Months 2-3)

1. **MCP Server Integration**
   - Adventure export to MCP format
   - Direct Claude/ChatGPT integration
   - API for third-party tools

2. **Additional Frames**
   - Frame content ingestion pipeline
   - Frame-specific prompt optimization
   - Community frame submissions

3. **Advanced Features**
   - Campaign mode (multi-session)
   - NPC relationship tracking
   - Combat difficulty calculator
   - Loot generation system

### Phase 3 Evolution (Months 4-6)

1. **Community Features**
   - Adventure marketplace
   - User ratings and reviews
   - Collaborative editing
   - Public adventure library

2. **Mobile Application**
   - React Native implementation
   - Offline mode support
   - Push notifications
   - At-table quick reference

3. **Advanced AI Features**
   - Voice narration generation
   - Image generation for scenes
   - Real-time GM assistance
   - Player action predictions

---

## 📚 Resources & Documentation

### External Documentation

- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Stripe Integration Guide](https://stripe.com/docs/payments/integration-builder)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Model Context Protocol](https://github.com/modelcontextprotocol/servers)

### Internal Documentation

- API Documentation: `/docs/api`
- Component Library: `/docs/components`
- Deployment Guide: `/docs/deployment`
- Contributing Guide: `/CONTRIBUTING.md`

---

## 🤝 Team Collaboration

### Code Review Checklist

- [ ] TypeScript types properly defined
- [ ] Server Actions include proper validation
- [ ] RLS policies tested
- [ ] Error boundaries implemented
- [ ] Loading states handled
- [ ] Mobile responsive verified
- [ ] Accessibility standards met
- [ ] Performance impact assessed

### Communication Channels

- Development: GitHub Issues
- Design: Figma Comments
- General: Slack #daggergm
- Incidents: PagerDuty

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-09-09  
**Status**: Ready for Implementation

This PRP represents a comprehensive blueprint for building DaggerGM from the ground up. Every architectural decision has been carefully considered to support the platform's growth while maintaining performance, security, and user experience standards.
