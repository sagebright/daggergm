import { OpenAIProvider } from './openai-provider'
import type { LLMProvider } from './types'

// Singleton instance
let provider: LLMProvider | null = null

/**
 * Get the configured LLM provider instance
 */
export function getLLMProvider(): LLMProvider {
  if (!provider) {
    // For now, we only have OpenAI, but this could be extended
    // to support other providers based on configuration
    provider = new OpenAIProvider()
  }

  return provider
}

/**
 * Explicitly set a provider (useful for testing)
 */
export function setLLMProvider(newProvider: LLMProvider): void {
  provider = newProvider
}

/**
 * Reset provider (useful for testing)
 */
export function resetLLMProvider(): void {
  provider = null
}
