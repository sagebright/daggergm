/**
 * Unit Tests: RegenerationLimitError and Constants
 *
 * Tests the error class and constants without any database interaction.
 * These are pure unit tests that should run very fast.
 */

import { describe, it, expect } from 'vitest'

import {
  RegenerationLimitError,
  SCAFFOLD_REGENERATION_LIMIT,
  EXPANSION_REGENERATION_LIMIT,
} from '@/lib/regeneration/limit-checker'

describe('RegenerationLimitError', () => {
  it('should create error with correct properties for scaffold', () => {
    const error = new RegenerationLimitError('scaffold', 10, SCAFFOLD_REGENERATION_LIMIT)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RegenerationLimitError)
    expect(error.name).toBe('RegenerationLimitError')
    expect(error.limitType).toBe('scaffold')
    expect(error.used).toBe(10)
    expect(error.limit).toBe(SCAFFOLD_REGENERATION_LIMIT)
    expect(error.message).toContain('scaffold')
    expect(error.message).toContain('10')
    expect(error.message).toContain(`${SCAFFOLD_REGENERATION_LIMIT}`)
  })

  it('should create error with correct properties for expansion', () => {
    const error = new RegenerationLimitError('expansion', 20, EXPANSION_REGENERATION_LIMIT)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RegenerationLimitError)
    expect(error.name).toBe('RegenerationLimitError')
    expect(error.limitType).toBe('expansion')
    expect(error.used).toBe(20)
    expect(error.limit).toBe(EXPANSION_REGENERATION_LIMIT)
    expect(error.message).toContain('expansion')
    expect(error.message).toContain('20')
    expect(error.message).toContain(`${EXPANSION_REGENERATION_LIMIT}`)
  })

  it('should have correct message format', () => {
    const error = new RegenerationLimitError('scaffold', 5, 10)

    expect(error.message).toBe('scaffold regeneration limit exceeded: 5/10 used')
  })

  it('should be catchable as Error', () => {
    try {
      throw new RegenerationLimitError('scaffold', 10, SCAFFOLD_REGENERATION_LIMIT)
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(RegenerationLimitError)
    }
  })
})

describe('Constants', () => {
  it('should have correct scaffold limit', () => {
    expect(SCAFFOLD_REGENERATION_LIMIT).toBe(10)
  })

  it('should have correct expansion limit', () => {
    expect(EXPANSION_REGENERATION_LIMIT).toBe(20)
  })

  it('should have scaffold limit less than expansion limit', () => {
    // Business logic: scaffold is less complex than expansion
    expect(SCAFFOLD_REGENERATION_LIMIT).toBeLessThan(EXPANSION_REGENERATION_LIMIT)
  })

  it('should have limits greater than zero', () => {
    expect(SCAFFOLD_REGENERATION_LIMIT).toBeGreaterThan(0)
    expect(EXPANSION_REGENERATION_LIMIT).toBeGreaterThan(0)
  })
})
