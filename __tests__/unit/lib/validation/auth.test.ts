import { describe, it, expect } from 'vitest'

import { emailSchema, magicLinkSchema, guestSessionSchema } from '@/lib/validation/auth'

describe('Auth Validation', () => {
  describe('emailSchema', () => {
    it('accepts valid email addresses', () => {
      const validEmails = ['user@example.com', 'test.user@example.com', 'user+tag@example.co.uk']

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = ['not-an-email', '@example.com', 'user@', 'user@.com', '']

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('magicLinkSchema', () => {
    it('accepts valid magic link input', () => {
      const validInput = { email: 'user@example.com' }
      expect(() => magicLinkSchema.parse(validInput)).not.toThrow()
    })

    it('rejects invalid magic link input', () => {
      const invalidInput = { email: 'not-an-email' }
      expect(() => magicLinkSchema.parse(invalidInput)).toThrow()
    })
  })

  describe('guestSessionSchema', () => {
    it('accepts valid guest session', () => {
      const validSession = {
        email: 'guest@example.com',
        adventureId: '550e8400-e29b-41d4-a716-446655440000',
        guestToken: '550e8400-e29b-41d4-a716-446655440001',
      }
      expect(() => guestSessionSchema.parse(validSession)).not.toThrow()
    })

    it('rejects invalid UUIDs', () => {
      const invalidSession = {
        email: 'guest@example.com',
        adventureId: 'not-a-uuid',
        guestToken: '550e8400-e29b-41d4-a716-446655440001',
      }
      expect(() => guestSessionSchema.parse(invalidSession)).toThrow()
    })
  })
})
