import type { Adventure, Movement } from '@/types/adventure'

export interface ExportFile {
  filename: string
  content: string | Buffer
  mimeType: string
}

export class MarkdownExporter {
  export(adventure: Adventure, movements: Movement[]): string {
    const lines: string[] = []

    // Title
    lines.push(`# ${adventure.title}`)
    lines.push('')

    // Metadata
    lines.push('## Adventure Details')
    lines.push('')
    lines.push(`**Frame:** ${this.capitalize(adventure.frame)}`)

    if (adventure.metadata) {
      if (adventure.metadata.party_size) {
        lines.push(`**Party Size:** ${adventure.metadata.party_size}`)
      }
      if (adventure.metadata.party_level && typeof adventure.metadata.party_level === 'number') {
        lines.push(`**Party Level:** ${adventure.metadata.party_level}`)
      }
      if (adventure.metadata.difficulty && typeof adventure.metadata.difficulty === 'string') {
        lines.push(`**Difficulty:** ${this.capitalize(adventure.metadata.difficulty)}`)
      }
      if (adventure.metadata.stakes && typeof adventure.metadata.stakes === 'string') {
        lines.push(`**Stakes:** ${this.capitalize(adventure.metadata.stakes)}`)
      }
      if (adventure.metadata.estimated_duration) {
        lines.push(`**Estimated Duration:** ${adventure.metadata.estimated_duration}`)
      }
    }
    lines.push('')

    // Description
    if (adventure.metadata?.description && typeof adventure.metadata.description === 'string') {
      lines.push('## Description')
      lines.push('')
      lines.push(adventure.metadata.description)
      lines.push('')
    }

    // Movements
    if (movements.length === 0) {
      lines.push('*No movements created yet*')
    } else {
      movements.forEach((movement, index) => {
        lines.push(`## Movement ${index + 1}: ${movement.title}`)
        lines.push('')

        lines.push(`**Type:** ${this.capitalize(movement.type)}`)

        if (movement.metadata?.estimated_time) {
          lines.push(`**Estimated Time:** ${movement.metadata.estimated_time}`)
        }
        lines.push('')

        // Movement content
        lines.push(movement.content)
        lines.push('')

        // GM Notes
        if (movement.metadata?.gm_notes && typeof movement.metadata.gm_notes === 'string') {
          lines.push('<details>')
          lines.push('<summary>🎭 GM Notes</summary>')
          lines.push('')
          lines.push(movement.metadata.gm_notes)
          lines.push('')
          lines.push('</details>')
          lines.push('')
        }

        // Mechanics
        if (movement.metadata?.mechanics && typeof movement.metadata.mechanics === 'object') {
          const mechanics = movement.metadata.mechanics as Record<string, unknown>
          if (mechanics.difficulty && typeof mechanics.difficulty === 'string') {
            lines.push(`**Difficulty:** ${mechanics.difficulty}`)
          }
          if (mechanics.consequences && typeof mechanics.consequences === 'string') {
            lines.push(`**Consequences:** ${mechanics.consequences}`)
          }
          lines.push('')
        }
      })
    }

    return lines.join('\n')
  }

  exportToFile(adventure: Adventure, movements: Movement[]): ExportFile {
    const content = this.export(adventure, movements)
    const filename = this.sanitizeFilename(adventure.title) + '.md'

    return {
      filename,
      content,
      mimeType: 'text/markdown',
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private sanitizeFilename(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
