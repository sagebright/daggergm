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

  const frame: Frame = {
    name,
    description,
    source_book: 'Core Rules',
  }

  if (themes) {
    frame.themes = themes
  }
  if (typical_adversaries) {
    frame.typical_adversaries = typical_adversaries
  }
  if (lore) {
    frame.lore = lore
  }

  return frame
}

function parseFrameDescription(lines: string[]): string {
  // Second line usually has the description in italics
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line && line.startsWith('***') && line.endsWith('***')) {
      return line.replace(/^\*+/, '').replace(/\*+$/, '').trim()
    }
  }
  return ''
}

function parseFrameThemes(lines: string[]): string[] | null {
  const themeLine = lines.find((l) => l.includes('THEMES'))
  if (!themeLine) {
    return null
  }

  // Find the line after "## THEMES"
  const themeIndex = lines.findIndex((l) => l.includes('THEMES'))
  if (themeIndex === -1 || themeIndex + 1 >= lines.length) {
    return null
  }

  const themeText = lines[themeIndex + 1]
  if (!themeText) {
    return null
  }

  return themeText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseTypicalAdversaries(_lines: string[]): string[] | null {
  // In frames, adversaries might be mentioned in various places
  // This is a placeholder for now
  return null
}

function parseFrameLore(lines: string[]): string | null {
  // The OVERVIEW section contains lore
  const overviewIndex = lines.findIndex((l) => l.match(/^##\s*OVERVIEW/i))
  if (overviewIndex === -1) {
    return null
  }

  const loreLines: string[] = []
  for (let i = overviewIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }
    if (line.startsWith('##')) {
      break
    }
    if (!line.startsWith('#')) {
      loreLines.push(line)
    }
  }

  const result = loreLines.join(' ').trim()
  return result || null
}
