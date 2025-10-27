import type { Subclass, SubclassFeature } from './types'

export function parseSubclass(markdown: string, filename: string): Subclass {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Phase 2 learning: ALWAYS extract name from markdown header (line 1), NOT filename
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Infer parent class from known mappings
  const parent_class = inferParentClass(name)

  const description = parseSubclassDescription(lines)
  const features = parseSubclassFeatures(lines)

  return {
    name,
    parent_class,
    description,
    features,
    source_book: 'Core Rules',
  }
}

function inferParentClass(subclassName: string): string {
  const mappings: Record<string, string> = {
    // Bard subclasses
    TROUBADOUR: 'Bard',
    WORDSMITH: 'Bard',

    // Druid subclasses
    'WARDEN OF RENEWAL': 'Druid',
    'WARDEN OF THE ELEMENTS': 'Druid',

    // Guardian subclasses
    VENGEANCE: 'Guardian',
    STALWART: 'Guardian',

    // Ranger subclasses
    BEASTBOUND: 'Ranger',
    SHARPSHOOTER: 'Ranger',
    WAYFINDER: 'Ranger',

    // Rogue subclasses
    SHADOW: 'Rogue',
    SYNDICATE: 'Rogue',
    NIGHTWALKER: 'Rogue',

    // Seraph subclasses
    'DIVINE VOICE': 'Seraph',
    'DIVINE WIELDER': 'Seraph',
    HERALD: 'Seraph',
    'WINGED SENTINEL': 'Seraph',

    // Sorcerer subclasses
    'ELEMENTAL ORIGIN': 'Sorcerer',
    'PRIMAL ORIGIN': 'Sorcerer',

    // Warrior subclasses
    BLADESTORM: 'Warrior',
    BULWARK: 'Warrior',
    'CALL OF THE BRAVE': 'Warrior',
    'CALL OF THE SLAYER': 'Warrior',

    // Wizard subclasses
    'SCHOOL OF BATTLE': 'Wizard',
    'SCHOOL OF KNOWLEDGE': 'Wizard',
    'SCHOOL OF WAR': 'Wizard',
  }

  return mappings[subclassName.toUpperCase()] || 'Unknown'
}

function parseSubclassDescription(lines: string[]): string {
  const descLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }
    if (line.startsWith('##')) {
      break
    }
    if (!line.startsWith('#')) {
      descLines.push(line)
    }
  }
  return descLines.join(' ').trim()
}

function parseSubclassFeatures(lines: string[]): SubclassFeature[] {
  const features: SubclassFeature[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }

    if (line.startsWith('***') && line.includes(':***')) {
      const parts = line.split(':***')
      const namePart = parts[0]
      if (!namePart) {
        continue
      }

      const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()
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

      features.push({ name, desc: desc.trim() })
    }
  }

  return features
}
