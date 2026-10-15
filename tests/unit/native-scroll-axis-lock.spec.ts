import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  AXIS_LOCK_ATTR,
  pickScrollAxis,
  startTableScrollAxisLock,
} from '~/utils/native-scroll-axis-lock'

function touch(type: string, target: EventTarget, x: number, y: number) {
  const event = new Event(type, { bubbles: true })
  const points = type === 'touchend' ? [] : [{ clientX: x, clientY: y }]
  Object.defineProperty(event, 'touches', { value: points })
  target.dispatchEvent(event)
}

function makeTable(scrollWidth: number, clientWidth: number) {
  const wrap = document.createElement('div')
  wrap.className = 's-table-wrap'
  Object.defineProperty(wrap, 'scrollWidth', { value: scrollWidth })
  Object.defineProperty(wrap, 'clientWidth', { value: clientWidth })
  const cell = document.createElement('span')
  wrap.appendChild(cell)
  document.body.appendChild(wrap)
  return { wrap, cell }
}

describe('pickScrollAxis', () => {
  it('waits until the swipe has moved a few pixels', () => {
    expect(pickScrollAxis(2, 1)).toBeNull()
  })

  it('picks the dominant direction, preferring vertical on a tie', () => {
    expect(pickScrollAxis(12, 5)).toBe('x')
    expect(pickScrollAxis(-3, -9)).toBe('y')
    expect(pickScrollAxis(6, 6)).toBe('y')
  })
})

describe('startTableScrollAxisLock', () => {
  let stop: () => void

  beforeEach(() => {
    stop = startTableScrollAxisLock(document)
  })

  afterEach(() => {
    stop()
    document.body.innerHTML = ''
  })

  it('freezes the table while the page scrolls vertically, then releases', () => {
    const { wrap, cell } = makeTable(900, 300)
    touch('touchstart', cell, 100, 100)
    touch('touchmove', cell, 103, 130)
    expect(wrap.getAttribute(AXIS_LOCK_ATTR)).toBe('y')
    expect(document.documentElement.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)

    touch('touchmove', cell, 160, 140)
    expect(document.documentElement.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)

    touch('touchend', cell, 0, 0)
    expect(wrap.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)
  })

  it('freezes the page while the table scrolls sideways', () => {
    const { wrap, cell } = makeTable(900, 300)
    touch('touchstart', cell, 100, 100)
    touch('touchmove', cell, 60, 104)
    expect(document.documentElement.getAttribute(AXIS_LOCK_ATTR)).toBe('x')
    expect(wrap.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)

    touch('touchcancel', cell, 0, 0)
    expect(document.documentElement.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)
  })

  it('leaves tables that fit the screen alone', () => {
    const { wrap, cell } = makeTable(300, 300)
    touch('touchstart', cell, 100, 100)
    touch('touchmove', cell, 60, 104)
    expect(wrap.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)
    expect(document.documentElement.hasAttribute(AXIS_LOCK_ATTR)).toBe(false)
  })
})
