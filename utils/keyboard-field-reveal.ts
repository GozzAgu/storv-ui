import { getNativeKeyboardInset } from '~/utils/native-keyboard-inset'

const TEXT_ENTRY_SELECTOR = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="file"]):not([type="color"]):not([type="hidden"])',
  'textarea',
  'select',
  '[contenteditable=""]',
  '[contenteditable="true"]',
].join(', ')

/** Label + hint wrappers we try to show together with the field. */
const FIELD_GROUP_SELECTOR = '.s-field, .s-auth-field, [data-keyboard-reveal]'

const REVEAL_MARGIN_PX = 16

export type VisibleBand = { top: number; bottom: number }

export function isKeyboardField(el: Element | null): el is HTMLElement {
  return el instanceof HTMLElement && el.matches(TEXT_ENTRY_SELECTOR)
}

/**
 * Pixels to scroll so `rect` sits inside `band` with a margin.
 * Positive scrolls content up (field was under the keyboard), negative scrolls down.
 */
export function computeRevealDelta(
  rect: { top: number; bottom: number },
  band: VisibleBand,
  margin = REVEAL_MARGIN_PX
): number {
  const top = band.top + margin
  const bottom = band.bottom - margin
  if (bottom <= top) return 0
  if (rect.bottom - rect.top > bottom - top) return rect.top - top
  if (rect.bottom > bottom) return rect.bottom - bottom
  if (rect.top < top) return rect.top - top
  return 0
}

let safeTopProbe: HTMLElement | null = null

function safeAreaTop(): number {
  if (!safeTopProbe) {
    safeTopProbe = document.createElement('div')
    safeTopProbe.setAttribute('aria-hidden', 'true')
    safeTopProbe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'
    document.body.appendChild(safeTopProbe)
  }
  return safeTopProbe.offsetHeight
}

/** Area of the layout viewport not covered by the keyboard, status bar, or sticky top bar. */
function windowVisibleBand(): VisibleBand {
  const viewport = window.visualViewport
  let top = Math.max(safeAreaTop(), viewport?.offsetTop ?? 0)
  let bottom = window.innerHeight - getNativeKeyboardInset()
  if (viewport) bottom = Math.min(bottom, viewport.offsetTop + viewport.height)

  const topbar = document.querySelector<HTMLElement>('.s-topbar')
  if (topbar) {
    const r = topbar.getBoundingClientRect()
    if (r.height > 0 && r.top <= 1) top = Math.max(top, r.bottom)
  }
  return { top, bottom }
}

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return null
}

function revealTarget(field: HTMLElement, band: VisibleBand): DOMRect {
  const group = field.closest<HTMLElement>(FIELD_GROUP_SELECTOR)
  const fieldRect = field.getBoundingClientRect()
  if (!group) return fieldRect
  const groupRect = group.getBoundingClientRect()
  const room = band.bottom - band.top - REVEAL_MARGIN_PX * 2
  return groupRect.height <= room ? groupRect : fieldRect
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

/** Scroll the focused field (and its label) into the part of the screen the keyboard leaves free. */
export function revealFocusedField(): void {
  if (typeof document === 'undefined') return
  const field = document.activeElement
  if (!isKeyboardField(field)) return

  const behavior = scrollBehavior()
  const windowBand = windowVisibleBand()
  let rect = revealTarget(field, windowBand)

  const scroller = findScrollParent(field)
  if (scroller) {
    const box = scroller.getBoundingClientRect()
    const band = {
      top: Math.max(windowBand.top, box.top),
      bottom: Math.min(windowBand.bottom, box.bottom),
    }
    const delta = computeRevealDelta(rect, band)
    if (delta !== 0) {
      const maxTop = scroller.scrollHeight - scroller.clientHeight
      const nextTop = Math.min(maxTop, Math.max(0, scroller.scrollTop + delta))
      const applied = nextTop - scroller.scrollTop
      scroller.scrollTo({ top: nextTop, behavior })
      rect = new DOMRect(rect.x, rect.y - applied, rect.width, rect.height)
    }
  }

  const windowDelta = computeRevealDelta(rect, windowBand)
  if (windowDelta !== 0) window.scrollBy({ top: windowDelta, behavior })
}

let pendingFrame = 0

/** Coalesces focus + keyboard events into one reveal after layout settles. */
export function scheduleRevealFocusedField(): void {
  if (typeof window === 'undefined') return
  cancelAnimationFrame(pendingFrame)
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = requestAnimationFrame(revealFocusedField)
  })
}
