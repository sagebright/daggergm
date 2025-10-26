/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)

async function verifyContent() {
  // Get all items
  const { data: items } = await s
    .from('daggerheart_items')
    .select('name, item_type, description')
    .order('name')

  console.log('Total items:', items?.length)
  console.log('')

  // Validate item_type values
  const itemTypes = new Set<string>()
  for (const item of items || []) {
    itemTypes.add(item.item_type)
  }

  console.log('Item types found:', Array.from(itemTypes).join(', '))
  console.log('')

  // Check for suspicious patterns that might indicate wrong content type
  const suspicious: string[] = []

  for (const item of items || []) {
    const desc = item.description.toLowerCase()

    // Abilities often mention specific mechanics like "make a roll", "recall cost", "level X ability"
    if (desc.includes('make a') && desc.includes('roll') && desc.includes('target')) {
      suspicious.push(`${item.name}: Looks like an Ability (has roll mechanics)`)
    }

    // Consumables often mention "drink", "vial", "eat", uses/consumption
    if (
      desc.includes('drink the contents') ||
      desc.includes('eat these') ||
      desc.includes('when you drink') ||
      desc.includes('consume this')
    ) {
      suspicious.push(`${item.name}: Looks like a Consumable`)
    }

    // Items should NOT have level requirements or recall costs
    if (desc.includes('level ') && desc.includes('ability')) {
      suspicious.push(`${item.name}: Mentions level/ability`)
    }

    if (desc.includes('recall cost')) {
      suspicious.push(`${item.name}: Has recall cost (ability trait)`)
    }
  }

  if (suspicious.length > 0) {
    console.log('⚠️  SUSPICIOUS entries found:', suspicious.length)
    suspicious.forEach((s) => console.log('  -', s))
  } else {
    console.log('✅ No suspicious entries - all look like items')
  }
}

verifyContent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
