/**
 * The message a visitor's WhatsApp chat starts with: what they want help with and which page
 * they were reading, so the reply can pick up where they are.
 */

export type WhatsappTopic = 'question' | 'pricing' | 'setup' | 'demo'

const PAGE_NAMES: Record<string, string> = {
  '/': 'home page',
  '/pricing': 'pricing page',
  '/features': 'features page',
  '/security': 'security page',
  '/about': 'about page',
  '/help': 'help centre',
}

const OPENERS: Record<WhatsappTopic, string> = {
  question: 'Hi Storvv, I have a question.',
  pricing: 'Hi Storvv, I have a question about pricing and plans.',
  setup: 'Hi Storvv, I need help setting up my store.',
  demo: "Hi Storvv, I'd like a walkthrough of the app.",
}

export function whatsappChatMessage(topic: WhatsappTopic, path: string): string {
  const clean = path.replace(/\/+$/, '') || '/'
  const page = PAGE_NAMES[clean]
  return page ? `${OPENERS[topic]} (I'm on your ${page}.)` : OPENERS[topic]
}
