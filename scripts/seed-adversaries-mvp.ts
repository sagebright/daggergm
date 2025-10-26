/**
 * MVP Seeding Script: Adversaries Only
 * Seeds ~130 adversaries from SRD to prove parsing and seeding approach works
 * Full script will need 12 more parsers for the other content types
 */

import { readFile } from 'fs/promises'
import path from 'path'

import { createClient } from '@supabase/supabase-js'
import { glob } from 'glob'

import { parseAdversary } from './parsers/adversary-parser'

const SRD_PATH = '/Users/jmfk/Repos/daggergm_backup/daggerheart-srd'

async function seedAdversaries() {
  console.log('🌱 Starting Adversaries seeding (MVP)...\n')

  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('📦 Seeding adversaries...')

  const files = await glob(`${SRD_PATH}/adversaries/*.md`)
  console.log(`   Found ${files.length} adversary files\n`)

  let successCount = 0
  let errorCount = 0

  for (const file of files) {
    try {
      const markdown = await readFile(file, 'utf-8')
      const filename = path.basename(file)
      const adversary = parseAdversary(markdown, filename)

      // Upsert (idempotent - safe to re-run)
      const { error } = await supabase
        .from('daggerheart_adversaries')
        .upsert(adversary, { onConflict: 'name' })

      if (error) {
        console.error(`  ❌ Failed to seed ${filename}:`, error.message)
        errorCount++
      } else {
        successCount++
        // Progress indicator
        process.stdout.write(`\r  ✓ Seeded ${successCount}/${files.length} adversaries`)
      }
    } catch (err) {
      console.error(`\n  ❌ Error parsing ${path.basename(file)}:`, err)
      errorCount++
    }
  }

  console.log(`\n\n✅ Seeding complete!`)
  console.log(`   Success: ${successCount}`)
  console.log(`   Errors: ${errorCount}`)

  return { successCount, errorCount }
}

export { seedAdversaries }

// Run if called directly (ES module check)
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedAdversaries()
    .then(({ errorCount }) => {
      process.exit(errorCount > 0 ? 1 : 0)
    })
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
