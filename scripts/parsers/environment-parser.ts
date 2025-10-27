import type { Environment, EnvironmentFeature } from './types'

export function parseEnvironment(markdown: string, filename: string): Environment {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Phase 2 learning: ALWAYS extract name from markdown header (line 1), NOT filename
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Tier & Type: ***Tier 1 Exploration***
  const tierLine = lines.find((l) => l.match(/\*+Tier\s+\d+/))
  const { tier, type } = parseTierType(tierLine || '')

  const description = parseEnvironmentDescription(lines)
  const impulses = parseImpulses(lines)
  const statsLines = lines.filter((l) => l.startsWith('>'))
  const { difficulty, potential_adversaries } = parseEnvironmentStats(statsLines)
  const features = parseEnvironmentFeatures(lines)

  // Phase 1 learning: Include ALL relevant fields in searchable_text for semantic search
  const featuresText = features.map((f) => `${f.name} ${f.desc}`).join(' ')
  const searchable_text =
    `${name} ${description} ${impulses?.join(' ') || ''} ${featuresText}`.trim()

  const environment: Environment = {
    name,
    tier,
    type,
    description,
    features,
    searchable_text,
    source_book: 'Core Rules',
  }

  if (impulses) {
    environment.impulses = impulses
  }
  if (difficulty !== undefined) {
    environment.difficulty = difficulty
  }
  if (potential_adversaries) {
    environment.potential_adversaries = potential_adversaries
  }

  return environment
}

function parseTierType(line: string) {
  const tierMatch = line.match(/Tier\s+(\d+)/)
  const tierStr = tierMatch?.[1]
  const tier = tierStr ? parseInt(tierStr, 10) : 1

  const typeMatch = line.match(/Tier\s+\d+\s+(.+?)\*/)
  const type = typeMatch?.[1]?.trim() || 'Event'

  return { tier, type }
}

function parseImpulses(lines: string[]): string[] | undefined {
  const impulseLine = lines.find((l) => l.includes('Impulses:'))
  if (!impulseLine) {
    return undefined
  }

  const impulsesText = impulseLine.split(':')[1]?.trim()
  return impulsesText
    ?.split(',')
    .map((s) => s.trim().replace(/^\*+/, '').replace(/\*+$/, ''))
    .filter(Boolean)
}

function parseEnvironmentStats(statsLines: string[]) {
  const statsText = statsLines.join(' ')

  const difficultyMatch = statsText.match(/Difficulty:\*\*\s*(\d+)/)
  const difficulty = difficultyMatch?.[1] ? parseInt(difficultyMatch[1], 10) : undefined

  const adversariesMatch = statsText.match(/Potential Adversaries:\*\*\s*(.+?)(\||$)/)
  const adversariesText = adversariesMatch?.[1]
  const potential_adversaries = adversariesText
    ? adversariesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  return { difficulty, potential_adversaries }
}

function parseEnvironmentDescription(lines: string[]): string {
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }
    if (line.startsWith('*') && !line.startsWith('**') && !line.startsWith('***')) {
      return line.replace(/^\*/, '').replace(/\*$/, '').trim()
    }
  }
  return ''
}

function parseEnvironmentFeatures(lines: string[]): EnvironmentFeature[] {
  const features: EnvironmentFeature[] = []
  const featuresIndex = lines.findIndex((l) => l.match(/^##\s*FEATURES/i))
  if (featuresIndex === -1) {
    return features
  }

  for (let i = featuresIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }

    if (line.startsWith('***') && line.includes(' - ') && line.includes(':***')) {
      const parts = line.split(':***')
      const namePart = parts[0]
      if (!namePart) {
        continue
      }

      const nameTypeParts = namePart.split(' - ')
      const nameRaw = nameTypeParts[0]
      if (!nameRaw) {
        continue
      }

      const typeRaw = nameTypeParts[1]
      const name = nameRaw.replace(/^\*+/, '').replace(/\*+$/, '').trim()
      const type = (typeRaw?.trim() || 'Passive') as 'Passive' | 'Action' | 'GM Prompt'

      const descParts = parts.slice(1)
      let desc = descParts.join(':').trim()

      // Collect multi-line descriptions
      let j = i + 1
      while (j < lines.length) {
        const nextLine = lines[j]
        if (!nextLine || nextLine.startsWith('***') || nextLine.startsWith('##')) {
          break
        }
        desc += ' ' + nextLine
        j++
      }

      features.push({ name, type, desc: desc.trim() })
    }
  }

  return features
}
