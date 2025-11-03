/* eslint-disable no-console */
/**
 * Script to add credits to a test user account
 * Usage: npx tsx scripts/add-credits.ts <email> <credits>
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const email = process.argv[2]
  const credits = parseInt(process.argv[3] || '1000', 10)

  if (!email) {
    console.error('Usage: npx tsx scripts/add-credits.ts <email> <credits>')
    console.log('\nFetching recent users to help you find the right account...')

    const { data: users, error } = await supabase
      .from('daggerheart_user_profiles')
      .select('id, email, credits')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching users:', error)
      process.exit(1)
    }

    console.log('\nRecent users:')
    users?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.credits} credits`)
    })
    process.exit(1)
  }

  // Find user by email
  const { data: userData, error: findError } = await supabase
    .from('daggerheart_user_profiles')
    .select('id, email, credits')
    .eq('email', email)
    .single()

  if (findError || !userData) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  console.log(`Found user: ${userData.email} with ${userData.credits} credits`)

  // Update credits
  const { error: updateError } = await supabase
    .from('daggerheart_user_profiles')
    .update({ credits })
    .eq('id', userData.id)

  if (updateError) {
    console.error('Error updating credits:', updateError)
    process.exit(1)
  }

  console.log(`✅ Successfully added ${credits} credits to ${email}`)
}

void main()
