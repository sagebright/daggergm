import type { Ability } from './types'

export function parseAbility(markdown: string, filename: string): Ability {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # A SOLDIER'S BOND
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Line 2-3: Blockquote with level, class/subclass, domain info
  const infoLines = lines.filter((l) => l.startsWith('>'))
  const { ability_type, level_requirement, parent_class, parent_subclass, domain } =
    parseAbilityInfo(infoLines)

  // Description: Everything after the blockquote
  const description = parseDescription(lines)

  const searchable_text = `${name} ${description}`.trim()

  const ability: Ability = {
    name,
    ability_type,
    description,
    searchable_text,
    source_book: 'Core Rules',
  }

  if (parent_class) {
    ability.parent_class = parent_class
  }
  if (parent_subclass) {
    ability.parent_subclass = parent_subclass
  }
  if (domain) {
    ability.domain = domain
  }
  if (level_requirement !== undefined) {
    ability.level_requirement = level_requirement
  }

  return ability
}

interface AbilityInfo {
  ability_type: 'Foundation' | 'Specialization' | 'Pinnacle'
  level_requirement?: number
  parent_class?: string
  parent_subclass?: string
  domain?: string
}

function parseAbilityInfo(infoLines: string[]): AbilityInfo {
  const infoText = infoLines.join(' ')

  // Parse level: "Level 2 Blade Ability" or "Foundation Ability"
  let ability_type: 'Foundation' | 'Specialization' | 'Pinnacle' = 'Foundation'
  let level_requirement: number | undefined

  if (infoText.includes('Foundation')) {
    ability_type = 'Foundation'
  } else if (infoText.includes('Specialization')) {
    ability_type = 'Specialization'
  } else if (infoText.includes('Pinnacle')) {
    ability_type = 'Pinnacle'
  }

  // Extract level: "Level 2"
  const levelMatch = infoText.match(/Level\s+(\d+)/)
  const levelStr = levelMatch?.[1]
  if (levelStr) {
    level_requirement = parseInt(levelStr, 10)
  }

  // Main classes list
  const mainClasses = [
    'Bard',
    'Druid',
    'Guardian',
    'Ranger',
    'Rogue',
    'Seraph',
    'Sorcerer',
    'Warrior',
    'Wizard',
  ]

  // Domains list
  const domains = [
    'Grace',
    'Codex',
    'Valor',
    'Sage',
    'Blade',
    'Bone',
    'Arcana',
    'Splendor',
    'Midnight',
    'Tide',
    'Instinct',
  ]

  // Extract the word before "Ability": "Level 2 Blade Ability"
  const abilityWordMatch = infoText.match(/Level\s+\d+\s+([A-Z][a-z]+)\s+Ability/)
  const abilityWord = abilityWordMatch?.[1]

  let parent_class: string | undefined
  let parent_subclass: string | undefined
  let domain: string | undefined

  if (abilityWord) {
    // Check if it's a main class
    if (mainClasses.includes(abilityWord)) {
      parent_class = abilityWord
    }
    // Check if it's a domain
    else if (domains.includes(abilityWord)) {
      domain = abilityWord
    }
    // Otherwise it's likely a subclass
    else {
      parent_subclass = abilityWord
    }
  }

  // Also check for domain keywords elsewhere in the text if not found yet
  if (!domain) {
    const domainMatch = infoText.match(
      /\b(Grace|Codex|Valor|Sage|Blade|Bone|Arcana|Splendor|Midnight|Tide|Instinct)\b/,
    )
    if (domainMatch?.[1]) {
      domain = domainMatch[1]
    }
  }

  const info: AbilityInfo = {
    ability_type,
  }

  if (level_requirement !== undefined) {
    info.level_requirement = level_requirement
  }
  if (parent_class) {
    info.parent_class = parent_class
  }
  if (parent_subclass) {
    info.parent_subclass = parent_subclass
  }
  if (domain) {
    info.domain = domain
  }

  return info
}

function parseDescription(lines: string[]): string {
  // Description is everything after the blockquote lines
  const descLines: string[] = []
  let inBlockquote = false

  for (const line of lines) {
    if (line.startsWith('>')) {
      inBlockquote = true
      continue
    }
    if (inBlockquote && !line.startsWith('#')) {
      descLines.push(line)
    }
  }

  return descLines.join(' ').trim()
}
