import { describe, expect, it } from 'vitest'
import { sanitizeDemoDisplayDashes } from '~/utils/demo-display-text'

describe('sanitizeDemoDisplayDashes', () => {
  it('replaces em dashes with comma separators', () => {
    expect(sanitizeDemoDisplayDashes('Port Harcourt - GRA')).toBe('Port Harcourt, GRA')
    expect(sanitizeDemoDisplayDashes('Lagos - Lekki')).toBe('Lagos, Lekki')
  })

  it('replaces en dashes', () => {
    expect(sanitizeDemoDisplayDashes('Abuja - Wuse')).toBe('Abuja, Wuse')
  })

  it('leaves comma-separated names unchanged', () => {
    expect(sanitizeDemoDisplayDashes('Port Harcourt, GRA')).toBe('Port Harcourt, GRA')
  })
})
