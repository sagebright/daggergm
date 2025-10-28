import { OpenAI } from 'openai'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { OpenAIProvider } from '@/lib/llm/openai-provider'
import type { ScaffoldParams, ExpansionParams, RefinementParams } from '@/lib/llm/types'

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                role: 'assistant' as const,
                content: JSON.stringify({
                  title: 'Test Adventure',
                  description: 'Test description',
                  estimatedDuration: '3-4 hours',
                  movements: [],
                }),
              },
              finish_reason: 'stop' as const,
              index: 0,
              logprobs: null,
            },
          ],
        }),
      },
    },
  })),
}))

// Mock Supabase for caching
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn(),
  })),
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

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider
  let mockOpenAI: InstanceType<typeof OpenAI>

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up the mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  role: 'assistant' as const,
                  content: JSON.stringify({
                    title: 'Test Adventure',
                    description: 'Test description',
                    estimatedDuration: '3-4 hours',
                    movements: [],
                  }),
                },
                finish_reason: 'stop' as const,
                index: 0,
                logprobs: null,
              },
            ],
          }),
        },
      },
    } as unknown as InstanceType<typeof OpenAI>

    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI)

    provider = new OpenAIProvider()
  })

  describe('temperature strategies', () => {
    it('should use correct temperature for scaffold generation', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'corruption',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-1',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'The Corrupted Grove',
                description: 'A dark adventure',
                movements: [],
              }),
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await provider.generateAdventureScaffold(params)

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.75, // Scaffold temperature
          model: 'gpt-4-turbo-preview',
          response_format: { type: 'json_object' },
        }),
      )
    })

    it('should use lower temperature for combat encounters', async () => {
      const params: ExpansionParams = {
        movement: {
          id: 'mov-1',
          title: 'Bandit Ambush',
          type: 'combat',
          content: 'Initial combat description',
        },
        adventure: {
          frame: 'witherwild',
          focus: 'survival',
          partySize: 4,
          partyLevel: 2,
        },
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-2',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: 'Expanded combat encounter...',
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await provider.expandMovement(params)

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5, // Combat temperature (lower for consistency)
        }),
      )
    })

    it('should use higher temperature for NPC dialogue', async () => {
      const params: ExpansionParams = {
        movement: {
          id: 'mov-2',
          title: 'The Merchant',
          type: 'social',
          content: 'A merchant approaches',
        },
        adventure: {
          frame: 'witherwild',
          focus: 'intrigue',
          partySize: 4,
          partyLevel: 2,
        },
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-3',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: 'Colorful NPC dialogue...',
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await provider.expandMovement(params)

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9, // NPC dialogue temperature (higher for variety)
        }),
      )
    })
  })

  describe('frame-aware prompts', () => {
    it('should include frame-specific context in scaffold prompt', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'corruption',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-4',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'Test Adventure',
                movements: [],
              }),
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await provider.generateAdventureScaffold(params)

      // Check that system message includes Witherwild context
      const call = vi.mocked(mockOpenAI.chat.completions.create).mock.calls[0]![0]!
      expect(call.messages![0]!.content).toContain('Witherwild')
      expect(call.messages![0]!.content).toContain('corruption')
      expect(call.messages![0]!.content).toContain('Ancient corruption spreading')
    })

    it('should handle custom frames appropriately', async () => {
      const params: ScaffoldParams = {
        frame: 'custom',
        customFrameDescription: 'A world of floating islands',
        focus: 'exploration',
        partySize: 4,
        partyLevel: 1,
        difficulty: 'easier',
        stakes: 'low',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-5',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'Island Hopping',
                movements: [],
              }),
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await provider.generateAdventureScaffold(params)

      const call = vi.mocked(mockOpenAI.chat.completions.create).mock.calls[0]![0]!
      expect(call.messages![1]!.content).toContain('floating islands')
      expect(call.messages![0]!.content).not.toContain('Witherwild')
    })
  })

  describe('caching behavior', () => {
    it('should check cache before making API call', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'mystery',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      // Mock cache hit
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'llm_cache') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValueOnce({
                data: {
                  id: 'cache-123',
                  response: JSON.stringify({
                    title: 'Cached Adventure',
                    movements: [],
                  }),
                  access_count: 1,
                },
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          }
        }),
      }

      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
      )

      const result = await provider.generateAdventureScaffold(params)

      // Should not call OpenAI
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled()
      expect(result.title).toBe('Cached Adventure')
    })

    it('should cache new responses', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'exploration',
        partySize: 3,
        partyLevel: 1,
        difficulty: 'easier',
        stakes: 'low',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-6',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'New Adventure',
                movements: [],
              }),
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
        usage: {
          total_tokens: 500,
          prompt_tokens: 300,
          completion_tokens: 200,
        },
      })

      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'llm_cache') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null }), // Cache miss
              insert: mockInsert,
            }
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          }
        }),
      }

      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
      )

      await provider.generateAdventureScaffold(params)

      // Should cache the response
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt_hash: expect.any(String),
          response: expect.stringContaining('New Adventure'),
          model: 'gpt-4-turbo-preview',
          temperature: 0.75,
          token_count: 500,
        }),
      )
    })

    it('should update access count for cached responses', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'combat',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      let callCount = 0
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'llm_cache') {
            callCount++
            if (callCount === 1) {
              // First call for cache check
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValueOnce({
                  data: {
                    id: 'cache-123',
                    response: JSON.stringify({ title: 'Cached', movements: [] }),
                    access_count: 5,
                  },
                }),
              }
            } else {
              // Second call for update
              return {
                update: mockUpdate,
              }
            }
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          }
        }),
      }

      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>,
      )

      await provider.generateAdventureScaffold(params)

      // Should update access count
      expect(mockSupabase.from).toHaveBeenCalledWith('llm_cache')
      expect(mockUpdate).toHaveBeenCalledWith({
        accessed_at: expect.any(String),
        access_count: 6,
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'mystery',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      // Mock Supabase to return null for cache (no cache hit)
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      vi.mocked(createServerSupabaseClient).mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          insert: vi.fn(),
        }),
      } as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>)

      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error('API rate limit exceeded'),
      )

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow(
        'API rate limit exceeded',
      )
    })

    it('should handle malformed JSON responses', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'exploration',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-7',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: 'Not valid JSON',
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow()
    })

    it('should handle network timeout errors', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'mystery',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error('Request timeout'),
      )

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow('Request timeout')
    })

    it('should handle 503 service unavailable errors', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'combat',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      const error = new Error('Service temporarily unavailable')
      ;(error as any).status = 503

      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(error)

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow(
        'Service temporarily unavailable',
      )
    })

    it('should handle 401 authentication errors', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'exploration',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      const error = new Error('Invalid API key')
      ;(error as any).status = 401

      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(error)

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow('Invalid API key')
    })

    it('should handle empty response choices array', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'mystery',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-empty',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [],
      })

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow()
    })

    it('should handle undefined content in response', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'social',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-undefined',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: undefined as any,
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      await expect(provider.generateAdventureScaffold(params)).rejects.toThrow()
    })

    it('should handle missing finish_reason in response', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'combat',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-missing-finish',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'Test',
                description: 'Test',
                movements: [],
              }),
            },
            finish_reason: undefined as any,
            index: 0,
            logprobs: null,
          },
        ],
      })

      // Should still work even with missing finish_reason
      const result = await provider.generateAdventureScaffold(params)
      expect(result).toBeDefined()
    })

    it('should handle JSON with extra unexpected fields', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'exploration',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-extra-fields',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'Test Adventure',
                description: 'Test description',
                estimatedDuration: '2-3 hours',
                movements: [],
                unexpectedField: 'should be ignored',
                anotherExtra: 12345,
              }),
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      const result = await provider.generateAdventureScaffold(params)
      expect(result).toBeDefined()
      expect(result.title).toBe('Test Adventure')
    })

    it('should handle incomplete JSON with wrong types', async () => {
      const params: ScaffoldParams = {
        frame: 'witherwild',
        focus: 'mystery',
        partySize: 4,
        partyLevel: 2,
        difficulty: 'standard',
        stakes: 'personal',
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-incomplete',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({
                title: 'Test Adventure',
                description: 'Test description',
                estimatedDuration: '2-3 hours',
                movements: 'not an array', // Wrong type - should be array
              }),
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      // This tests that the code handles unexpected types gracefully
      // Since we're using JSON.parse without Zod validation in the current implementation,
      // this will actually succeed but return invalid data
      const result = await provider.generateAdventureScaffold(params)
      // The provider doesn't validate, so it will parse successfully
      expect(result).toBeDefined()
    })

    it('should handle expansion with malformed JSON', async () => {
      const params: ExpansionParams = {
        movement: {
          id: 'mov-1',
          title: 'Test Movement',
          type: 'exploration',
          content: '',
          estimatedTime: '15 minutes',
        },
        adventure: {
          frame: 'witherwild',
          focus: 'test',
          partySize: 4,
          partyLevel: 2,
        },
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-expansion-malformed',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: '{invalid json structure',
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      // The provider doesn't validate content, it just returns what the LLM provides
      const result = await provider.expandMovement(params)
      expect(result.content).toBe('{invalid json structure')
    })

    it('should handle refinement with empty instruction', async () => {
      const params: RefinementParams = {
        content: 'The party enters the tavern.',
        instruction: '',
        context: {
          movement: {
            type: 'social',
            title: 'The Rusty Tankard',
          },
          adventure: {
            frame: 'witherwild',
            tone: 'gritty',
          },
        },
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-refinement-empty',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: 'The party enters the tavern.',
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      const result = await provider.refineContent(params)
      expect(result.refinedContent).toBeDefined()
    })
  })

  describe('refinement functionality', () => {
    it('should refine content with context', async () => {
      const params: RefinementParams = {
        content: 'The party enters the tavern.',
        instruction: 'Add more sensory details',
        context: {
          movement: {
            type: 'social',
            title: 'The Rusty Tankard',
          },
          adventure: {
            frame: 'witherwild',
            tone: 'gritty',
          },
        },
      }

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: 'test-completion-8',
        object: 'chat.completion' as const,
        created: Date.now(),
        model: 'gpt-4-turbo-preview',
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: 'The party pushes through the heavy oak door...',
            },
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
          },
        ],
      })

      const result = await provider.refineContent(params)

      expect(result.refinedContent).toContain('heavy oak door')
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8, // Description temperature
        }),
      )
    })
  })
})
