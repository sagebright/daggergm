---
name: 'LLM Integration Patterns'
description: 'Enforce OpenAI GPT-4 integration patterns with Zod validation and proper error handling for DaggerGM'
---

# LLM Integration Patterns (DaggerGM)

Auto-activates: OpenAI calls, prompt engineering, LLM response handling.

**CRITICAL**: ALWAYS validate LLM output with Zod schemas - NEVER trust raw responses!

## MANDATORY PATTERN: Structured Outputs with Zod

### ✅ CORRECT: Full Pattern with Validation

```typescript
// features/generation/actions.ts
'use server'

import { z } from 'zod'
import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

// 1️⃣  Define strict Zod schema
const AdventureGenerationSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(50).max(500),
  frame: z.enum(['witherwild', 'celestial', 'undergrowth']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  scenes: z
    .array(
      z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(50).max(1000),
        type: z.enum(['combat', 'social', 'exploration', 'puzzle']),
        challenges: z.array(z.string()).min(1).max(3),
        rewards: z.string().optional(),
      }),
    )
    .min(3)
    .max(8),
})

type AdventureGeneration = z.infer<typeof AdventureGenerationSchema>

// 2️⃣  Server Action with proper error handling
export async function generateAdventure(prompt: string) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('adventure_credits')
    .eq('user_id', user.id)
    .single()

  if (!credits || credits.adventure_credits < 1) {
    return { success: false, error: 'Insufficient credits' }
  }

  try {
    // 3️⃣  Call OpenAI with structured output
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a Daggerheart adventure generator. Generate a complete adventure scaffold based on user prompts. Always return valid JSON matching the exact schema.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Creative but coherent for scaffolds
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // 4️⃣  Parse JSON
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error)
      return { success: false, error: 'Invalid response format from AI' }
    }

    // 5️⃣  Validate with Zod (CRITICAL)
    const validation = AdventureGenerationSchema.safeParse(parsed)

    if (!validation.success) {
      console.error('Zod validation failed:', validation.error)
      return {
        success: false,
        error: 'AI generated invalid adventure structure',
        details: validation.error.flatten().fieldErrors,
      }
    }

    // 6️⃣  Consume credit
    const { error: creditError } = await supabase
      .from('user_credits')
      .update({ adventure_credits: credits.adventure_credits - 1 })
      .eq('user_id', user.id)

    if (creditError) {
      console.error('Failed to consume credit:', creditError)
      return { success: false, error: 'Failed to process credit' }
    }

    // 7️⃣  Save to database
    const { data: adventure, error: saveError } = await supabase
      .from('adventures')
      .insert({
        user_id: user.id,
        ...validation.data,
        status: 'draft',
        generated_with_ai: true,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save adventure:', saveError)
      // Refund credit on save failure
      await supabase
        .from('user_credits')
        .update({ adventure_credits: credits.adventure_credits })
        .eq('user_id', user.id)

      return { success: false, error: 'Failed to save adventure' }
    }

    return { success: true, data: adventure }
  } catch (error: any) {
    console.error('OpenAI generation failed:', error)

    // Handle specific OpenAI errors
    if (error.status === 429) {
      return { success: false, error: 'AI service rate limit. Please try again in a moment.' }
    }

    if (error.status === 500) {
      return { success: false, error: 'AI service temporarily unavailable.' }
    }

    return { success: false, error: 'Failed to generate adventure' }
  }
}
```

### ❌ REJECT: No Validation

```typescript
// ❌ WRONG: No Zod validation
const completion = await openai.chat.completions.create({...})
const data = JSON.parse(completion.choices[0].message.content)
return data  // Could be malformed!

// ❌ WRONG: No error handling
const content = completion.choices[0].message.content
const data = JSON.parse(content)  // Will crash if not JSON

// ❌ WRONG: Trusting LLM structure
return {
  title: data.title,  // Might not exist!
  scenes: data.scenes  // Might be malformed!
}
```

---

## TEMPERATURE SETTINGS (By Content Type)

```typescript
// Scaffold generation (overall structure)
temperature: 0.7 // Creative but coherent

// Combat encounters (mechanical accuracy)
temperature: 0.5 // More deterministic

// Dialogue and NPC personalities
temperature: 0.9 // Maximum creativity

// Scene descriptions
temperature: 0.8 // Vivid but controlled

// Rules clarifications
temperature: 0.3 // Factual and consistent
```

---

## MSW MOCKING PATTERN (Testing)

```typescript
// tests/mocks/openai.ts
import { http, HttpResponse } from 'msw'

export const openaiHandlers = [
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = (await request.json()) as any

    // Extract temperature to determine content type
    const temp = body.temperature || 0.7

    // Generate appropriate mock response
    const mockAdventure = {
      title: 'Test Adventure in the Witherwild',
      description: 'A thrilling adventure through mysterious forests...',
      frame: 'witherwild',
      difficulty: 'medium',
      scenes: [
        {
          title: 'The Mysterious Grove',
          description: 'Ancient trees whisper secrets...',
          type: 'exploration',
          challenges: ['Navigate dense fog', 'Decode tree markings'],
          rewards: 'Map to hidden sanctuary',
        },
        {
          title: 'Guardian Encounter',
          description: 'A forest guardian blocks your path...',
          type: 'combat',
          challenges: ['Defeat forest guardian', 'Protect innocent creatures'],
          rewards: "Guardian's blessing",
        },
        {
          title: 'The Heart of the Forest',
          description: "You reach the forest's sacred center...",
          type: 'social',
          challenges: ['Negotiate with forest spirits', 'Prove your intentions'],
          rewards: 'Ancient knowledge',
        },
      ],
    }

    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify(mockAdventure),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 250,
        total_tokens: 400,
      },
    })
  }),

  // Mock error scenarios
  http.post('https://api.openai.com/v1/chat/completions', () => {
    // Simulate rate limit
    if (Math.random() < 0.1) {
      // 10% chance
      return new HttpResponse(null, {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      })
    }

    // Simulate malformed response
    if (Math.random() < 0.05) {
      // 5% chance
      return HttpResponse.json({
        choices: [
          {
            message: {
              content: 'Not valid JSON!',
            },
          },
        ],
      })
    }
  }),
]
```

---

## RETRY PATTERN (With Exponential Backoff)

```typescript
async function callOpenAIWithRetry<T>(
  schema: z.ZodSchema<T>,
  config: OpenAI.Chat.ChatCompletionCreateParams,
  maxRetries = 3,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create(config)
      const content = completion.choices[0].message.content

      if (!content) {
        throw new Error('Empty response')
      }

      const parsed = JSON.parse(content)
      const validation = schema.safeParse(parsed)

      if (validation.success) {
        return { success: true, data: validation.data }
      }

      lastError = validation.error

      // If validation failed, try again with adjusted prompt
      if (attempt < maxRetries - 1) {
        config.messages.push({
          role: 'user',
          content: `Previous response was invalid. Please ensure the JSON matches the exact schema.`,
        })
      }
    } catch (error: any) {
      lastError = error

      // Don't retry on client errors (except rate limit)
      if (error.status && error.status !== 429 && error.status < 500) {
        break
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error('OpenAI call failed after retries:', lastError)
  return { success: false, error: 'Failed after multiple attempts' }
}
```

---

## COST MONITORING

```typescript
// Track token usage
export async function generateAdventure(prompt: string) {
  const completion = await openai.chat.completions.create({...})

  const usage = completion.usage
  if (usage) {
    await supabase
      .from('llm_usage_logs')
      .insert({
        user_id: user.id,
        model: 'gpt-4',
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        estimated_cost: calculateCost(usage.total_tokens, 'gpt-4')
      })
  }

  return { success: true, data: adventure }
}

function calculateCost(tokens: number, model: string): number {
  // GPT-4 pricing (as of 2024)
  const pricePerToken = model === 'gpt-4' ? 0.00003 : 0.000002
  return tokens * pricePerToken
}
```

---

## SUCCESS CRITERIA (Binary)

```bash
# All must exit 0:

# 1. All OpenAI calls have Zod validation
grep -r "openai.chat.completions.create" src --include="*.ts" 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    grep -q "safeParse\|parse" "$file" || exit 1
  done

# 2. All LLM responses are JSON.parsed
! grep -r "completion.choices\[0\].message.content" src --include="*.ts" 2>/dev/null | \
  grep -v "JSON.parse"

# 3. All OpenAI calls have try-catch
grep -r "openai.chat.completions.create" src --include="*.ts" 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    linenum=$(echo "$line" | cut -d: -f2)
    # Check if within try block (previous 10 lines)
    sed -n "$((linenum-10)),$linenum p" "$file" | grep -q "try" || exit 1
  done

# 4. All generation functions consume credits
grep -r "openai.chat.completions.create" src/features --include="*.ts" 2>/dev/null | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    grep -q "adventure_credits.*-.*1\|credits.*consume" "$file" || exit 1
  done

# 5. No hardcoded prompts over 500 characters
! grep -rn "content.*:.*['\"]" src --include="*.ts" 2>/dev/null | \
  awk '{if(length($0)>550) print}'
```

**If ANY fails → LLM integration unsafe → Fix before merge**

---

**Reference**: CLAUDE.md "LLM Integration" section
**Validation**: ALWAYS use Zod (never trust LLM output)
**Error Handling**: Retry with exponential backoff
**Temperature**: 0.3-0.9 based on content type
**Testing**: MSW mocking for all LLM calls
**Cost**: Monitor token usage, log to database
