/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import path from 'path'

import { createClient } from '@supabase/supabase-js'

import { parseConsumable } from './parsers/consumable-parser'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)
const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

async function sampleVerify() {
  // Get all consumables
  const { data: consumables } = await s.from('daggerheart_consumables').select('*').order('name')

  if (!consumables) {
    console.error('No consumables found')
    return
  }

  // Random sample 10% (6 records)
  const sampleSize = Math.ceil(consumables.length * 0.1)
  const samples: typeof consumables = []
  const used = new Set<number>()

  while (samples.length < sampleSize) {
    const idx = Math.floor(Math.random() * consumables.length)
    if (!used.has(idx)) {
      used.add(idx)
      samples.push(consumables[idx])
    }
  }

  console.log(`Verifying ${sampleSize} random samples out of ${consumables.length} total\n`)

  let mismatches = 0

  for (const dbRecord of samples) {
    // Try to find the source file - handle apostrophes
    const possibleNames = [
      dbRecord.name,
      dbRecord.name.replace(/'/g, ''), // Remove curly apostrophe
      dbRecord.name.replace(/[']/g, "'"), // Replace with straight
      dbRecord.name.replace(/['']/g, ''), // Remove all apostrophes
    ]

    let sourceFile: string | null = null
    for (const name of possibleNames) {
      try {
        // Convert to title case for filename
        const words = name.split(' ')
        const titleCase = words
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
        const filename = `${titleCase}.md`
        const filePath = path.join(SRD_PATH, 'consumables', filename)
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
    const parsed = parseConsumable(markdown, path.basename(sourceFile))

    // Compare fields
    const issues: string[] = []

    if (parsed.name !== dbRecord.name) {
      issues.push(`  name: "${parsed.name}" vs "${dbRecord.name}"`)
    }
    if (parsed.uses !== dbRecord.uses) {
      issues.push(`  uses: ${parsed.uses} vs ${dbRecord.uses}`)
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
