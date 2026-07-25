import { DEFAULT_GEMINI_ASSISTANT_MODEL } from '~/utils/gemini-models'

export { DEFAULT_GEMINI_ASSISTANT_MODEL }

export function getGeminiApiKey(): string {
  const config = useRuntimeConfig()
  const fromConfig = typeof config.geminiApiKey === 'string' ? config.geminiApiKey.trim() : ''
  if (fromConfig) return fromConfig
  return (process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY || '').trim()
}

export function getGeminiModel(): string {
  const config = useRuntimeConfig()
  const fromConfig = typeof config.geminiModel === 'string' ? config.geminiModel.trim() : ''
  if (fromConfig) return fromConfig
  return (process.env.GEMINI_MODEL || DEFAULT_GEMINI_ASSISTANT_MODEL).trim()
}

export function isGeminiAssistantConfigured(): boolean {
  return Boolean(getGeminiApiKey())
}
