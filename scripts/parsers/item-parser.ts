import type { Item } from './types'

export function parseItem(markdown: string, filename: string): Item {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # AIRBLADE CHARM
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Lines 2+ until item type line
  const description = parseItemDescription(lines)

  // Last line: *Item* or *Relic* or *Charm*
  const typeMatch = lines[lines.length - 1]?.match(/\*(Item|Relic|Charm)\*/)
  const item_type = typeMatch?.[1] || 'Item'

  const searchable_text = `${name} ${description}`.trim()

  return {
    name,
    description,
    item_type,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseItemDescription(lines: string[]): string {
  const descLines: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Skip the type line (last line with *Item*)
    if (line.match(/^\*(Item|Relic|Charm)\*$/)) {
      break
    }
    if (!line.startsWith('#')) {
      descLines.push(line)
    }
  }

  return descLines.join(' ').trim()
}
