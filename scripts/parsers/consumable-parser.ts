import type { Consumable } from './types'

export function parseConsumable(markdown: string, filename: string): Consumable {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # ACIDPASTE
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Lines 2+ until consumable type line
  const description = parseConsumableDescription(lines)

  // Uses: Default to 1 (single use), unless specified otherwise in description
  const usesMatch = description.match(/(\d+)\s+uses?/i)
  const usesStr = usesMatch?.[1]
  const uses = usesStr ? parseInt(usesStr, 10) : 1

  const searchable_text = `${name} ${description}`.trim()

  return {
    name,
    description,
    uses,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseConsumableDescription(lines: string[]): string {
  const descLines: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }

    // Skip the type line (last line with *Consumable*)
    if (line.match(/^\*Consumable\*$/)) {
      break
    }
    if (!line.startsWith('#')) {
      descLines.push(line)
    }
  }

  return descLines.join(' ').trim()
}
