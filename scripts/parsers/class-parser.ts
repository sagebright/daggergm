import type { Class, ClassFeature } from './types'

export function parseClass(markdown: string, filename: string): Class {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Line 1: # BARD
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Everything before stats blockquote
  const description = parseDescription(lines)

  // Stats blockquote: > **• DOMAINS:** ...
  const statsLines = lines.filter((l) => l.startsWith('>'))
  const stats = parseClassStats(statsLines)

  // Hope feature: ## BARD'S HOPE FEATURE
  const hope_feature = parseHopeFeature(lines)

  // Class feature: ## CLASS FEATURE
  const class_feature = parseClassFeature(lines)

  // Background questions
  const background_questions = parseQuestions(lines, 'BACKGROUND QUESTIONS')

  // Connection questions
  const connection_questions = parseQuestions(lines, 'CONNECTIONS')

  return {
    name,
    description,
    ...stats,
    hope_feature,
    class_feature,
    background_questions,
    connection_questions,
    source_book: 'Core Rules',
  }
}

function parseClassStats(statsLines: string[]) {
  const statsText = statsLines.join(' ')

  // Extract domains: [Grace](link) & [Codex](link)
  const domainMatches = Array.from(statsText.matchAll(/\[([^\]]+)\]/g))
  const domains = domainMatches.map((m) => m[1])

  const starting_evasion = parseInt(
    statsText.match(/STARTING EVASION:\*\*\s*(\d+)/)?.[1] || '10',
    10,
  )

  const starting_hp = parseInt(statsText.match(/STARTING HIT POINTS:\*\*\s*(\d+)/)?.[1] || '5', 10)

  // Class items: comma-separated list after "CLASS ITEMS:**"
  const itemsMatch = statsText.match(/CLASS ITEMS:\*\*\s*(.+?)(\||$)/)
  const class_items = itemsMatch
    ? itemsMatch[1]
        .split(/,|or/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  return { domains, starting_evasion, starting_hp, class_items }
}

function parseHopeFeature(lines: string[]): ClassFeature | undefined {
  const hopeIndex = lines.findIndex((l) => l.match(/##\s*.*HOPE\s+FEATURE/i))
  if (hopeIndex === -1) {
    return undefined
  }

  // Next line should have feature format: ***Make a Scene:*** description
  let i = hopeIndex + 1
  while (i < lines.length && !lines[i].startsWith('***')) {
    i++
  }

  if (i >= lines.length) {
    return undefined
  }

  const featureLine = lines[i]
  const [namePart, ...descParts] = featureLine.split(':***')
  const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()

  // Check if there's a cost: "Spend 3 Hope"
  const descText = descParts.join(':').trim()
  const costMatch = descText.match(/Spend\s+(\d+)\s+Hope/i)
  const cost = costMatch ? parseInt(costMatch[1], 10) : undefined

  return { name, desc: descText, cost }
}

function parseClassFeature(lines: string[]): ClassFeature | undefined {
  const featureIndex = lines.findIndex((l) => l.match(/##\s*CLASS\s+FEATURE/i))
  if (featureIndex === -1) {
    return undefined
  }

  let i = featureIndex + 1
  while (i < lines.length && !lines[i].startsWith('***')) {
    i++
  }

  if (i >= lines.length) {
    return undefined
  }

  const featureLine = lines[i]
  const [namePart, ...descParts] = featureLine.split(':***')
  const name = namePart.replace(/^\*+/, '').replace(/\*+$/, '').trim()
  const desc = descParts.join(':').trim()

  return { name, desc }
}

function parseQuestions(lines: string[], sectionName: string): string[] | undefined {
  const sectionIndex = lines.findIndex((l) => l.includes(sectionName))
  if (sectionIndex === -1) {
    return undefined
  }

  const questions: string[] = []
  let i = sectionIndex + 1

  while (i < lines.length && !lines[i].startsWith('##')) {
    const line = lines[i]
    if (line.startsWith('-')) {
      questions.push(line.replace(/^-\s*/, '').trim())
    }
    i++
  }

  return questions.length > 0 ? questions : undefined
}

function parseDescription(lines: string[]): string {
  // Description is everything from line 2 until first blockquote (>)
  let desc = ''
  let i = 1 // Skip name line

  while (i < lines.length && !lines[i].startsWith('>')) {
    if (!lines[i].startsWith('#')) {
      desc += lines[i] + ' '
    }
    i++
  }

  return desc.trim()
}
