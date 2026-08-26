import { describe, expect, it } from 'vitest'
import { buildIosStatAccessibilityLabel } from '~/utils/ios-stat-accessibility'

describe('buildIosStatAccessibilityLabel', () => {
  it('joins label, value, change, and subtext', () => {
    expect(
      buildIosStatAccessibilityLabel({
        label: "Today's sales",
        value: '₦2,450,000',
        change: '+12.4%',
        subtext: 'vs yesterday',
      })
    ).toBe("Today's sales, ₦2,450,000, +12.4%, vs yesterday")
  })

  it('omits empty optional fields', () => {
    expect(
      buildIosStatAccessibilityLabel({
        label: 'Low stock signals',
        value: '0',
      })
    ).toBe('Low stock signals, 0')
  })
})
