import type { Weapon } from './types'

export function parseWeapon(markdown: string, filename: string): Weapon {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # ADVANCED BATTLEAXE
  const name = parseName(lines[0], filename)

  // Line 2: **Trait:** Strength; **Range:** Melee; **Damage:** d10+9 phy; **Burden:** Two-Handed
  const statsLine = lines.find((l) => l.includes('Trait:'))
  const stats = parseWeaponStats(statsLine || '')

  // Line 3: **Feature:** —
  const featureLine = lines.find((l) => l.includes('Feature:'))
  const feature = featureLine?.split(':')[1]?.trim() || null

  // Line 4: *Primary Weapon - Tier 3*
  const categoryTierLine = lines.find((l) =>
    l.match(/\*(Primary|Secondary)\s+Weapon\s+-\s+Tier\s+\d+\*/),
  )
  const { weapon_category, tier } = parseCategoryTier(categoryTierLine)

  const searchable_text = `${name} ${stats.trait} ${stats.damage} ${feature || ''}`.trim()

  return {
    name,
    weapon_category,
    tier,
    ...stats,
    feature: feature === '—' ? null : feature,
    searchable_text,
    source_book: 'Core Rules',
  }
}

function parseWeaponStats(line: string) {
  // Parse: **Trait:** Strength; **Range:** Melee; **Damage:** d10+9 phy; **Burden:** Two-Handed
  const traitMatch = line.match(/Trait:\*\*\s*([^;]+)/)
  const trait = traitMatch?.[1]?.trim() || 'Strength'

  const rangeMatch = line.match(/Range:\*\*\s*([^;]+)/)
  const range = rangeMatch?.[1]?.trim() || 'Melee'

  const damageMatch = line.match(/Damage:\*\*\s*([^;]+)/)
  const damage = damageMatch?.[1]?.trim() || '1 phy'

  const burdenMatch = line.match(/Burden:\*\*\s*([^;\n]+)/)
  const burden = burdenMatch?.[1]?.trim() || null

  return { trait, range, damage, burden }
}

function parseCategoryTier(line: string | undefined) {
  // Parse: *Primary Weapon - Tier 3*
  if (!line) {
    return { weapon_category: 'Primary' as const, tier: 1 }
  }

  const categoryMatch = line.match(/\*(Primary|Secondary)/)
  const weapon_category = (categoryMatch?.[1] || 'Primary') as 'Primary' | 'Secondary'

  const tierMatch = line.match(/Tier\s+(\d+)/)
  const tierStr = tierMatch?.[1]
  const tier = tierStr ? parseInt(tierStr, 10) : 1

  return { weapon_category, tier }
}

function parseName(firstLine: string | undefined, filename: string): string {
  if (firstLine && firstLine.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '').trim()
  }
  return filename.replace(/\.md$/i, '').replace(/_/g, ' ').toUpperCase()
}
