import type { Community } from './types'

export function parseCommunity(markdown: string, filename: string): Community {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Phase 2 learning: ALWAYS extract name from markdown header (line 1), NOT filename
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = parseDescription(lines)
  const community_moves = parseCommunityMoves(lines)

  return {
    name,
    description,
    community_moves,
    source_book: 'Core Rules',
  }
}

function parseDescription(lines: string[]): string {
  const descLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##\s*COMMUNITY\s+FEATURE/i)) {
      break
    }
    if (!lines[i].startsWith('#')) {
      descLines.push(lines[i])
    }
  }
  return descLines.join(' ').trim()
}

function parseCommunityMoves(lines: string[]): string[] | undefined {
  const movesIndex = lines.findIndex((l) => l.match(/COMMUNITY\s+FEATURE/i))
  if (movesIndex === -1) {
    return undefined
  }

  // In the Highborne example, the feature is a single paragraph starting with ***
  // Look for the feature description after the COMMUNITY FEATURE heading
  for (let i = movesIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('***') && lines[i].includes(':***')) {
      const [, ...descParts] = lines[i].split(':***')
      const desc = descParts.join(':').trim()
      return [desc]
    }
  }

  return undefined
}
