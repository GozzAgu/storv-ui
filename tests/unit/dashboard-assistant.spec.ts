import { describe, it, expect } from 'vitest'
import {
  buildAssistantSystemPrompt,
  buildDashboardHelpKnowledgeBase,
  dashboardHelpCategories,
} from '~/utils/dashboard-help-content'
import { normalizeAssistantChatTurns, sanitizeAssistantReply } from '~/utils/assistant-chat'
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
    expect(kb).toContain('## Mobile app (iOS & Android)')
    expect(kb).toContain('Storvv iOS app redesign')
    expect(kb).toContain('Sales leads pipeline')
    expect(kb).toContain('Subcategories (one level under a parent category)')
    expect(kb).toContain('Optional subcategories when creating categories')
    expect(kb).toContain('Copy from branch: optional subcategories')
    expect(kb).toContain('Branch names from your region')
    expect(kb).toContain('Create New Sale')
    expect(kb).toContain('Customer buybacks')
    expect(kb).toContain('Feature insights')
    expect(kb).toContain('Pull to refresh')
  })

  it('builds a system prompt with safety rules', () => {
    const prompt = buildAssistantSystemPrompt('Sample knowledge')
    expect(prompt).toContain('Storvv Assistant')
    expect(prompt).toContain('NEVER invent live store data')
    expect(prompt).toContain('Organize with subcategories')
    expect(prompt).toContain('Copy from branch')
    expect(prompt).toContain('Sales leads')
    expect(prompt).toContain('Native iOS')
    expect(prompt).toContain('Do NOT use Markdown bold')
    expect(prompt).toContain('Sample knowledge')
  })
})

describe('assistant reply formatting', () => {
  it('removes markdown bold markers', () => {
    expect(sanitizeAssistantReply('**Step 1:** Pick a category')).toBe('Step 1: Pick a category')
    expect(sanitizeAssistantReply('Use **Analytics** for trends')).toBe('Use Analytics for trends')
  })

  it('preserves bullet lines', () => {
    const input = '- First step\n- Second step'
    expect(sanitizeAssistantReply(input)).toBe(input)
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
