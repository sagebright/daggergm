import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

/**
 * Search adversaries using semantic vector similarity
 * @param query - Natural language search query (e.g., "underground insect creature")
 * @param limit - Maximum number of results to return
 * @returns Array of matching adversaries with similarity scores
 */
export async function searchAdversaries(query: string, limit = 5) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Generate embedding for query
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const embeddingData = response.data[0]
  if (!embeddingData) {
    throw new Error('No embedding returned from OpenAI')
  }
  const queryEmbedding = embeddingData.embedding

  // Semantic search using vector similarity
  const { data, error } = await supabase.rpc('match_adversaries', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) {
    throw error
  }
  return data
}

/**
 * Search weapons using semantic vector similarity
 * @param query - Natural language search query
 * @param limit - Maximum number of results to return
 * @returns Array of matching weapons with similarity scores
 */
export async function searchWeapons(query: string, limit = 5) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const embeddingData = response.data[0]
  if (!embeddingData) {
    throw new Error('No embedding returned from OpenAI')
  }
  const queryEmbedding = embeddingData.embedding

  const { data, error } = await supabase.rpc('match_weapons', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) {
    throw error
  }
  return data
}

/**
 * Search environments using semantic vector similarity
 * @param query - Natural language search query
 * @param limit - Maximum number of results to return
 * @returns Array of matching environments with similarity scores
 */
export async function searchEnvironments(query: string, limit = 5) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const embeddingData = response.data[0]
  if (!embeddingData) {
    throw new Error('No embedding returned from OpenAI')
  }
  const queryEmbedding = embeddingData.embedding

  const { data, error } = await supabase.rpc('match_environments', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) {
    throw error
  }
  return data
}

/**
 * Search items using semantic vector similarity
 * @param query - Natural language search query
 * @param limit - Maximum number of results to return
 * @returns Array of matching items with similarity scores
 */
export async function searchItems(query: string, limit = 5) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const embeddingData = response.data[0]
  if (!embeddingData) {
    throw new Error('No embedding returned from OpenAI')
  }
  const queryEmbedding = embeddingData.embedding

  const { data, error } = await supabase.rpc('match_items', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) {
    throw error
  }
  return data
}
