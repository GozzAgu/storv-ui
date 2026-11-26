import { describe, expect, it } from 'vitest'
import { whatsappChatMessage } from '~/utils/whatsapp-chat-message'

describe('whatsappChatMessage', () => {
  it('opens with the topic and says which page the visitor was on', () => {
    expect(whatsappChatMessage('pricing', '/pricing')).toBe(
      "Hi Storvv, I have a question about pricing and plans. (I'm on your pricing page.)"
    )
    expect(whatsappChatMessage('question', '/')).toBe(
      "Hi Storvv, I have a question. (I'm on your home page.)"
    )
    expect(whatsappChatMessage('setup', '/help/')).toContain('help centre')
  })

  it('leaves the page out when it is not a known marketing page', () => {
    expect(whatsappChatMessage('demo', '/blog/some-post')).toBe(
      "Hi Storvv, I'd like a walkthrough of the app."
    )
  })
})
