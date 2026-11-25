import { describe, expect, it } from 'vitest'
import { tableFits } from '~/utils/table-fit'

describe('tableFits', () => {
  it('pins tables that fit their card, with a pixel of rounding allowed', () => {
    expect(tableFits(1000, 1000)).toBe(true)
    expect(tableFits(1000, 1001)).toBe(true)
    expect(tableFits(1000, 640)).toBe(true)
  })

  it('leaves wider tables scrolling sideways', () => {
    expect(tableFits(1000, 1002)).toBe(false)
    expect(tableFits(640, 1280)).toBe(false)
  })
})
