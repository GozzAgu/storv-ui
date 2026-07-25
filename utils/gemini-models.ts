/** Default Gemini model for Storvv Assistant (new API keys / free tier). */
export const DEFAULT_GEMINI_ASSISTANT_MODEL = 'gemini-3.1-flash-lite'

/** Fallback models if the primary is unavailable on an account. */
export const GEMINI_ASSISTANT_MODEL_FALLBACKS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
] as const
