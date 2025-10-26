import type { Frame } from './types'

export function parseFrame(markdown: string, filename: string): Frame {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Phase 2 learning: ALWAYS extract name from markdown header (line 1), NOT filename
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')
  const description = parseFrameDescription(lines)
  const themes = parseFrameThemes(lines)
  const typical_adversaries = parseTypicalAdversaries(lines)
  const lore = parseFrameLore(lines)

  return {
    name,
    description,
    themes,
    typical_adversaries,
    lore,
    source_book: 'Core Rules',
  }
}

function parseFrameDescription(lines: string[]): string {
  // Second line usually has the description in italics
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('***') && lines[i].endsWith('***')) {
      return lines[i].replace(/^\*+/, '').replace(/\*+$/, '').trim()
    }
  }
  return ''
}

function parseFrameThemes(lines: string[]): string[] | undefined {
  const themeLine = lines.find((l) => l.includes('THEMES'))
  if (!themeLine) {
    return undefined
  }

  // Find the line after "## THEMES"
  const themeIndex = lines.findIndex((l) => l.includes('THEMES'))
  if (themeIndex === -1 || themeIndex + 1 >= lines.length) {
    return undefined
  }

  const themeText = lines[themeIndex + 1]
  return themeText
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseTypicalAdversaries(_lines: string[]): string[] | undefined {
  // In frames, adversaries might be mentioned in various places
  // This is a placeholder for now
  return undefined
}

function parseFrameLore(lines: string[]): string | undefined {
  // The OVERVIEW section contains lore
  const overviewIndex = lines.findIndex((l) => l.match(/^##\s*OVERVIEW/i))
  if (overviewIndex === -1) {
    return undefined
  }

  const loreLines: string[] = []
  for (let i = overviewIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('##')) {
      break
    }
    if (!lines[i].startsWith('#')) {
      loreLines.push(lines[i])
    }
  }

  return loreLines.join(' ').trim() || undefined
}
