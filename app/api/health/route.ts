import { NextResponse } from 'next/server'

export async function GET() {
  // Basic health check
  const health: {
    status: string
    timestamp: string
    uptime: number
    environment: string | undefined
    database?: string
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  }

  // Optional: Check database connection
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()

    // Simple query to verify connection
    const { error } = await supabase
      .from('daggerheart_user_profiles')
      .select('count')
      .limit(1)
      .single()

    health.database = error ? 'error' : 'connected'
  } catch {
    health.database = 'error'
  }

  return NextResponse.json(health)
}
