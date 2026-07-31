import { describe, it, expect } from 'vitest'
import {
  buildAssistantSystemPrompt,
  buildDashboardHelpKnowledgeBase,
  dashboardHelpCategories,
} from '~/utils/dashboard-help-content'
import { normalizeAssistantChatTurns } from '~/utils/assistant-chat'
import { buildAssistantTopicPrompt } from '~/composables/useDashboardAssistant'

describe('dashboard help content', () => {
  it('includes core categories', () => {
    const ids = dashboardHelpCategories.map((category) => category.id)
    expect(ids).toContain('inventory')
    expect(ids).toContain('settings-subscription')
  })

  it('builds a knowledge base with article titles', () => {
    const kb = buildDashboardHelpKnowledgeBase()
    expect(kb).toContain('## Inventory')
    expect(kb).toContain('Subcategories (one level under a parent category)')
    expect(kb).toContain('Create New Receipt')
  })

  it('builds a system prompt with safety rules', () => {
    const prompt = buildAssistantSystemPrompt('Sample knowledge')
    expect(prompt).toContain('Storvv Assistant')
    expect(prompt).toContain('NEVER invent live store data')
    expect(prompt).toContain('subcategories')
    expect(prompt).toContain('Sample knowledge')
  })
})

describe('assistant chat validation', () => {
  it('accepts a user turn', () => {
    const turns = normalizeAssistantChatTurns([{ role: 'user', content: 'How do I refund?' }])
    expect(turns).toEqual([{ role: 'user', content: 'How do I refund?' }])
  })

  it('requires the last turn to be from the user', () => {
    expect(() =>
      normalizeAssistantChatTurns([{ role: 'assistant', content: 'Hello' }])
    ).toThrow(/last message must be from the user/)
  })
})

describe('assistant topic prompts', () => {
  it('builds a help topic question', () => {
    expect(buildAssistantTopicPrompt('Inventory')).toBe('How does Inventory work in Storvv?')
  })
})
