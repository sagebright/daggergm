import type { Domain } from './types'

export function parseDomain(markdown: string, filename: string): Domain {
  const cleaned = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Phase 2 learning: ALWAYS extract name from markdown header (line 1), NOT filename
  const name = lines[0]?.replace(/^#+\s*/, '').trim() || filename.replace(/\.md$/i, '')

  // Description: Everything after the title, up to first ## heading
  const description = lines
    .slice(1)
    .filter((l) => !l.startsWith('#'))
    .join(' ')
    .trim()

  return {
    name,
    description,
    source_book: 'Core Rules',
  }
}
