import { describe, it, expect } from 'vitest'

import {
  adventureConfigSchema,
  creditPurchaseSchema,
  movementUpdateSchema,
  exportRequestSchema,
  emailSchema,
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  describe('adventureConfigSchema', () => {
    it('should validate valid adventure config', () => {
      const validConfig = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        party_size: 4,
        party_level: 3,
        difficulty: 'standard',
        stakes: 'personal',
      }

      const result = adventureConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validConfig)
      }
    })

    it('should reject invalid party size', () => {
      const invalidConfig = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        party_size: 10, // Max is 8
        party_level: 3,
        difficulty: 'standard',
        stakes: 'personal',
      }

      const result = adventureConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues![0]!.message).toContain('must be 8 or less')
      }
    })

    it('should reject invalid difficulty', () => {
      const invalidConfig = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        party_size: 4,
        party_level: 3,
        difficulty: 'impossible', // Invalid enum value
        stakes: 'personal',
      }

      const result = adventureConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    it('should provide default values', () => {
      const minimalConfig = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
      }

      const result = adventureConfigSchema.safeParse(minimalConfig)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data!.party_size).toBe(4)
        expect(result.data!.party_level).toBe(1)
        expect(result.data!.difficulty).toBe('standard')
        expect(result.data!.stakes).toBe('personal')
      }
    })

    it('should accept guest email', () => {
      const configWithEmail = {
        length: 'oneshot',
        primary_motif: 'high_fantasy',
        guestEmail: 'test@example.com',
      }

      const result = adventureConfigSchema.safeParse(configWithEmail)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data!.guestEmail).toBe('test@example.com')
      }
    })
  })

  describe('creditPurchaseSchema', () => {
    it('should validate valid credit purchase', () => {
      const validPurchase = {
        packageId: 'credits_5',
        amount: 5,
        price: 500,
      }

      const result = creditPurchaseSchema.safeParse(validPurchase)
      expect(result.success).toBe(true)
    })

    it('should reject invalid package ID', () => {
      const invalidPurchase = {
        packageId: 'invalid-package',
        amount: 5,
        price: 500,
      }

      const result = creditPurchaseSchema.safeParse(invalidPurchase)
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const invalidPurchase = {
        packageId: 'credits_5',
        amount: -5,
        price: 500,
      }

      const result = creditPurchaseSchema.safeParse(invalidPurchase)
      expect(result.success).toBe(false)
    })
  })

  describe('movementUpdateSchema', () => {
    it('should validate movement update', () => {
      const validUpdate = {
        title: 'Updated Movement',
        content: 'New content for the movement',
        metadata: {
          gm_notes: 'Secret notes',
          estimated_time: '45 minutes',
        },
      }

      const result = movementUpdateSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates', () => {
      const partialUpdate = {
        content: 'Just updating the content',
      }

      const result = movementUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data!.content).toBe('Just updating the content')
        expect(result.data!.title).toBeUndefined()
      }
    })

    it('should reject empty title', () => {
      const invalidUpdate = {
        title: '',
        content: 'Content',
      }

      const result = movementUpdateSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('exportRequestSchema', () => {
    it('should validate export request', () => {
      const validRequest = {
        adventureId: '123e4567-e89b-12d3-a456-426614174000',
        format: 'pdf',
      }

      const result = exportRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid format', () => {
      const invalidRequest = {
        adventureId: '123e4567-e89b-12d3-a456-426614174000',
        format: 'docx', // Not supported
      }

      const result = exportRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const invalidRequest = {
        adventureId: 'not-a-uuid',
        format: 'pdf',
      }

      const result = exportRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('emailSchema', () => {
    it('should validate valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'firstname.lastname@company.org',
      ]

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..double@example.com',
        'test@example',
      ]

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(false)
      })
    })
  })
})
