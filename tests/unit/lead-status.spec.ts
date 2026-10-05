import { describe, expect, it } from 'vitest'
import { leadStatusTone } from '~/utils/lead-status'

describe('leadStatusTone', () => {
  it('maps each lead status to a badge tone', () => {
    expect(leadStatusTone('new')).toBe('info')
    expect(leadStatusTone('contacted')).toBe('accent')
    expect(leadStatusTone('negotiating')).toBe('warning')
    expect(leadStatusTone('won')).toBe('success')
    expect(leadStatusTone('lost')).toBe('error')
  })
})
