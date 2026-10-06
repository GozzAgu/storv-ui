import { afterEach, describe, expect, it } from 'vitest'
import { computeRevealDelta, isKeyboardField } from '~/utils/keyboard-field-reveal'
import {
  applyNativeKeyboardInset,
  clearNativeKeyboardInset,
  getNativeKeyboardInset,
} from '~/utils/native-keyboard-inset'

const band = { top: 100, bottom: 500 }

describe('computeRevealDelta', () => {
  it('leaves a field alone when it is already visible', () => {
    expect(computeRevealDelta({ top: 200, bottom: 250 }, band)).toBe(0)
  })

  it('scrolls up when the keyboard covers the field', () => {
    expect(computeRevealDelta({ top: 600, bottom: 650 }, band)).toBe(166)
  })

  it('scrolls down when the field is under the top bar', () => {
    expect(computeRevealDelta({ top: 40, bottom: 90 }, band)).toBe(-76)
  })

  it('aligns tall content to the top of the free area', () => {
    expect(computeRevealDelta({ top: 300, bottom: 900 }, band)).toBe(184)
  })
})

describe('isKeyboardField', () => {
  it('matches text entry fields but not toggles or buttons', () => {
    const make = (html: string) => {
      const host = document.createElement('div')
      host.innerHTML = html
      return host.firstElementChild
    }
    expect(isKeyboardField(make('<input type="email">'))).toBe(true)
    expect(isKeyboardField(make('<textarea></textarea>'))).toBe(true)
    expect(isKeyboardField(make('<input type="checkbox">'))).toBe(false)
    expect(isKeyboardField(make('<button>Go</button>'))).toBe(false)
  })
})

describe('getNativeKeyboardInset', () => {
  afterEach(() => clearNativeKeyboardInset())

  it('tracks the last applied keyboard height', () => {
    applyNativeKeyboardInset(301.6)
    expect(getNativeKeyboardInset()).toBe(302)
    clearNativeKeyboardInset()
    expect(getNativeKeyboardInset()).toBe(0)
  })
})
