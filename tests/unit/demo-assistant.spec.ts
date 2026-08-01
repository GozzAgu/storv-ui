import { describe, expect, it } from 'vitest'
import { generateDemoAssistantReply } from '~/utils/demo-assistant'

describe('demo assistant', () => {
  it('answers buyback questions without markdown bold', () => {
    const reply = generateDemoAssistantReply('How do customer buybacks work?')
    expect(reply.toLowerCase()).toContain('buyback')
    expect(reply).not.toContain('**')
  })

  it('answers analytics questions', () => {
    const reply = generateDemoAssistantReply('What are analytics feature insights?')
    expect(reply.toLowerCase()).toContain('analytics')
  })

  it('returns a default reply for unknown topics', () => {
    const reply = generateDemoAssistantReply('xyzzy unknown topic')
    expect(reply.toLowerCase()).toContain('demo')
  })
})
