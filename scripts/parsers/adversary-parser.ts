/**
 * Parser for Daggerheart SRD Adversary markdown files
 * Parses ~130 adversary files from daggerheart-srd/adversaries/
 */

import type { Adversary, AdversaryFeature } from './types'

/**
 * Parse a Daggerheart adversary markdown file
 * @param markdown - Raw markdown content
 * @param filename - Original filename (used as fallback for name)
 * @returns Parsed adversary object
 */
export function parseAdversary(markdown: string, filename: string): Adversary {
  // Remove BOM and normalize line endings
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # ACID BURROWER
  const name = parseName(lines[0], filename)

  // Line 2: ***Tier 1 Solo***
  const { tier, type } = parseTierAndType(lines[1] || '')

  // Line 3: *Description*
  const description = parseDescription(lines[2] || '')

  // Line 4: **Motives & Tactics:** ...
  const motives_tactics = parseMotivesTactics(lines[3] || '')

  // Stats blockquote: > **Difficulty:** 14 | **Thresholds:** 8/15 | ...
  const statsLines = lines.filter((l) => l.startsWith('>'))
  const stats = parseStats(statsLines)

  // Features section (after "## FEATURES")
  const features = parseFeatures(lines)

  // Build searchable text for full-text search
  const searchable_text = buildSearchableText(name, description, motives_tactics, features)

  return {
    name,
    tier,
    type,
    description,
    motives_tactics,
    ...stats,
    features,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseName(firstLine: string, filename: string): string {
  if (firstLine && firstLine.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '').trim()
  }
  // Fallback to filename
  return filename.replace(/\.md$/i, '').replace(/_/g, ' ').toUpperCase()
}

function parseTierAndType(line: string): { tier: number; type: string } {
  // Format: ***Tier 1 Solo***
  const match = line.match(/\*+Tier\s+(\d+)\s+(.+?)\*+/)
  const tier = match ? parseInt(match[1], 10) : 1
  const type = match ? match[2].trim() : 'Standard'
  return { tier, type }
}

function parseDescription(line: string): string {
  // Format: *A horse-sized insect with digging claws and acidic blood.*
  return line.replace(/^\*+/, '').replace(/\*+$/, '').trim()
}

function parseMotivesTactics(line: string): string[] {
  // Format: **Motives & Tactics:** Burrow, drag away, feed, reposition
  if (!line.includes('Motives')) {
    return []
  }

  const content = line.split(':')[1]
  if (!content) {
    return []
  }

  return content
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

interface AdversaryStats {
  difficulty: number
  thresholds: string
  hp: number
  stress: number
  atk: string
  weapon: string
  range: string
  dmg: string
  experiences?: Record<string, number>
}

function parseStats(statsLines: string[]): AdversaryStats {
  // Join all stats lines (may span multiple lines)
  const statsText = statsLines.join(' ').replace(/^>\s*/g, '')

  // Parse individual stats
  const difficulty = parseInt(statsText.match(/Difficulty:\*\*\s*(\d+)/)?.[1] || '10', 10)

  const thresholdsMatch = statsText.match(/Thresholds:\*\*\s*([^|]+)/)?.[1]?.trim()
  const thresholds = thresholdsMatch || 'None'

  const hp = parseInt(statsText.match(/HP:\*\*\s*(\d+)/)?.[1] || '1', 10)

  const stress = parseInt(statsText.match(/Stress:\*\*\s*(\d+)/)?.[1] || '1', 10)

  const atk = statsText.match(/ATK:\*\*\s*([^|]+)/)?.[1]?.trim() || '+0'

  // Weapon and range: **Claws:** Very Close | or **ATK:** +3 | **Weapon Name:** Range |
  const weaponMatch = statsText.match(
    /\*\*([A-Za-z\s]+):\*\*\s*(Melee|Very\s+Close|Close|Far|Very\s+Far)/i,
  )
  const weapon = weaponMatch?.[1]?.trim() || 'Weapon'
  const range = weaponMatch?.[2] || 'Melee'

  // Damage: 1d12+2 phy or 3d20 phy
  const dmgMatch = statsText.match(/([\dd+-]+\s+\w+)/)
  const dmg = dmgMatch?.[1] || '1 phy'

  // Experience: **Experience:** Tremor Sense +2
  const expMatch = statsText.match(/Experience:\*\*\s*(.+?)(|$)/)?.[1]?.trim()
  const experiences = expMatch ? parseExperiences(expMatch) : undefined

  return {
    difficulty,
    thresholds,
    hp,
    stress,
    atk,
    weapon,
    range,
    dmg,
    experiences,
  }
}

function parseExperiences(expString: string): Record<string, number> {
  const experiences: Record<string, number> = {}

  // Parse: "Tremor Sense +2" or "Tremor Sense +2, Commander +3"
  const parts = expString.split(',')
  for (const part of parts) {
    const match = part.trim().match(/^(.+?)\s+\+(\d+)$/)
    if (match) {
      experiences[match[1].trim()] = parseInt(match[2], 10)
    }
  }

  return experiences
}

function parseFeatures(lines: string[]): AdversaryFeature[] {
  const features: AdversaryFeature[] = []

  // Find "## FEATURES" section
  const featureStartIndex = lines.findIndex((l) => l.match(/^##\s*FEATURES/i))
  if (featureStartIndex === -1) {
    return features
  }

  let i = featureStartIndex + 1
  while (i < lines.length) {
    const line = lines[i]

    // Stop at next major section (###, ##)
    if (line.match(/^##/)) {
      break
    }

    // Feature format: ***Relentless (3) - Passive:*** description
    if (line.startsWith('***') && line.includes(':***')) {
      const feature = parseFeature(lines, i)
      if (feature) {
        features.push(feature)
        // Skip lines that were part of this feature
        i += feature._lineCount || 1
        continue
      }
    }

    i++
  }

  return features
}

function parseFeature(
  lines: string[],
  startIndex: number,
): (AdversaryFeature & { _lineCount?: number }) | null {
  const line = lines[startIndex]

  // Format: ***Relentless (3) - Passive:*** description
  const [namePart, ...descParts] = line.split(':***')
  if (!namePart) {
    return null
  }

  const nameTypeCleaned = namePart.replace(/^\*+/, '').replace(/\*+$/, '')

  // Extract type: "Relentless (3) - Passive" -> type = "Passive"
  const typeMatch = nameTypeCleaned.match(/\s-\s(Passive|Action|Reaction)/)
  const type = (typeMatch?.[1] || 'Passive') as 'Passive' | 'Action' | 'Reaction'

  const name = nameTypeCleaned.replace(/\s-\s(Passive|Action|Reaction)/, '').trim()

  // Collect description (may span multiple lines)
  let desc = descParts.join(':').trim()
  let lineCount = 1
  let j = startIndex + 1

  // Continue reading until we hit another feature or section
  while (
    j < lines.length &&
    lines[j] &&
    !lines[j].startsWith('***') &&
    !lines[j].startsWith('##')
  ) {
    desc += ' ' + lines[j]
    lineCount++
    j++
  }

  return {
    name,
    type,
    desc: desc.trim(),
    _lineCount: lineCount,
  }
}

function buildSearchableText(
  name: string,
  description: string,
  motives_tactics: string[],
  features: AdversaryFeature[],
): string {
  const parts = [
    name,
    description,
    ...motives_tactics,
    ...features.map((f) => `${f.name} ${f.desc}`),
  ]
  return parts.join(' ')
}
