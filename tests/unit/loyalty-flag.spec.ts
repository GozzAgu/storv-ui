import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/utils/demo-mode', () => ({ isDemoModeActive: () => false }))

import { loyaltyUiFlag } from '~/composables/useLoyalty'

const withFlag = (loyalty: unknown) =>
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { loyalty } }))

describe('loyaltyUiFlag', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is on for the values NUXT_PUBLIC_LOYALTY=1 can produce at runtime', () => {
    for (const value of [true, 1, '1', 'true']) {
      withFlag(value)
      expect(loyaltyUiFlag()).toBe(true)
    }
  })

  it('is off when unset or anything else', () => {
    for (const value of [false, 0, '', '0', undefined, null, 'yes']) {
      withFlag(value)
      expect(loyaltyUiFlag()).toBe(false)
    }
  })
})
