import { vi } from 'vitest'

export const mockSupabaseServer = () => {
  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() =>
      Promise.resolve({
        from: vi.fn(() => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
          update: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockResolvedValue({ error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      }),
    ),
  }))
}
