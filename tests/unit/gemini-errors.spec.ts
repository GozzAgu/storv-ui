import { describe, it, expect } from 'vitest'
import { formatGeminiAssistantError } from '~/utils/gemini-errors'

describe('formatGeminiAssistantError', () => {
  it('explains model unavailable for new users', () => {
    const msg = formatGeminiAssistantError(
      'This model models/gemini-2.5-flash is no longer available to new users.',
      'gemini-2.5-flash'
    )
    expect(msg).toContain('gemini-3.1-flash-lite')
  })

  it('explains free tier limit 0', () => {
    const msg = formatGeminiAssistantError(
      'Quota exceeded limit: 0, model: gemini-2.0-flash free_tier',
      'gemini-2.0-flash'
    )
    expect(msg).toContain('gemini-3.1-flash-lite')
    expect(msg).toContain('free tier')
  })
})
