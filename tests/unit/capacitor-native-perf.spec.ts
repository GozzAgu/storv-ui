import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  isNativePerfContext,
  scheduleNativeIdleWork,
  stripNativeWebFontLinks,
} from '~/utils/capacitor-native-perf'

vi.mock('~/utils/capacitor-env', () => ({
  isCapacitorNative: vi.fn(() => true),
}))

describe('capacitor-native-perf', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stripNativeWebFontLinks removes google font stylesheets', () => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand'
    document.head.appendChild(link)

    stripNativeWebFontLinks()

    expect(document.querySelector('link[href*="fonts.googleapis.com"]')).toBeNull()
  })

  it('scheduleNativeIdleWork runs callback', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    scheduleNativeIdleWork(fn, 100)
    vi.runAllTimers()
    expect(fn).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('isNativePerfContext reflects capacitor shell', () => {
    expect(isNativePerfContext()).toBe(true)
  })
})
