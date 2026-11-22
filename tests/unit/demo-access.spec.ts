import { beforeEach, describe, expect, it } from 'vitest'
import { canOpenDemo } from '~/utils/demo-access'

describe('demo access', () => {
  beforeEach(() => localStorage.clear())

  it('is closed to visitors without the private link', () => {
    expect(canOpenDemo({}, 'team-key', false)).toBe(false)
    expect(canOpenDemo({ access: 'guess' }, 'team-key', false)).toBe(false)
  })

  it('stays closed to everyone when no key is set, except local development', () => {
    expect(canOpenDemo({ access: '' }, '', false)).toBe(false)
    expect(canOpenDemo({}, '', true)).toBe(true)
  })

  it('opens with the private link and remembers this browser', () => {
    expect(canOpenDemo({ access: 'team-key' }, 'team-key', false)).toBe(true)
    expect(canOpenDemo({}, 'team-key', false)).toBe(true)
  })

  it('forgets the browser when the key is changed', () => {
    canOpenDemo({ access: 'old-key' }, 'old-key', false)
    expect(canOpenDemo({}, 'new-key', false)).toBe(false)
  })
})
