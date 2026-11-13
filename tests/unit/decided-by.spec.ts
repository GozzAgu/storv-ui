import { describe, expect, it } from 'vitest'
import { decidedByLine, decidedByName } from '~/utils/decided-by'

describe('decidedBy', () => {
  it('names the person who decided, and says "you" to them', () => {
    expect(decidedByLine('Approved', 'Ada Obi', 'u2', 'u1')).toBe('Approved by Ada Obi')
    expect(decidedByLine('Rejected', 'Ada Obi', 'u1', 'u1')).toBe('Rejected by you')
  })

  it('never shows a raw id for records saved before names were', () => {
    expect(decidedByName(undefined, 'u2', 'u1')).toBeNull()
    expect(decidedByLine('Approved', '', 'u2', 'u1')).toBeNull()
  })
})
