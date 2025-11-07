import { describe, it, expect, vi, beforeEach } from 'vitest'

import { PDFExporter } from '@/lib/export/pdf-exporter'
import type { Adventure, Movement } from '@/types/adventure'

describe('PDFExporter', () => {
  const mockAdventure: Adventure = {
    id: 'adv-123',
    title: 'The Lost Mine',
    frame: 'grimdark',
    focus: 'grimdark',
    state: 'draft',
    config: {
      frame: 'witherwild',
      focus: 'grimdark',
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
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    exported_at: null,
  }

  const mockMovements: Movement[] = [
    {
      id: 'mov-1',
      title: 'The Abandoned Entrance',
      type: 'exploration',
      content: '## Description\n\nThe mine entrance yawns before you...',
      estimatedTime: '30 minutes',
      isLocked: false,
      metadata: {
        gm_notes: 'Hidden trap at entrance',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('export', () => {
    it('should generate HTML buffer from adventure', async () => {
      const exporter = new PDFExporter()
      const result = await exporter.export(mockAdventure, mockMovements)

      expect(result).toBeInstanceOf(Buffer)
      const html = result.toString()
      expect(html).toContain('<h1>The Lost Mine</h1>')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should include styled HTML content', async () => {
      const exporter = new PDFExporter()
      const result = await exporter.export(mockAdventure, mockMovements)

      const htmlContent = result.toString()
      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<style>')
      expect(htmlContent).toContain('font-family:')
      expect(htmlContent).toContain('<h1>The Lost Mine</h1>')
      expect(htmlContent).toContain('<h2>Movement 1: The Abandoned Entrance</h2>')
    })

    it('should properly format metadata', async () => {
      const exporter = new PDFExporter()
      const result = await exporter.export(mockAdventure, mockMovements)

      const htmlContent = result.toString()
      expect(htmlContent).toContain('<strong>Frame:</strong> Grimdark')
      expect(htmlContent).toContain('<strong>Party Size:</strong> 4')
      expect(htmlContent).toContain('<strong>Party Level:</strong> 3')
      expect(htmlContent).toContain('<strong>Difficulty:</strong> Standard')
    })

    it('should handle markdown conversion in content', async () => {
      const exporter = new PDFExporter()
      const result = await exporter.export(mockAdventure, mockMovements)

      const htmlContent = result.toString()
      expect(htmlContent).toContain('<h2>Description</h2>')
      expect(htmlContent).toContain('<p>The mine entrance yawns before you...</p>')
    })

    it('should include GM notes in styled box', async () => {
      const exporter = new PDFExporter()
      const result = await exporter.export(mockAdventure, mockMovements)

      const htmlContent = result.toString()
      expect(htmlContent).toContain('class="gm-notes"')
      expect(htmlContent).toContain('🎭 GM Notes')
      expect(htmlContent).toContain('Hidden trap at entrance')
    })
  })

  describe('exportToFile', () => {
    it('should return PDF file with proper metadata', async () => {
      const exporter = new PDFExporter()
      const file = await exporter.exportToFile(mockAdventure, mockMovements)

      expect(file.filename).toBe('the-lost-mine.pdf')
      expect(file.content).toBeInstanceOf(Buffer)
      expect(file.mimeType).toBe('application/pdf')
    })

    it('should sanitize filename', async () => {
      const adventureWithSpecialChars = {
        ...mockAdventure,
        title: 'The Lost Mine: Chapter 1/2',
      }

      const exporter = new PDFExporter()
      const file = await exporter.exportToFile(adventureWithSpecialChars, mockMovements)

      expect(file.filename).toBe('the-lost-mine-chapter-1-2.pdf')
    })
  })
})
