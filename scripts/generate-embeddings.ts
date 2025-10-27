/* eslint-disable no-console */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { OpenAI } from 'openai'

// Load environment variables (use test env for remote Supabase, then .env.local for OpenAI)
config({ path: '.env.test.local' })
config({ path: '.env.local', override: false }) // Don't override Supabase vars

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function generateEmbeddings() {
  console.log('🔮 Generating vector embeddings...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Tables with embedding columns (Phase 2 learning: Only tables with searchable_text)
  const tables = [
    'daggerheart_adversaries', // ~130 entries
    'daggerheart_environments', // ~20 entries
    'daggerheart_weapons', // ~194 entries
    'daggerheart_armor', // ~36 entries
    'daggerheart_items', // ~62 entries
    'daggerheart_consumables', // ~62 entries
    'daggerheart_frames', // ~3 entries
  ]

  for (const table of tables) {
    await generateForTable(supabase, table)
  }

  console.log('\n✅ Embedding generation complete!')
  console.log('Total cost estimate: ~$0.005 for ~760 entries')
}

async function generateForTable(supabase: SupabaseClient, tableName: string) {
  console.log(`📊 Generating embeddings for ${tableName}...`)

  // Phase 2 learning: Only process rows without embeddings (idempotent)
  // Note: Using raw SQL via filter instead of .is() due to vector column type
  const { data: rows } = await supabase
    .from(tableName)
    .select('id, name, searchable_text, description')
    .filter('embedding', 'is', null)

  if (!rows || rows.length === 0) {
    console.log(`  ℹ️  No rows to process (all embeddings exist)\n`)
    return
  }

  console.log(`  Found ${rows.length} rows without embeddings`)

  let count = 0
  let errorCount = 0 // Phase 2 learning: Track errors
  const batchSize = 100 // Process in batches to avoid rate limits

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    for (const row of batch) {
      try {
        // Phase 2 learning: Use searchable_text (includes ALL relevant content)
        const textToEmbed = row.searchable_text || `${row.name} ${row.description || ''}`

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small', // 1536 dimensions
          input: textToEmbed.substring(0, 8000), // Truncate if too long
        })

        const embeddingData = response.data[0]
        if (!embeddingData) {
          console.error(`\n  ✗ No embedding returned for row ${row.id}`)
          continue
        }
        const embedding = embeddingData.embedding

        // Phase 2 learning: Use update() not upsert() for tables without unique constraints
        await supabase.from(tableName).update({ embedding }).eq('id', row.id)

        count++
        process.stdout.write(`\r  ✓ Generated ${count}/${rows.length} embeddings`)

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (err) {
        errorCount++ // Phase 2 learning: Count errors
        console.error(`\n  ❌ Failed for ${row.name}:`, err)
      }
    }
  }

  console.log(`\n  ✅ Generated ${count} embeddings for ${tableName}`)
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} errors encountered\n`)
  } else {
    console.log('')
  }
}

// ES module main check
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  generateEmbeddings()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}

export { generateEmbeddings }
