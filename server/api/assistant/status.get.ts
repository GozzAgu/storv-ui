import { defineEventHandler } from 'h3'
import { isGeminiAssistantConfigured } from '~/server/utils/gemini-config'

/** Public sanity check - returns whether chat can run (no secrets or model details exposed). */
export default defineEventHandler(() => {
  return {
    configured: isGeminiAssistantConfigured(),
  }
})
