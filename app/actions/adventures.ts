'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { OpenAI } from 'openai'

export interface AdventureConfig {
  length: string
  primary_motif: string
  frame?: string
  party_size?: number
  party_level?: number
  difficulty?: string
  stakes?: string
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function generateAdventure(config: AdventureConfig) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Check credits for authenticated users
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!profile || profile.credits === null || profile.credits <= 0) {
        return { success: false, error: 'Insufficient credits' }
      }

      // Consume credit
      await supabase
        .from('user_profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', userId)
    }

    // Generate adventure using OpenAI
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Return JSON only with structure: {"title":"string","description":"string","movements":[]}',
        },
        {
          role: 'user',
          content: `Create adventure: ${JSON.stringify(config)}`,
        },
      ],
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const scaffoldData = JSON.parse(content)

    // Save to database
    const { data: adventure, error } = await supabase
      .from('adventures')
      .insert({
        user_id: userId,
        title: scaffoldData.title,
        frame: config.frame || 'witherwild',
        focus: config.primary_motif,
        state: 'draft',
        config: {
          length: config.length,
          primary_motif: config.primary_motif,
          party_size: config.party_size,
          party_level: config.party_level,
          difficulty: config.difficulty,
          stakes: config.stakes,
        },
        movements: scaffoldData.movements,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, adventureId: adventure.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getAdventure(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('adventures').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching adventure:', error)
    return null
  }

  return data
}

export async function getUserAdventures() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('adventures')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching adventures:', error)
    return []
  }

  return data || []
}
