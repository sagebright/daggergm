/* eslint-disable no-console */
// Seeding script - console.log is intentional for progress tracking

import { readFile } from 'fs/promises'
import path from 'path'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { glob } from 'glob'

import { parseArmor } from '../parsers/armor-parser'
import { parseClass } from '../parsers/class-parser'
import { parseWeapon } from '../parsers/weapon-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

export async function seedPhase1() {
  console.log('🌱 Starting Phase 1 seeding (Weapons, Classes, Armor)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  await seedWeapons(supabase)
  await seedClasses(supabase)
  await seedArmor(supabase)

  console.log('\n✅ Phase 1 seeding complete!')
}

async function seedWeapons(supabase: SupabaseClient) {
  console.log('📦 Seeding weapons...')
  const files = await glob(`${SRD_PATH}/weapons/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const weapon = parseWeapon(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_weapons')
      .upsert(weapon, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} weapons`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} weapons\n`)
}

async function seedClasses(supabase: SupabaseClient) {
  console.log('📦 Seeding classes...')
  const files = await glob(`${SRD_PATH}/classes/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const classData = parseClass(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_classes')
      .upsert(classData, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} classes`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} classes\n`)
}

async function seedArmor(supabase: SupabaseClient) {
  console.log('📦 Seeding armor...')
  const files = await glob(`${SRD_PATH}/armor/*.md`)
  let count = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const armor = parseArmor(markdown, path.basename(file))

    const { error } = await supabase.from('daggerheart_armor').upsert(armor, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} armor`)
    }
  }

  console.log(`\n  ✅ Seeded ${count} armor pieces\n`)
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedPhase1()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
