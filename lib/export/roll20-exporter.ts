import type { Adventure, Movement } from '@/types/adventure'
import type { ExportFile } from './markdown-exporter'

export class Roll20Exporter {
  export(adventure: Adventure, movements: Movement[]): string {
    const lines: string[] = []

    // Roll20 handout format
    lines.push(`[HANDOUT: ${adventure.title}]`)
    lines.push('')

    // Adventure metadata as GM notes
    lines.push('[GM NOTES]')
    lines.push(`Frame: ${adventure.frame}`)
    if (adventure.metadata) {
      lines.push(`Party Size: ${adventure.metadata.party_size || 'N/A'}`)
      lines.push(`Party Level: ${adventure.metadata.party_level || 'N/A'}`)
      lines.push(`Difficulty: ${adventure.metadata.difficulty || 'N/A'}`)
      lines.push(`Stakes: ${adventure.metadata.stakes || 'N/A'}`)
      lines.push(`Duration: ${adventure.metadata.estimated_duration || 'N/A'}`)
    }
    lines.push('[/GM NOTES]')
    lines.push('')

    // Description
    if (adventure.metadata?.description && typeof adventure.metadata.description === 'string') {
      lines.push(adventure.metadata.description)
      lines.push('')
    }

    // Movements as scenes
    movements.forEach((movement, index) => {
      lines.push(`[SCENE ${index + 1}: ${movement.title}]`)
      lines.push(`Type: ${movement.type}`)
      if (movement.metadata?.estimated_time) {
        lines.push(`Time: ${movement.metadata.estimated_time}`)
      }
      lines.push('')

      // Convert markdown content to plain text for Roll20
      const plainContent = this.markdownToPlainText(movement.content)
      lines.push(plainContent)
      lines.push('')

      // GM notes for the scene
      if (movement.metadata?.gm_notes || movement.metadata?.mechanics) {
        lines.push('[GM ONLY]')
        if (movement.metadata.gm_notes && typeof movement.metadata.gm_notes === 'string') {
          lines.push(movement.metadata.gm_notes)
        }
        if (movement.metadata.mechanics && typeof movement.metadata.mechanics === 'object') {
          const mechanics = movement.metadata.mechanics as Record<string, unknown>
          if (mechanics.difficulty && typeof mechanics.difficulty === 'string') {
            lines.push(`DC: ${mechanics.difficulty}`)
          }
          if (mechanics.consequences && typeof mechanics.consequences === 'string') {
            lines.push(`Consequences: ${mechanics.consequences}`)
          }
        }
        lines.push('[/GM ONLY]')
        lines.push('')
      }
    })

    return lines.join('\n')
  }

  exportToFile(adventure: Adventure, movements: Movement[]): ExportFile {
    const content = this.export(adventure, movements)
    const filename = this.sanitizeFilename(adventure.title) + '-roll20.txt'

    return {
      filename,
      content,
      mimeType: 'text/plain',
    }
  }

  private markdownToPlainText(markdown: string): string {
    return (
      markdown
        // Remove headers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove bold/italic
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
        .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
        // Remove links
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove code blocks
        .replace(/```[^`]*```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    )
  }

  private sanitizeFilename(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
