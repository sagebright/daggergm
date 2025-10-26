import type { Ancestry, AncestryFeature } from './types'

export function parseAncestry(markdown: string, filename: string): Ancestry {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Phase 2 learning: ALWAYS extract name from markdown header (line 1), NOT filename
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = parseAncestryDescription(lines)
  const features = parseAncestryFeatures(lines)

  return {
    name,
    description,
    features,
    source_book: 'Core Rules',
  }
}

function parseAncestryDescription(lines: string[]): string {
  const descLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##\s*ANCESTRY\s+FEATURES/i)) {
      break
    }
    if (!lines[i].startsWith('#')) {
      descLines.push(lines[i])
    }
  }
  return descLines.join(' ').trim()
}

function parseAncestryFeatures(lines: string[]): AncestryFeature[] {
  const features: AncestryFeature[] = []
  const featuresIndex = lines.findIndex((l) => l.match(/^##\s*ANCESTRY\s+FEATURES/i))
  if (featuresIndex === -1) {
    return features
  }

  for (let i = featuresIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('***') && lines[i].includes(':***')) {
      const [namePart, ...descParts] = lines[i].split(':***')
      const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()
      const desc = descParts.join(':').trim()
      features.push({ name, desc })
    }
  }

  return features
}
