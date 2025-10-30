import { describe, it, expect } from 'vitest'

import { getQuickPrompts, QUICK_PROMPTS } from '@/lib/llm/quick-prompts'

describe('getQuickPrompts', () => {
  describe('scaffold phase', () => {
    it('returns scaffold prompts for combat movements', () => {
      const prompts = getQuickPrompts('scaffold', 'combat')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Make enemy intelligent and strategic')
      expect(prompts).toContain('Make stakes feel higher')
      expect(prompts).not.toContain('Include specific DC checks') // expansion prompt
    })

    it('returns scaffold prompts for social movements', () => {
      const prompts = getQuickPrompts('scaffold', 'social')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Add political intrigue')
      expect(prompts).toContain('Make NPC morally gray')
      expect(prompts).toContain('Make stakes feel higher')
      expect(prompts).not.toContain('Add dialogue examples') // expansion prompt
    })

    it('returns scaffold prompts for exploration movements', () => {
      const prompts = getQuickPrompts('scaffold', 'exploration')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Change to dungeon crawl')
      expect(prompts).toContain('Add discovery/mystery')
      expect(prompts).toContain('Make stakes feel higher')
      expect(prompts).not.toContain('Describe environmental hazards') // expansion prompt
    })

    it('returns scaffold prompts for puzzle movements', () => {
      const prompts = getQuickPrompts('scaffold', 'puzzle')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Add logical deduction element')
      expect(prompts).toContain('Include multiple solution paths')
      expect(prompts).toContain('Make stakes feel higher')
      expect(prompts).not.toContain('Add specific clues') // expansion prompt
    })

    it('combines 3 type-specific and 2 general prompts', () => {
      const prompts = getQuickPrompts('scaffold', 'combat')

      expect(prompts).toHaveLength(5)

      // First 3 should be combat-specific
      const combatSpecific = QUICK_PROMPTS.scaffold.combat.slice(0, 3)
      expect(prompts.slice(0, 3)).toEqual(combatSpecific)

      // Last 2 should be general
      const general = QUICK_PROMPTS.scaffold.general.slice(0, 2)
      expect(prompts.slice(3, 5)).toEqual(general)
    })
  })

  describe('expansion phase', () => {
    it('returns expansion prompts for combat movements', () => {
      const prompts = getQuickPrompts('expansion', 'combat')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Include specific DC checks')
      expect(prompts).toContain('Add tactical terrain features')
      expect(prompts).toContain('Add more sensory details')
      expect(prompts).not.toContain('Make enemy intelligent and strategic') // scaffold prompt
    })

    it('returns expansion prompts for social movements', () => {
      const prompts = getQuickPrompts('expansion', 'social')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Add dialogue examples')
      expect(prompts).toContain('Include NPC motivations')
      expect(prompts).toContain('Add more sensory details')
      expect(prompts).not.toContain('Add political intrigue') // scaffold prompt
    })

    it('returns expansion prompts for exploration movements', () => {
      const prompts = getQuickPrompts('expansion', 'exploration')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Describe environmental hazards')
      expect(prompts).toContain('Add hidden discoveries')
      expect(prompts).toContain('Add more sensory details')
      expect(prompts).not.toContain('Change to dungeon crawl') // scaffold prompt
    })

    it('returns expansion prompts for puzzle movements', () => {
      const prompts = getQuickPrompts('expansion', 'puzzle')

      expect(prompts).toHaveLength(5)
      expect(prompts).toContain('Add specific clues')
      expect(prompts).toContain('Include failure consequences')
      expect(prompts).toContain('Add more sensory details')
      expect(prompts).not.toContain('Add logical deduction element') // scaffold prompt
    })

    it('combines 3 type-specific and 2 general prompts', () => {
      const prompts = getQuickPrompts('expansion', 'social')

      expect(prompts).toHaveLength(5)

      // First 3 should be social-specific
      const socialSpecific = QUICK_PROMPTS.expansion.social.slice(0, 3)
      expect(prompts.slice(0, 3)).toEqual(socialSpecific)

      // Last 2 should be general
      const general = QUICK_PROMPTS.expansion.general.slice(0, 2)
      expect(prompts.slice(3, 5)).toEqual(general)
    })
  })

  describe('QUICK_PROMPTS configuration', () => {
    it('has all required movement types for scaffold phase', () => {
      expect(QUICK_PROMPTS.scaffold).toHaveProperty('general')
      expect(QUICK_PROMPTS.scaffold).toHaveProperty('combat')
      expect(QUICK_PROMPTS.scaffold).toHaveProperty('social')
      expect(QUICK_PROMPTS.scaffold).toHaveProperty('exploration')
      expect(QUICK_PROMPTS.scaffold).toHaveProperty('puzzle')
    })

    it('has all required movement types for expansion phase', () => {
      expect(QUICK_PROMPTS.expansion).toHaveProperty('general')
      expect(QUICK_PROMPTS.expansion).toHaveProperty('combat')
      expect(QUICK_PROMPTS.expansion).toHaveProperty('social')
      expect(QUICK_PROMPTS.expansion).toHaveProperty('exploration')
      expect(QUICK_PROMPTS.expansion).toHaveProperty('puzzle')
    })

    it('has at least 5 prompts for each category', () => {
      // Scaffold
      expect(QUICK_PROMPTS.scaffold.general.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.scaffold.combat.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.scaffold.social.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.scaffold.exploration.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.scaffold.puzzle.length).toBeGreaterThanOrEqual(5)

      // Expansion
      expect(QUICK_PROMPTS.expansion.general.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.expansion.combat.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.expansion.social.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.expansion.exploration.length).toBeGreaterThanOrEqual(5)
      expect(QUICK_PROMPTS.expansion.puzzle.length).toBeGreaterThanOrEqual(5)
    })

    it('has unique prompts (no duplicates within a category)', () => {
      const checkUnique = (prompts: string[]) => {
        const uniqueSet = new Set(prompts)
        expect(uniqueSet.size).toBe(prompts.length)
      }

      // Scaffold
      checkUnique(QUICK_PROMPTS.scaffold.general)
      checkUnique(QUICK_PROMPTS.scaffold.combat)
      checkUnique(QUICK_PROMPTS.scaffold.social)
      checkUnique(QUICK_PROMPTS.scaffold.exploration)
      checkUnique(QUICK_PROMPTS.scaffold.puzzle)

      // Expansion
      checkUnique(QUICK_PROMPTS.expansion.general)
      checkUnique(QUICK_PROMPTS.expansion.combat)
      checkUnique(QUICK_PROMPTS.expansion.social)
      checkUnique(QUICK_PROMPTS.expansion.exploration)
      checkUnique(QUICK_PROMPTS.expansion.puzzle)
    })
  })
})
