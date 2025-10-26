/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const s = createClient(supabaseUrl, supabaseKey)

async function verifyContent() {
  // Get all abilities
  const { data: abilities } = await s
    .from('daggerheart_abilities')
    .select('name, ability_type, description')
    .order('name')

  console.log('Total abilities:', abilities?.length)
  console.log('')

  // Validate ability_type values
  const validTypes = ['Foundation', 'Specialization', 'Pinnacle']
  const invalidTypes: string[] = []

  for (const ability of abilities || []) {
    if (!validTypes.includes(ability.ability_type)) {
      invalidTypes.push(`${ability.name}: ${ability.ability_type}`)
    }
  }

  if (invalidTypes.length > 0) {
    console.log('❌ INVALID ability_type values found:', invalidTypes.length)
    invalidTypes.forEach((i) => console.log('  -', i))
  } else {
    console.log('✅ All ability_type values are valid')
  }

  // Check for suspicious patterns that might indicate wrong content type
  const suspicious: string[] = []

  for (const ability of abilities || []) {
    const desc = ability.description.toLowerCase()

    // Items often mention "you can attach", "charm", "relic"
    if (
      desc.includes('attach this charm') ||
      desc.includes('attach this stone') ||
      desc.includes('_item_') ||
      desc.includes('_relic_')
    ) {
      suspicious.push(`${ability.name}: Looks like an Item`)
    }

    // Consumables often mention "drink", "vial", "eat", "_consumable_"
    if (
      desc.includes('drink the contents') ||
      desc.includes('_consumable_') ||
      desc.includes('eat these')
    ) {
      suspicious.push(`${ability.name}: Looks like a Consumable`)
    }

    // Abilities should mention game mechanics like rolls, hope, stress, etc.
    const hasAbilityKeywords =
      desc.includes('roll') ||
      desc.includes('hope') ||
      desc.includes('stress') ||
      desc.includes('make a') ||
      desc.includes('spend') ||
      desc.includes('gain') ||
      desc.includes('damage') ||
      desc.includes('attack') ||
      desc.includes('ability') ||
      desc.includes('spellcast') ||
      desc.includes('target') ||
      desc.includes('range')

    if (!hasAbilityKeywords && desc.length > 20) {
      suspicious.push(`${ability.name}: No typical ability keywords`)
    }
  }

  console.log('')
  if (suspicious.length > 0) {
    console.log('⚠️  SUSPICIOUS entries found:', suspicious.length)
    suspicious.slice(0, 20).forEach((s) => console.log('  -', s))
    if (suspicious.length > 20) {
      console.log(`  ... and ${suspicious.length - 20} more`)
    }
  } else {
    console.log('✅ No suspicious entries - all look like abilities')
  }
}

verifyContent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
