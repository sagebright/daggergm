/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import path from 'path'

import { createClient } from '@supabase/supabase-js'

import { parseItem } from './parsers/item-parser'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)
const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

async function sampleVerify() {
  // Get all items
  const { data: items } = await s.from('daggerheart_items').select('*').order('name')

  if (!items) {
    console.error('No items found')
    return
  }

  // Random sample 10% (6 records)
  const sampleSize = Math.ceil(items.length * 0.1)
  const samples: typeof items = []
  const used = new Set<number>()

  while (samples.length < sampleSize) {
    const idx = Math.floor(Math.random() * items.length)
    if (!used.has(idx)) {
      used.add(idx)
      samples.push(items[idx])
    }
  }

  console.log(`Verifying ${sampleSize} random samples out of ${items.length} total\n`)

  let mismatches = 0

  for (const dbRecord of samples) {
    // Try to find the source file
    const possibleNames = [
      dbRecord.name,
      dbRecord.name.replace(/'/g, ''),
      dbRecord.name.replace(/[']/g, "'"),
    ]

    let sourceFile: string | null = null
    for (const name of possibleNames) {
      try {
        const filename = `${name.charAt(0)}${name.slice(1).toLowerCase().replace(/\s+/g, ' ')}.md`
        const filePath = path.join(SRD_PATH, 'items', filename)
        await readFile(filePath, 'utf-8')
        sourceFile = filePath
        break
      } catch {
        // Try next variant
      }
    }

    if (!sourceFile) {
      console.log(`❌ ${dbRecord.name}: Source file not found`)
      mismatches++
      continue
    }

    // Parse source and compare
    const markdown = await readFile(sourceFile, 'utf-8')
    const parsed = parseItem(markdown, path.basename(sourceFile))

    // Compare fields
    const issues: string[] = []

    if (parsed.name !== dbRecord.name) {
      issues.push(`  name: "${parsed.name}" vs "${dbRecord.name}"`)
    }
    if (parsed.item_type !== dbRecord.item_type) {
      issues.push(`  type: "${parsed.item_type}" vs "${dbRecord.item_type}"`)
    }
    if (parsed.description !== dbRecord.description) {
      issues.push(`  description mismatch`)
      issues.push(`    parsed: "${parsed.description.substring(0, 50)}..."`)
      issues.push(`    db:     "${dbRecord.description.substring(0, 50)}..."`)
    }

    if (issues.length > 0) {
      console.log(`❌ ${dbRecord.name}:`)
      issues.forEach((i) => console.log(i))
      mismatches++
    } else {
      console.log(`✓ ${dbRecord.name}`)
    }
  }

  console.log(
    `\n${mismatches === 0 ? '✅' : '❌'} ${sampleSize - mismatches}/${sampleSize} samples verified correctly`,
  )
  if (mismatches > 0) {
    console.log(`⚠️  ${mismatches} mismatches found`)
  }
}

sampleVerify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
