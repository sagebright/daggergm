import type { Armor } from './types'

export function parseArmor(markdown: string, filename: string): Armor {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # LEATHER ARMOR
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Line 2: **Base Thresholds:** 13/31
  const thresholdsLine = lines.find((l) => l.includes('Base Thresholds:'))
  const base_thresholds = thresholdsLine?.match(/:\*\*\s*([^\n]+)/)?.[1]?.trim() || '10/20'

  // Line 3: **Base Armor Score:** 2
  const scoreLine = lines.find((l) => l.includes('Base Armor Score:'))
  const base_score = parseInt(scoreLine?.match(/:\*\*\s*(\d+)/)?.[1] || '0', 10)

  // Line 4: **Feature:** —
  const featureLine = lines.find((l) => l.includes('Feature:'))
  const feature = featureLine?.split(':')[1]?.trim() || null

  // Line 5: *Tier 1*
  const tierLine = lines.find((l) => l.match(/\*Tier\s+\d+\*/))
  const tier = parseInt(tierLine?.match(/Tier\s+(\d+)/)?.[1] || '1', 10)

  const searchable_text = `${name} ${base_thresholds} ${feature || ''}`.trim()

  return {
    name,
    tier,
    base_thresholds,
    base_score,
    feature: feature === '—' ? null : feature,
    searchable_text,
    source_book: 'Core Rules',
  }
}
