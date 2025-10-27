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

  const community: Community = {
    name,
    description,
    source_book: 'Core Rules',
  }

  if (community_moves) {
    community.community_moves = community_moves
  }

  return community
}

function parseDescription(lines: string[]): string {
  const descLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }

    if (line.match(/^##\s*COMMUNITY\s+FEATURE/i)) {
      break
    }
    if (!line.startsWith('#')) {
      descLines.push(line)
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
    const line = lines[i]
    if (!line) {
      continue
    }

    if (line.startsWith('***') && line.includes(':***')) {
      const [, ...descParts] = line.split(':***')
      const desc = descParts.join(':').trim()
      return [desc]
    }
  }

  return undefined
}
