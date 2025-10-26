/* eslint-disable no-console */
import { readdir } from 'fs/promises'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)

async function verify() {
  // Get all DB records
  const { data: dbRecords } = await s.from('daggerheart_items').select('name').order('name')

  // Get all source files
  const files = await readdir('/Users/jmfk/Repos/daggergm_backup/daggerheart-srd/items')
  const sourceNames = files
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace('.md', '').toUpperCase())

  console.log('DB Records:', dbRecords?.length)
  console.log('Source Files:', sourceNames.length)
  console.log('')

  // Check for hallucinations (DB records not in source)
  const hallucinations: string[] = []
  for (const record of dbRecords || []) {
    const found = sourceNames.includes(record.name)
    if (!found) {
      hallucinations.push(record.name)
    }
  }

  if (hallucinations.length > 0) {
    console.log('❌ HALLUCINATIONS FOUND:', hallucinations.length)
    hallucinations.forEach((h) => console.log('  -', h))
  } else {
    console.log('✅ No hallucinations - all DB records exist in source')
  }

  // Check for missing entries (source files not in DB)
  const missing: string[] = []
  const dbNames = (dbRecords || []).map((r) => r.name)
  for (const sourceName of sourceNames) {
    if (!dbNames.includes(sourceName)) {
      missing.push(sourceName)
    }
  }

  console.log('')
  console.log('Missing from DB:', missing.length)
  if (missing.length > 0) {
    missing.forEach((m) => console.log('  -', m))
  }
}

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
