import type { ExportFile } from './markdown-exporter'

import type { Adventure, Movement } from '@/types/adventure'

export class PDFExporter {
  async export(adventure: Adventure, movements: Movement[]): Promise<Buffer> {
    // For MVP, we'll create a print-friendly HTML that can be printed to PDF
    // In production, you'd use Puppeteer or similar
    const html = this.generateHTML(adventure, movements)
    return Buffer.from(html)
  }

  async exportToFile(adventure: Adventure, movements: Movement[]): Promise<ExportFile> {
    const content = await this.export(adventure, movements)
    const filename = this.sanitizeFilename(adventure.title) + '.pdf'

    return {
      filename,
      content,
      mimeType: 'application/pdf',
    }
  }

  private generateHTML(adventure: Adventure, movements: Movement[]): string {
    const style = `
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #1a1a1a;
          border-bottom: 3px solid #e5e5e5;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h2 {
          color: #2a2a2a;
          margin-top: 30px;
          page-break-after: avoid;
        }
        h3 {
          color: #3a3a3a;
          margin-top: 20px;
        }
        .metadata {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .metadata strong {
          display: inline-block;
          width: 150px;
        }
        .movement {
          page-break-inside: avoid;
          margin-bottom: 30px;
        }
        .gm-notes {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin-top: 15px;
        }
        .gm-notes h4 {
          margin-top: 0;
          color: #856404;
        }
        @media print {
          .movement {
            page-break-inside: avoid;
          }
        }
      </style>
    `

    const metadataHtml = `
      <div class="metadata">
        <strong>Frame:</strong> ${this.capitalize(adventure.frame)}<br>
        ${adventure.config?.partySize ? `<strong>Party Size:</strong> ${adventure.config.partySize}<br>` : ''}
        ${adventure.config?.partyLevel ? `<strong>Party Level:</strong> ${adventure.config.partyLevel}<br>` : ''}
        ${adventure.config?.difficulty ? `<strong>Difficulty:</strong> ${this.capitalize(adventure.config.difficulty)}<br>` : ''}
        ${adventure.config?.stakes ? `<strong>Stakes:</strong> ${this.capitalize(adventure.config.stakes)}<br>` : ''}
        ${adventure.metadata?.estimated_duration ? `<strong>Duration:</strong> ${String(adventure.metadata.estimated_duration)}` : ''}
      </div>
    `

    const movementsHtml = movements
      .map((movement, index) => {
        const contentHtml = this.markdownToHTML(movement.content)

        let gmNotesHtml = ''
        if (movement.metadata?.gm_notes) {
          gmNotesHtml = `
          <div class="gm-notes">
            <h4>🎭 GM Notes</h4>
            <p>${movement.metadata.gm_notes}</p>
          </div>
        `
        }

        let mechanicsHtml = ''
        if (movement.metadata?.mechanics && typeof movement.metadata.mechanics === 'object') {
          const mechanics = movement.metadata.mechanics as Record<string, unknown>
          mechanicsHtml = '<p>'
          if (mechanics.difficulty && typeof mechanics.difficulty === 'string') {
            mechanicsHtml += `<strong>Difficulty:</strong> ${mechanics.difficulty}<br>`
          }
          if (mechanics.consequences && typeof mechanics.consequences === 'string') {
            mechanicsHtml += `<strong>Consequences:</strong> ${mechanics.consequences}`
          }
          mechanicsHtml += '</p>'
        }

        return `
        <div class="movement">
          <h2>Movement ${index + 1}: ${movement.title}</h2>
          <p>
            <strong>Type:</strong> ${this.capitalize(movement.type)}
            ${movement.metadata?.estimated_time ? `<br><strong>Estimated Time:</strong> ${movement.metadata.estimated_time}` : ''}
          </p>
          ${contentHtml}
          ${mechanicsHtml}
          ${gmNotesHtml}
        </div>
      `
      })
      .join('\n')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${adventure.title}</title>
          ${style}
        </head>
        <body>
          <h1>${adventure.title}</h1>
          ${metadataHtml}
          ${adventure.metadata?.description && typeof adventure.metadata.description === 'string' ? `<h2>Overview</h2><p>${adventure.metadata.description}</p>` : ''}
          ${movementsHtml}
        </body>
      </html>
    `
  }

  private markdownToHTML(markdown: string): string {
    return (
      markdown
        // Headers
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        // Wrap in paragraphs
        .replace(/^(.+)$/gm, '<p>$1</p>')
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
    )
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
