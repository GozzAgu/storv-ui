import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CAPACITOR_BOOT_SPLASH_SCRIPT } from '~/utils/capacitor-shell-inline'
import {
  NATIVE_BOOT_SPLASH_ID,
  dismissNativeBootSplash,
  hasNativeBootSplash,
} from '~/utils/native-boot-splash'

function runBootScript() {
  new Function(CAPACITOR_BOOT_SPLASH_SCRIPT)()
}

describe('native boot splash', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.getElementById('s-native-boot-style')?.remove()
    document.documentElement.className = ''
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('paints the Storvv mark only inside the native app', () => {
    runBootScript()
    expect(hasNativeBootSplash()).toBe(false)

    document.documentElement.classList.add('capacitor-native')
    runBootScript()
    const splash = document.getElementById(NATIVE_BOOT_SPLASH_ID)
    expect(splash?.getAttribute('aria-label')).toBe('Loading Storvv')
    expect(splash?.querySelectorAll('svg path')).toHaveLength(2)
  })

  it('matches the saved dark theme before the app has applied it', () => {
    document.documentElement.classList.add('capacitor-native')
    localStorage.setItem('theme', 'dark')
    runBootScript()
    expect(document.getElementById(NATIVE_BOOT_SPLASH_ID)?.className).toBe('is-dark')
  })

  it('does not paint twice', () => {
    document.documentElement.classList.add('capacitor-native')
    runBootScript()
    runBootScript()
    expect(document.querySelectorAll(`#${NATIVE_BOOT_SPLASH_ID}`)).toHaveLength(1)
  })

  it('fades out, then removes the mark and its styles', () => {
    vi.useFakeTimers()
    document.documentElement.classList.add('capacitor-native')
    runBootScript()

    dismissNativeBootSplash()
    expect(document.getElementById(NATIVE_BOOT_SPLASH_ID)?.classList.contains('is-done')).toBe(true)

    vi.advanceTimersByTime(300)
    expect(hasNativeBootSplash()).toBe(false)
    expect(document.getElementById('s-native-boot-style')).toBeNull()
    expect(() => dismissNativeBootSplash()).not.toThrow()
  })
})
