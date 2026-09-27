import { describe, expect, it } from 'vitest'
import { isTabletTier, resolveIosSizeTier } from '~/utils/ios-size-tier'

describe('resolveIosSizeTier', () => {
  it.each([
    [320, 'phone-sm'],
    [374, 'phone-sm'],
    [375, 'phone'],
    [393, 'phone'],
    [430, 'phone-lg'],
    [743, 'phone-lg'],
    [744, 'tablet-sm'],
    [820, 'tablet-sm'],
    [834, 'tablet'],
    [1023, 'tablet'],
    [1024, 'tablet-lg'],
    [1366, 'tablet-lg'],
  ] as const)('%ipx → %s', (width, tier) => {
    expect(resolveIosSizeTier(width)).toBe(tier)
  })

  it('treats only tablet tiers as iPad layout', () => {
    expect(isTabletTier('phone-lg')).toBe(false)
    expect(isTabletTier('tablet-sm')).toBe(true)
  })
})
