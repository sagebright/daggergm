import { describe, it, expect } from 'vitest'

import { REGENERATION_LIMITS, REGENERATION_LIMIT_ERRORS } from '@/lib/constants/regeneration'

describe('Regeneration Constants', () => {
  describe('REGENERATION_LIMITS', () => {
    it('should have correct scaffold limit', () => {
      expect(REGENERATION_LIMITS.SCAFFOLD).toBe(10)
    })

    it('should have correct expansion limit', () => {
      expect(REGENERATION_LIMITS.EXPANSION).toBe(20)
    })

    it('should be read-only (const assertion)', () => {
      // TypeScript enforces readonly at compile time with 'as const'
      expect(REGENERATION_LIMITS).toBeDefined()
      expect(typeof REGENERATION_LIMITS.SCAFFOLD).toBe('number')
      expect(typeof REGENERATION_LIMITS.EXPANSION).toBe('number')
    })
  })

  describe('REGENERATION_LIMIT_ERRORS', () => {
    it('should include scaffold limit in scaffold error message', () => {
      expect(REGENERATION_LIMIT_ERRORS.SCAFFOLD).toContain('10')
      expect(REGENERATION_LIMIT_ERRORS.SCAFFOLD).toContain('Scaffold regeneration limit reached')
    })

    it('should include expansion limit in expansion error message', () => {
      expect(REGENERATION_LIMIT_ERRORS.EXPANSION).toContain('20')
      expect(REGENERATION_LIMIT_ERRORS.EXPANSION).toContain('Expansion regeneration limit reached')
    })

    it('should include expansion limit in refinement error message', () => {
      expect(REGENERATION_LIMIT_ERRORS.REFINEMENT).toContain('20')
      expect(REGENERATION_LIMIT_ERRORS.REFINEMENT).toContain('Refinement limit reached')
    })

    it('should be read-only (const assertion)', () => {
      // TypeScript enforces readonly at compile time with 'as const'
      expect(REGENERATION_LIMIT_ERRORS).toBeDefined()
      expect(typeof REGENERATION_LIMIT_ERRORS.SCAFFOLD).toBe('string')
      expect(typeof REGENERATION_LIMIT_ERRORS.EXPANSION).toBe('string')
      expect(typeof REGENERATION_LIMIT_ERRORS.REFINEMENT).toBe('string')
    })

    it('should provide helpful guidance in error messages', () => {
      expect(REGENERATION_LIMIT_ERRORS.SCAFFOLD).toContain('starting a new adventure')
      expect(REGENERATION_LIMIT_ERRORS.EXPANSION).toContain('locking components')
      expect(REGENERATION_LIMIT_ERRORS.REFINEMENT).toContain('manual editing')
    })
  })
})
