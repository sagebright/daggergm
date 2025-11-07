import { describe, it, expect } from 'vitest'

import { Roll20Exporter } from '@/lib/export/roll20-exporter'
import type { Adventure, Movement } from '@/types/adventure'

describe('Roll20Exporter', () => {
  const mockAdventure: Adventure = {
    id: 'adv-123',
    title: 'The Haunted Manor',
    frame: 'gothic',
    focus: 'horror',
    state: 'draft',
    config: {
      frame: 'witherwild',
      focus: 'horror',
      partySize: 3,
      partyLevel: 2,
      difficulty: 'harder',
      stakes: 'world',
    },
    movements: [],
    metadata: {
      party_size: 3,
      party_level: 2,
      difficulty: 'harder',
      stakes: 'world',
      estimated_duration: '2 hours',
      description: 'A spooky manor investigation',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    exported_at: null,
  }

  const mockMovements: Movement[] = [
    {
      id: 'mov-1',
      title: 'Enter the Manor',
      type: 'exploration',
      content: 'The door creaks open...',
      estimatedTime: '20 minutes',
      isLocked: false,
      metadata: {
        estimated_time: '20 minutes',
        gm_notes: 'Watch for reactions',
        mechanics: {
          difficulty: '12',
          consequences: 'Trap triggers',
        },
      },
    },
  ]

  describe('export', () => {
    it('should create Roll20 handout format', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('[HANDOUT: The Haunted Manor]')
    })

    it('should include GM notes section', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('[GM NOTES]')
      expect(result).toContain('Frame: gothic')
      expect(result).toContain('[/GM NOTES]')
    })

    it('should include adventure metadata', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('Party Size: 3')
      expect(result).toContain('Party Level: 2')
      expect(result).toContain('Difficulty: harder')
      expect(result).toContain('Duration: 2 hours')
    })

    it('should format movements as scenes', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('[SCENE 1: Enter the Manor]')
      expect(result).toContain('Type: exploration')
      expect(result).toContain('Time: 20 minutes')
    })

    it('should include movement GM notes', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('[GM ONLY]')
      expect(result).toContain('Watch for reactions')
      expect(result).toContain('[/GM ONLY]')
    })

    it('should include mechanics information', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('DC: 12')
      expect(result).toContain('Consequences: Trap triggers')
    })

    it('should convert markdown to plain text', () => {
      const exporter = new Roll20Exporter()
      const movementWithMarkdown: Movement = {
        id: 'mov-2',
        title: 'Test',
        type: 'combat',
        content: '**Bold text** and *italic* with [link](http://example.com)',
        estimatedTime: '30 minutes',
        isLocked: false,
      }

      const result = exporter.export(mockAdventure, [movementWithMarkdown])

      expect(result).toContain('Bold text')
      expect(result).toContain('italic')
      expect(result).toContain('link')
      // Check markdown is removed from content (but Roll20 tags remain)
      const sceneMatch = result.match(/\[SCENE 2: Test\]([\s\S]*?)$/m)
      if (sceneMatch) {
        const sceneContent = sceneMatch[1]
        expect(sceneContent).not.toContain('**')
        expect(sceneContent).not.toContain('[link]')
      }
    })
  })

  describe('exportToFile', () => {
    it('should return file with correct format', () => {
      const exporter = new Roll20Exporter()
      const result = exporter.exportToFile(mockAdventure, mockMovements)

      expect(result.filename).toBe('the-haunted-manor-roll20.txt')
      expect(result.mimeType).toBe('text/plain')
      expect(result.content).toContain('[HANDOUT: The Haunted Manor]')
    })

    it('should sanitize filename', () => {
      const exporter = new Roll20Exporter()
      const adventureWithSpecialChars = {
        ...mockAdventure,
        title: 'Test!@#$%Adventure',
      }
      const result = exporter.exportToFile(adventureWithSpecialChars, [])

      expect(result.filename).toBe('test-adventure-roll20.txt')
    })
  })
})
