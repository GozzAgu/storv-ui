import { describe, it, expect, afterEach } from 'vitest'
import {
  applyNativeKeyboardInset,
  clearNativeKeyboardInset,
} from '~/utils/native-keyboard-inset'

describe('native keyboard inset', () => {
  afterEach(() => {
    clearNativeKeyboardInset()
  })

  it('sets css variable and data attribute when keyboard is open', () => {
    applyNativeKeyboardInset(312)
    expect(document.documentElement.style.getPropertyValue('--native-keyboard-inset')).toBe('312px')
    expect(document.documentElement.hasAttribute('data-native-keyboard-open')).toBe(true)
  })

  it('clears inset when keyboard closes', () => {
    applyNativeKeyboardInset(280)
    clearNativeKeyboardInset()
    expect(document.documentElement.style.getPropertyValue('--native-keyboard-inset')).toBe('0px')
    expect(document.documentElement.hasAttribute('data-native-keyboard-open')).toBe(false)
  })
})
