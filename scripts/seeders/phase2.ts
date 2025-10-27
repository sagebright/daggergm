/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import path from 'path'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { glob } from 'glob'

import { parseAbility } from '../parsers/ability-parser'
import { parseConsumable } from '../parsers/consumable-parser'
import { parseItem } from '../parsers/item-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

export async function seedPhase2() {
  console.log('🌱 Starting Phase 2 seeding (Abilities, Items, Consumables)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  await seedAbilities(supabase)
  await seedItems(supabase)
  await seedConsumables(supabase)

  console.log('\n✅ Phase 2 seeding complete!')
}

async function seedAbilities(supabase: SupabaseClient) {
  console.log('📦 Seeding abilities...')

  // Clear existing abilities first
  await supabase
    .from('daggerheart_abilities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  const files = await glob(`${SRD_PATH}/abilities/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const ability = parseAbility(markdown, path.basename(file))

    const { error } = await supabase.from('daggerheart_abilities').insert(ability)

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} abilities`)
    } else {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${ability.name}:`, error.message)
    }
  }

  console.log(`\n  ✅ Seeded ${count} abilities`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} failed`)
  }
  console.log('')
}

async function seedItems(supabase: SupabaseClient) {
  console.log('📦 Seeding items...')
  const files = await glob(`${SRD_PATH}/items/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const item = parseItem(markdown, path.basename(file))

    const { error } = await supabase.from('daggerheart_items').upsert(item, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} items`)
    } else {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${item.name}:`, error.message)
    }
  }

  console.log(`\n  ✅ Seeded ${count} items`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} failed`)
  }
  console.log('')
}

async function seedConsumables(supabase: SupabaseClient) {
  console.log('📦 Seeding consumables...')
  const files = await glob(`${SRD_PATH}/consumables/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const consumable = parseConsumable(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_consumables')
      .upsert(consumable, { onConflict: 'name' })

    if (!error) {
      count++
      process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} consumables`)
    } else {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${consumable.name}:`, error.message)
    }
  }

  console.log(`\n  ✅ Seeded ${count} consumables`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} failed`)
  }
  console.log('')
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedPhase2()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
