import { defineEventHandler } from 'h3'
import { getGeminiModel, isGeminiAssistantConfigured } from '~/server/utils/gemini-config'

/** Public sanity check - returns whether chat can run (no secrets exposed). */
export default defineEventHandler(() => {
  return {
    configured: isGeminiAssistantConfigured(),
    model: getGeminiModel(),
  }
})
