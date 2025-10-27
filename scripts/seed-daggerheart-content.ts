/* eslint-disable no-console */
import { config } from 'dotenv'

import { seedAdversaries } from './seed-adversaries-mvp'
import { seedPhase1 } from './seeders/phase1'
import { seedPhase2 } from './seeders/phase2'
import { seedPhase3 } from './seeders/phase3'

// Load environment variables (use test env for remote Supabase)
config({ path: '.env.test.local' })

async function seedAllContent() {
  console.log('🌱 Starting Daggerheart Content Database seeding...\n')
  console.log('This will seed ~760 entries across 13 tables\n')

  const startTime = Date.now()

  try {
    // Phase 0: Adversaries (from MVP script)
    console.log('=== PHASE 0: Adversaries (~130 entries) ===\n')
    await seedAdversaries()

    // Phase 1: Weapons, Classes, Armor (~241 entries)
    console.log('\n=== PHASE 1: Weapons, Classes, Armor (~241 entries) ===\n')
    await seedPhase1()

    // Phase 2: Abilities, Items, Consumables (~315 entries)
    console.log('\n=== PHASE 2: Abilities, Items, Consumables (~315 entries) ===\n')
    await seedPhase2()

    // Phase 3: Remaining 6 types (~85 entries)
    console.log('\n=== PHASE 3: Final 6 content types (~85 entries) ===\n')
    await seedPhase3()

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('✅ SEEDING COMPLETE!')
    console.log('='.repeat(60))
    console.log(`Time elapsed: ${elapsed}s`)
    console.log('Total entries: ~760 across 13 tables')
    console.log('\nNext steps:')
    console.log('1. Generate embeddings: npm run embeddings:generate')
    console.log('2. Regenerate types: npm run db:types')
    console.log('3. Run tests: npm test')
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    throw error
  }
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  seedAllContent()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export { seedAllContent }
