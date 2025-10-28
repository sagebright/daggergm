import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock embeddings function
const mockEmbeddingsCreate = vi.fn().mockResolvedValue({
  data: [
    {
      embedding: new Array(1536).fill(0.1), // Mock embedding vector
    },
  ],
})

// Mock OpenAI at module level
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: mockEmbeddingsCreate,
    },
  })),
}))

// Create mock RPC function
const mockRpc = vi.fn().mockResolvedValue({
  data: [
    {
      id: 'test-1',
      name: 'Test Result',
      similarity: 0.9,
    },
  ],
  error: null,
})

// Mock Supabase at module level
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}))

// Import after mocks are set up
const { searchAdversaries, searchWeapons, searchEnvironments, searchItems } = await import(
  '@/lib/supabase/search-content'
)

describe('search-content vector search functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock implementations
    mockEmbeddingsCreate.mockResolvedValue({
      data: [
        {
          embedding: new Array(1536).fill(0.1),
        },
      ],
    })

    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'test-1',
          name: 'Test Result',
          similarity: 0.9,
        },
      ],
      error: null,
    })
  })

  describe('searchAdversaries', () => {
    it('should search adversaries using vector similarity', async () => {
      const results = await searchAdversaries('underground insect creature', 5)

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'underground insect creature',
      })

      expect(mockRpc).toHaveBeenCalledWith('match_adversaries', {
        query_embedding: expect.any(Array),
        match_threshold: 0.7,
        match_count: 5,
      })

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty('name', 'Test Result')
    })

    it('should use default limit of 5 if not specified', async () => {
      await searchAdversaries('dragon')

      expect(mockRpc).toHaveBeenCalledWith(
        'match_adversaries',
        expect.objectContaining({
          match_count: 5,
        }),
      )
    })

    it('should throw error if no embedding returned', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [],
      })

      await expect(searchAdversaries('test')).rejects.toThrow('No embedding returned from OpenAI')
    })

    it('should throw error if RPC fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: new Error('RPC failed'),
      })

      await expect(searchAdversaries('test')).rejects.toThrow('RPC failed')
    })
  })

  describe('searchWeapons', () => {
    it('should search weapons using vector similarity', async () => {
      const results = await searchWeapons('longsword', 3)

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'longsword',
      })

      expect(mockRpc).toHaveBeenCalledWith('match_weapons', {
        query_embedding: expect.any(Array),
        match_threshold: 0.7,
        match_count: 3,
      })

      expect(results).toBeDefined()
    })

    it('should throw error if no embedding returned', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [],
      })

      await expect(searchWeapons('test')).rejects.toThrow('No embedding returned from OpenAI')
    })
  })

  describe('searchEnvironments', () => {
    it('should search environments using vector similarity', async () => {
      const results = await searchEnvironments('dark forest', 10)

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'dark forest',
      })

      expect(mockRpc).toHaveBeenCalledWith('match_environments', {
        query_embedding: expect.any(Array),
        match_threshold: 0.7,
        match_count: 10,
      })

      expect(results).toBeDefined()
    })

    it('should throw error if no embedding returned', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [],
      })

      await expect(searchEnvironments('test')).rejects.toThrow('No embedding returned from OpenAI')
    })
  })

  describe('searchItems', () => {
    it('should search items using vector similarity', async () => {
      const results = await searchItems('healing potion', 7)

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'healing potion',
      })

      expect(mockRpc).toHaveBeenCalledWith('match_items', {
        query_embedding: expect.any(Array),
        match_threshold: 0.7,
        match_count: 7,
      })

      expect(results).toBeDefined()
    })

    it('should throw error if no embedding returned', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [],
      })

      await expect(searchItems('test')).rejects.toThrow('No embedding returned from OpenAI')
    })

    it('should throw error if RPC fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      })

      await expect(searchItems('test')).rejects.toThrow('Database error')
    })
  })
})
