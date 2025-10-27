/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import path from 'path'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { glob } from 'glob'

import { parseAncestry } from '../parsers/ancestry-parser'
import { parseCommunity } from '../parsers/community-parser'
import { parseDomain } from '../parsers/domain-parser'
import { parseEnvironment } from '../parsers/environment-parser'
import { parseFrame } from '../parsers/frame-parser'
import { parseSubclass } from '../parsers/subclass-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

export async function seedPhase3() {
  console.log('🌱 Starting Phase 3 seeding (Final 6 types)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  await seedAncestries(supabase)
  await seedSubclasses(supabase)
  await seedEnvironments(supabase)
  await seedDomains(supabase)
  await seedCommunities(supabase)
  await seedFrames(supabase)

  console.log('\n✅ Phase 3 seeding complete! All 13 content types done.')
}

async function seedAncestries(supabase: SupabaseClient) {
  console.log('📦 Seeding ancestries...')
  const files = await glob(`${SRD_PATH}/ancestries/*.md`)
  let count = 0
  let errorCount = 0 // Phase 2 learning: Track errors

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const ancestry = parseAncestry(markdown, path.basename(file))

    // Phase 2 learning: Check if table has unique constraint before using upsert
    const { error } = await supabase
      .from('daggerheart_ancestries')
      .upsert(ancestry, { onConflict: 'name' })

    if (error) {
      errorCount++ // Phase 2 learning: Count errors
      console.error(`\n  ❌ Failed to seed ${ancestry.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} ancestries`)
  }

  console.log(`\n  ✅ Seeded ${count} ancestries`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

async function seedSubclasses(supabase: SupabaseClient) {
  console.log('📦 Seeding subclasses...')
  const files = await glob(`${SRD_PATH}/subclasses/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const subclass = parseSubclass(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_subclasses')
      .upsert(subclass, { onConflict: 'name' })

    if (error) {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${subclass.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} subclasses`)
  }

  console.log(`\n  ✅ Seeded ${count} subclasses`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

async function seedEnvironments(supabase: SupabaseClient) {
  console.log('📦 Seeding environments...')
  const files = await glob(`${SRD_PATH}/environments/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const environment = parseEnvironment(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_environments')
      .upsert(environment, { onConflict: 'name' })

    if (error) {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${environment.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} environments`)
  }

  console.log(`\n  ✅ Seeded ${count} environments`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

async function seedDomains(supabase: SupabaseClient) {
  console.log('📦 Seeding domains...')
  const files = await glob(`${SRD_PATH}/domains/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const domain = parseDomain(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_domains')
      .upsert(domain, { onConflict: 'name' })

    if (error) {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${domain.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} domains`)
  }

  console.log(`\n  ✅ Seeded ${count} domains`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

async function seedCommunities(supabase: SupabaseClient) {
  console.log('📦 Seeding communities...')
  const files = await glob(`${SRD_PATH}/communities/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const community = parseCommunity(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_communities')
      .upsert(community, { onConflict: 'name' })

    if (error) {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${community.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} communities`)
  }

  console.log(`\n  ✅ Seeded ${count} communities`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

async function seedFrames(supabase: SupabaseClient) {
  console.log('📦 Seeding frames...')
  const files = await glob(`${SRD_PATH}/frames/*.md`)
  let count = 0
  let errorCount = 0

  for (const file of files) {
    const markdown = await readFile(file, 'utf-8')
    const frame = parseFrame(markdown, path.basename(file))

    const { error } = await supabase
      .from('daggerheart_frames')
      .upsert(frame, { onConflict: 'name' })

    if (error) {
      errorCount++
      console.error(`\n  ❌ Failed to seed ${frame.name}:`, error.message)
    } else {
      count++
    }
    process.stdout.write(`\r  ✓ Seeded ${count}/${files.length} frames`)
  }

  console.log(`\n  ✅ Seeded ${count} frames`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedPhase3()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
