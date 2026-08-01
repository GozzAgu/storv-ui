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

  it('answers copy from branch questions', () => {
    const reply = generateDemoAssistantReply('How do I copy from branch?')
    expect(reply.toLowerCase()).toContain('copy')
    expect(reply.toLowerCase()).toContain('subcategor')
  })

  it('answers branch creation questions', () => {
    const reply = generateDemoAssistantReply('How do I create a branch?')
    expect(reply.toLowerCase()).toContain('settings')
    expect(reply.toLowerCase()).toContain('city')
  })

  it('answers optional subcategory questions', () => {
    const reply = generateDemoAssistantReply('organize with subcategories')
    expect(reply.toLowerCase()).toContain('organize')
  })

  it('returns a default reply for unknown topics', () => {
    const reply = generateDemoAssistantReply('xyzzy unknown topic')
    expect(reply.toLowerCase()).toContain('demo')
  })
})
