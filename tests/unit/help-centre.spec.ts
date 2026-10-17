import { describe, expect, it } from 'vitest'
import { HELP_TOPICS, searchHelp } from '~/utils/help-centre'

const allText = HELP_TOPICS.flatMap((t) => [
  t.title,
  t.line,
  ...t.answers.flatMap((a) => [a.q, a.a]),
])

describe('help centre content', () => {
  it('follows the copy rules: no exclamation marks and no hyphens', () => {
    for (const text of allText) {
      expect(text, text).not.toMatch(/!/)
      expect(text, text).not.toMatch(/[-–—]/)
    }
  })

  it('keeps every topic line to 12 words or fewer', () => {
    for (const topic of HELP_TOPICS) {
      expect(topic.line.split(/\s+/).length, topic.line).toBeLessThanOrEqual(12)
    }
  })

  it('has unique answer ids within each topic', () => {
    for (const topic of HELP_TOPICS) {
      const ids = topic.answers.map((a) => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('searchHelp', () => {
  it('returns every topic for an empty query', () => {
    expect(searchHelp('   ')).toHaveLength(HELP_TOPICS.length)
  })

  it('finds answers by any word in the question or answer', () => {
    const ids = searchHelp('imei').flatMap((t) => t.answers.map((a) => a.id))
    expect(ids).toContain('fields')
  })

  it('needs every word to match, in any order', () => {
    const results = searchHelp('whatsapp receipt')
    expect(results.flatMap((t) => t.answers.map((a) => a.id))).toEqual(['receipt'])
  })

  it('drops topics with no match', () => {
    expect(searchHelp('zzzz')).toEqual([])
  })
})
