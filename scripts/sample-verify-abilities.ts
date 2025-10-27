/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import path from 'path'

import { createClient } from '@supabase/supabase-js'

import { parseAbility } from './parsers/ability-parser'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)
const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

async function sampleVerify() {
  // Get all abilities
  const { data: abilities } = await s.from('daggerheart_abilities').select('*').order('name')

  if (!abilities) {
    console.error('No abilities found')
    return
  }

  // Random sample 10% (19 records)
  const sampleSize = Math.ceil(abilities.length * 0.1)
  const samples: typeof abilities = []
  const used = new Set<number>()

  while (samples.length < sampleSize) {
    const idx = Math.floor(Math.random() * abilities.length)
    if (!used.has(idx)) {
      used.add(idx)
      samples.push(abilities[idx])
    }
  }

  console.log(`Verifying ${sampleSize} random samples out of ${abilities.length} total\n`)

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
        const filePath = path.join(SRD_PATH, 'abilities', filename)
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
    const parsed = parseAbility(markdown, path.basename(sourceFile))

    // Compare fields
    const issues: string[] = []

    if (parsed.name !== dbRecord.name) {
      issues.push(`  name: "${parsed.name}" vs "${dbRecord.name}"`)
    }
    if (parsed.ability_type !== dbRecord.ability_type) {
      issues.push(`  type: "${parsed.ability_type}" vs "${dbRecord.ability_type}"`)
    }
    if (parsed.level_requirement !== dbRecord.level_requirement) {
      issues.push(`  level: ${parsed.level_requirement} vs ${dbRecord.level_requirement}`)
    }
    if ((parsed.domain || null) !== dbRecord.domain) {
      issues.push(`  domain: "${parsed.domain}" vs "${dbRecord.domain}"`)
    }
    if ((parsed.parent_class || null) !== dbRecord.parent_class) {
      issues.push(`  class: "${parsed.parent_class}" vs "${dbRecord.parent_class}"`)
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
