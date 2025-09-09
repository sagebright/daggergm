import { describe, it, expect } from 'vitest'
import {
  movementUpdateSchema,
  movementExpansionSchema,
  type MovementUpdate,
  type MovementExpansion,
} from '@/lib/validation/movement'

describe('Movement Validation Schemas', () => {
  describe('movementUpdateSchema', () => {
    it('should accept valid movement update data', () => {
      const validData = {
        title: 'Test Movement',
        content: 'This is test content',
        type: 'combat' as const,
        estimatedTime: '30 minutes',
        isLocked: false,
        metadata: { key: 'value' },
      }

      const result = movementUpdateSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should accept empty object (all fields optional)', () => {
      const result = movementUpdateSchema.parse({})
      expect(result).toEqual({})
    })

    it('should accept partial update data', () => {
      const partialData = {
        title: 'Updated Title',
        isLocked: true,
      }

      const result = movementUpdateSchema.parse(partialData)
      expect(result).toEqual(partialData)
    })

    describe('title validation', () => {
      it('should reject empty string title', () => {
        const invalidData = { title: '' }
        expect(() => movementUpdateSchema.parse(invalidData)).toThrow()
      })

      it('should reject title longer than 200 characters', () => {
        const invalidData = { title: 'a'.repeat(201) }
        expect(() => movementUpdateSchema.parse(invalidData)).toThrow()
      })

      it('should accept title with 200 characters', () => {
        const validData = { title: 'a'.repeat(200) }
        const result = movementUpdateSchema.parse(validData)
        expect(result.title).toBe('a'.repeat(200))
      })

      it('should accept title with 1 character', () => {
        const validData = { title: 'a' }
        const result = movementUpdateSchema.parse(validData)
        expect(result.title).toBe('a')
      })
    })

    describe('content validation', () => {
      it('should accept empty string content', () => {
        const validData = { content: '' }
        const result = movementUpdateSchema.parse(validData)
        expect(result.content).toBe('')
      })

      it('should reject content longer than 10000 characters', () => {
        const invalidData = { content: 'a'.repeat(10001) }
        expect(() => movementUpdateSchema.parse(invalidData)).toThrow()
      })

      it('should accept content with 10000 characters', () => {
        const validData = { content: 'a'.repeat(10000) }
        const result = movementUpdateSchema.parse(validData)
        expect(result.content).toBe('a'.repeat(10000))
      })
    })

    describe('type validation', () => {
      it('should accept valid movement types', () => {
        const types = ['combat', 'exploration', 'social'] as const

        types.forEach((type) => {
          const validData = { type }
          const result = movementUpdateSchema.parse(validData)
          expect(result.type).toBe(type)
        })
      })

      it('should reject invalid movement type', () => {
        const invalidData = { type: 'invalid_type' }
        expect(() => movementUpdateSchema.parse(invalidData)).toThrow()
      })
    })

    describe('estimatedTime validation', () => {
      it('should accept any string for estimatedTime', () => {
        const validData = { estimatedTime: '30 minutes' }
        const result = movementUpdateSchema.parse(validData)
        expect(result.estimatedTime).toBe('30 minutes')
      })

      it('should accept empty string for estimatedTime', () => {
        const validData = { estimatedTime: '' }
        const result = movementUpdateSchema.parse(validData)
        expect(result.estimatedTime).toBe('')
      })
    })

    describe('isLocked validation', () => {
      it('should accept boolean true', () => {
        const validData = { isLocked: true }
        const result = movementUpdateSchema.parse(validData)
        expect(result.isLocked).toBe(true)
      })

      it('should accept boolean false', () => {
        const validData = { isLocked: false }
        const result = movementUpdateSchema.parse(validData)
        expect(result.isLocked).toBe(false)
      })

      it('should reject non-boolean values', () => {
        const invalidData = { isLocked: 'true' }
        expect(() => movementUpdateSchema.parse(invalidData)).toThrow()
      })
    })

    describe('metadata validation', () => {
      it('should accept object with string keys', () => {
        const validData = {
          metadata: {
            key1: 'string value',
            key2: 123,
            key3: { nested: 'object' },
            key4: ['array'],
          },
        }
        const result = movementUpdateSchema.parse(validData)
        expect(result.metadata).toEqual(validData.metadata)
      })

      it('should accept empty object', () => {
        const validData = { metadata: {} }
        const result = movementUpdateSchema.parse(validData)
        expect(result.metadata).toEqual({})
      })
    })

    describe('type inference', () => {
      it('should have correct TypeScript type', () => {
        // This test verifies type inference works correctly
        const update: MovementUpdate = {
          title: 'Test',
          content: 'Content',
          type: 'social',
          estimatedTime: '30 min',
          isLocked: false,
          metadata: { key: 'value' },
        }

        expect(update.title).toBe('Test')
        expect(update.type).toBe('social')
      })
    })
  })

  describe('movementExpansionSchema', () => {
    it('should accept valid expansion data', () => {
      const validData = {
        movementId: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Expand this movement with more detail',
        includeContext: true,
      }

      const result = movementExpansionSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should use default value for includeContext', () => {
      const data = {
        movementId: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Expand this movement',
      }

      const result = movementExpansionSchema.parse(data)
      expect(result.includeContext).toBe(true)
    })

    it('should accept explicit false for includeContext', () => {
      const data = {
        movementId: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Expand this movement',
        includeContext: false,
      }

      const result = movementExpansionSchema.parse(data)
      expect(result.includeContext).toBe(false)
    })

    describe('movementId validation', () => {
      it('should reject non-UUID strings', () => {
        const invalidData = {
          movementId: 'not-a-uuid',
          prompt: 'Test prompt',
        }
        expect(() => movementExpansionSchema.parse(invalidData)).toThrow()
      })

      it('should reject empty string', () => {
        const invalidData = {
          movementId: '',
          prompt: 'Test prompt',
        }
        expect(() => movementExpansionSchema.parse(invalidData)).toThrow()
      })

      it('should accept valid UUID formats', () => {
        const uuids = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        ]

        uuids.forEach((movementId) => {
          const validData = {
            movementId,
            prompt: 'Test prompt',
          }
          const result = movementExpansionSchema.parse(validData)
          expect(result.movementId).toBe(movementId)
        })
      })
    })

    describe('prompt validation', () => {
      it('should reject empty string', () => {
        const invalidData = {
          movementId: '550e8400-e29b-41d4-a716-446655440000',
          prompt: '',
        }
        expect(() => movementExpansionSchema.parse(invalidData)).toThrow()
      })

      it('should reject prompt longer than 1000 characters', () => {
        const invalidData = {
          movementId: '550e8400-e29b-41d4-a716-446655440000',
          prompt: 'a'.repeat(1001),
        }
        expect(() => movementExpansionSchema.parse(invalidData)).toThrow()
      })

      it('should accept prompt with 1000 characters', () => {
        const validData = {
          movementId: '550e8400-e29b-41d4-a716-446655440000',
          prompt: 'a'.repeat(1000),
        }
        const result = movementExpansionSchema.parse(validData)
        expect(result.prompt).toBe('a'.repeat(1000))
      })

      it('should accept prompt with 1 character', () => {
        const validData = {
          movementId: '550e8400-e29b-41d4-a716-446655440000',
          prompt: 'a',
        }
        const result = movementExpansionSchema.parse(validData)
        expect(result.prompt).toBe('a')
      })
    })

    describe('type inference', () => {
      it('should have correct TypeScript type', () => {
        // This test verifies type inference works correctly
        const expansion: MovementExpansion = {
          movementId: '550e8400-e29b-41d4-a716-446655440000',
          prompt: 'Expand with more detail',
          includeContext: false,
        }

        expect(expansion.movementId).toBe('550e8400-e29b-41d4-a716-446655440000')
        expect(expansion.prompt).toBe('Expand with more detail')
        expect(expansion.includeContext).toBe(false)
      })
    })
  })
})
