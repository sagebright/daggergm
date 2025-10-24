import { z } from 'zod'

/**
 * Environment Variable Validation for DaggerGM
 *
 * CRITICAL: Validates env vars at runtime to prevent deployment issues.
 * Next.js exposes env vars differently for client vs server.
 *
 * Rules:
 * - Server-only vars: No NEXT_PUBLIC_ prefix
 * - Client-accessible vars: NEXT_PUBLIC_ prefix (careful!)
 * - Never expose API keys to client
 */

// Server-Only Environment Variables
const serverEnvSchema = z.object({
  // Supabase (Server-side)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'Invalid OpenAI API key format'),
  OPENAI_ORG_ID: z.string().optional(),

  // Stripe (Server-side)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key format'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret'),

  // Database (Direct Connection)
  DATABASE_URL: z.string().url('Invalid database URL').optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
})

// Client-Accessible Environment Variables
const clientEnvSchema = z.object({
  // Supabase (Public)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),

  // Stripe (Public Key)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'Invalid Stripe publishable key'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),
})

// Combined Schema
const envSchema = serverEnvSchema.merge(clientEnvSchema)

/**
 * Validate Server Environment (runs on server only)
 */
export function validateServerEnv() {
  try {
    return serverEnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      throw new Error(
        `❌ Invalid server environment variables:\n${missingVars.join('\n')}\n\n` +
          'Check your .env.local file and ensure all required variables are set.',
      )
    }
    throw error
  }
}

/**
 * Validate Client Environment (safe to run in browser)
 */
export function validateClientEnv() {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      throw new Error(`❌ Invalid client environment variables:\n${missingVars.join('\n')}`)
    }
    throw error
  }
}

/**
 * Validate All Environment Variables (server-side only)
 */
export function validateEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('validateEnv() should only be called on the server')
  }

  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars.join('\n')}\n\n` +
          'Check your .env.local file and ensure all required variables are set.',
      )
    }
    throw error
  }
}

// Type-safe environment variables (auto-complete in IDE)
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type Env = z.infer<typeof envSchema>

/**
 * Usage Example:
 *
 * // In Server Component or Server Action
 * import { validateServerEnv } from '@/lib/validators/env';
 *
 * const env = validateServerEnv();
 * const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
 *
 * // In Client Component
 * import { validateClientEnv } from '@/lib/validators/env';
 *
 * const env = validateClientEnv();
 * const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 */
