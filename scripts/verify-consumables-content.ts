/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)

async function verifyContent() {
  // Get all consumables
  const { data: consumables } = await s
    .from('daggerheart_consumables')
    .select('name, uses, description')
    .order('name')

  console.log('Total consumables:', consumables?.length)
  console.log('')

  // Check uses distribution
  const usesDistribution = new Map<number, number>()
  for (const consumable of consumables || []) {
    const count = usesDistribution.get(consumable.uses) || 0
    usesDistribution.set(consumable.uses, count + 1)
  }

  console.log('Uses distribution:')
  Array.from(usesDistribution.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([uses, count]) => {
      console.log(`  ${uses} use(s): ${count} items`)
    })
  console.log('')

  // Check for suspicious patterns that might indicate wrong content type
  const suspicious: string[] = []

  for (const consumable of consumables || []) {
    const desc = consumable.description.toLowerCase()

    // Items often mention "attach", "carry", "equip" and are permanent
    if (
      desc.includes('you can attach') ||
      desc.includes('attach this') ||
      desc.includes('you can carry') ||
      desc.includes('only carry one')
    ) {
      suspicious.push(`${consumable.name}: Looks like an Item (permanent equipment)`)
    }

    // Abilities have level requirements and recall costs
    if (desc.includes('level ') && desc.includes('ability')) {
      suspicious.push(`${consumable.name}: Mentions level/ability`)
    }

    if (desc.includes('recall cost')) {
      suspicious.push(`${consumable.name}: Has recall cost (ability trait)`)
    }

    // Consumables should mention consumption or single-use nature
    const hasConsumableKeywords =
      desc.includes('drink') ||
      desc.includes('eat') ||
      desc.includes('consume') ||
      desc.includes('use this') ||
      desc.includes('when you') ||
      desc.includes('after')

    if (!hasConsumableKeywords && desc.length > 20) {
      suspicious.push(`${consumable.name}: No typical consumable keywords`)
    }
  }

  if (suspicious.length > 0) {
    console.log('⚠️  SUSPICIOUS entries found:', suspicious.length)
    suspicious.forEach((s) => console.log('  -', s))
  } else {
    console.log('✅ No suspicious entries - all look like consumables')
  }
}

verifyContent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
