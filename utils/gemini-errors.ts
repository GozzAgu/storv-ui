import { DEFAULT_GEMINI_ASSISTANT_MODEL } from '~/utils/gemini-models'

/** Map raw Gemini API errors to short, actionable assistant messages. */
export function formatGeminiAssistantError(raw: string, model: string): string {
  const text = raw.trim()
  const lower = text.toLowerCase()

  if (lower.includes('no longer available to new users') || lower.includes('no longer available')) {
    return [
      `Model "${model}" is not available on your Google API project.`,
      `Set GEMINI_MODEL=${DEFAULT_GEMINI_ASSISTANT_MODEL} (or gemini-3.5-flash) in .env, save, and restart npm run dev.`,
      'See https://ai.google.dev/gemini-api/docs/models',
    ].join(' ')
  }

  if (lower.includes('limit: 0') || lower.includes('free_tier')) {
    return [
      `Gemini blocked this request for model "${model}" on the free tier (quota limit is 0).`,
      `Try GEMINI_MODEL=${DEFAULT_GEMINI_ASSISTANT_MODEL} or gemini-3.5-flash in .env, then restart npm run dev.`,
      'If it still fails, enable billing on your Google Cloud project linked to the API key.',
      'Docs: https://ai.google.dev/gemini-api/docs/rate-limits',
    ].join(' ')
  }

  if (lower.includes('quota') || lower.includes('429') || lower.includes('resource exhausted')) {
    return [
      'Gemini rate limit reached. Wait a minute and try again.',
      'Check usage: https://ai.dev/rate-limit',
    ].join(' ')
  }

  if (lower.includes('api key not valid') || lower.includes('invalid api key')) {
    return 'Gemini API key is invalid. Create a new key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in .env.'
  }

  if (text.length > 420) {
    return `${text.slice(0, 417).trim()}…`
  }

  return text || 'Assistant request failed. Please try again.'
}
