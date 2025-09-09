import { vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.generated'

/**
 * Creates a mock Supabase client for testing
 * Provides all the methods we use in the app with vi.fn() mocks
 */
export function createMockSupabaseClient() {
  const mockClient = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),

    rpc: vi.fn(),

    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },

    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },

    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    },
  } as unknown as SupabaseClient<Database>

  return mockClient
}

/**
 * Type helper for the mock client
 */
export type MockSupabaseClient = SupabaseClient<Database>
