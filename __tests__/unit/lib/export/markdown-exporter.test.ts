import { describe, it, expect } from 'vitest'

import { MarkdownExporter } from '@/lib/export/markdown-exporter'
import type { Adventure, Movement } from '@/types/adventure'

describe('MarkdownExporter', () => {
  const mockAdventure: Adventure = {
    id: 'adv-123',
    title: 'The Lost Mine',
    frame: 'grimdark',
    focus: 'mystery',
    state: 'draft',
    config: {
      frame: 'witherwild',
      focus: 'mystery',
      partySize: 4,
      partyLevel: 3,
      difficulty: 'standard',
      stakes: 'high',
    },
    movements: [],
    metadata: {
      party_size: 4,
      party_level: 3,
      difficulty: 'standard',
      stakes: 'high',
      estimated_duration: '4 hours',
      description: 'A thrilling adventure in abandoned mines',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    exported_at: null,
  }

  const mockMovements: Movement[] = [
    {
      id: 'mov-1',
      title: 'The Abandoned Entrance',
      type: 'exploration' as const,
      content: '## Description\n\nThe mine entrance yawns before you...',
      estimatedTime: '30 minutes',
      isLocked: false,
      metadata: {
        estimated_time: '30 minutes',
        gm_notes: 'Hidden trap at entrance',
      },
    },
    {
      id: 'mov-2',
      title: 'Cave-in!',
      type: 'social' as const,
      content: '## Challenge\n\nThe ceiling begins to crumble...',
      estimatedTime: '45 minutes',
      isLocked: false,
      metadata: {
        estimated_time: '45 minutes',
        mechanics: {
          difficulty: '15',
          consequences: 'Trapped inside if failed',
        },
      },
    },
  ]

  describe('export', () => {
    it('should export adventure with metadata header', () => {
      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('# The Lost Mine')
      expect(result).toContain('**Frame:** Grimdark')
      expect(result).toContain('**Party Size:** 4')
      expect(result).toContain('**Party Level:** 3')
      expect(result).toContain('**Difficulty:** Standard')
      expect(result).toContain('**Estimated Duration:** 4 hours')
    })

    it('should include adventure description', () => {
      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('## Description')
      expect(result).toContain('A thrilling adventure in abandoned mines')
    })

    it('should export all movements in order', () => {
      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('## Movement 1: The Abandoned Entrance')
      expect(result).toContain('**Type:** Exploration')
      expect(result).toContain('**Estimated Time:** 30 minutes')
      expect(result).toContain('The mine entrance yawns before you...')

      expect(result).toContain('## Movement 2: Cave-in!')
      expect(result).toContain('**Type:** Social')
      expect(result).toContain('**Estimated Time:** 45 minutes')
      expect(result).toContain('The ceiling begins to crumble...')
    })

    it('should include GM notes in a collapsible section', () => {
      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('<details>')
      expect(result).toContain('<summary>🎭 GM Notes</summary>')
      expect(result).toContain('Hidden trap at entrance')
      expect(result).toContain('</details>')
    })

    it('should format movement mechanics properly', () => {
      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, mockMovements)

      expect(result).toContain('**Difficulty:** 15')
      expect(result).toContain('**Consequences:** Trapped inside if failed')
    })

    it('should handle empty movements array', () => {
      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, [])

      expect(result).toContain('# The Lost Mine')
      expect(result).toContain('*No movements created yet*')
    })

    it('should escape special markdown characters in content', () => {
      const movementWithSpecialChars: Movement = {
        ...mockMovements[0]!,
        content: 'This has *asterisks* and _underscores_ and [brackets]',
      }

      const exporter = new MarkdownExporter()
      const result = exporter.export(mockAdventure, [movementWithSpecialChars])

      expect(result).toContain('This has *asterisks* and _underscores_ and [brackets]')
    })
  })

  describe('exportToFile', () => {
    it('should return markdown content with proper filename', () => {
      const exporter = new MarkdownExporter()
      const file = exporter.exportToFile(mockAdventure, mockMovements)

      expect(file.filename).toBe('the-lost-mine.md')
      expect(file.content).toContain('# The Lost Mine')
      expect(file.mimeType).toBe('text/markdown')
    })

    it('should sanitize filename', () => {
      const adventureWithSpecialChars = {
        ...mockAdventure,
        title: 'The Lost Mine: Chapter 1/2',
      }

      const exporter = new MarkdownExporter()
      const file = exporter.exportToFile(adventureWithSpecialChars, mockMovements)

      expect(file.filename).toBe('the-lost-mine-chapter-1-2.md')
    })
  })
})
