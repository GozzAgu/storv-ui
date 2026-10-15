export type ScrollAxis = 'x' | 'y'

export const AXIS_LOCK_ATTR = 'data-scroll-axis-lock'

const SIDEWAYS_SCROLLER_SELECTOR = '.s-table-wrap, .s-receipt-doc__table-wrap'

/** Movement (px) before a swipe commits to a direction. */
const AXIS_DECISION_PX = 4

/** Returns the swipe's axis once it has moved far enough, otherwise null. Ties go to vertical. */
export function pickScrollAxis(
  dx: number,
  dy: number,
  threshold = AXIS_DECISION_PX
): ScrollAxis | null {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (Math.max(ax, ay) < threshold) return null
  return ax > ay ? 'x' : 'y'
}

/**
 * iOS lets a sideways table and the page scroll at the same time, so swipes drift diagonally.
 * Each swipe that starts on a table is locked to its first direction: vertical freezes the table,
 * sideways freezes the page. The CSS for both locks lives in `ios.css`.
 */
export function startTableScrollAxisLock(doc: Document = document): () => void {
  const root = doc.documentElement
  let scroller: HTMLElement | null = null
  let startX = 0
  let startY = 0
  let decided = false

  const release = () => {
    scroller?.removeAttribute(AXIS_LOCK_ATTR)
    root.removeAttribute(AXIS_LOCK_ATTR)
    scroller = null
    decided = false
  }

  const onTouchStart = (event: TouchEvent) => {
    release()
    if (event.touches.length !== 1) return
    const target = event.target as Element | null
    const el = target?.closest?.(SIDEWAYS_SCROLLER_SELECTOR) as HTMLElement | null
    if (!el || el.scrollWidth <= el.clientWidth) return
    const touch = event.touches[0]!
    scroller = el
    startX = touch.clientX
    startY = touch.clientY
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!scroller || decided) return
    const touch = event.touches[0]
    if (!touch) return
    const axis = pickScrollAxis(touch.clientX - startX, touch.clientY - startY)
    if (!axis) return
    decided = true
    if (axis === 'y') scroller.setAttribute(AXIS_LOCK_ATTR, 'y')
    else root.setAttribute(AXIS_LOCK_ATTR, 'x')
  }

  const options: AddEventListenerOptions = { passive: true, capture: true }
  doc.addEventListener('touchstart', onTouchStart, options)
  doc.addEventListener('touchmove', onTouchMove, options)
  doc.addEventListener('touchend', release, options)
  doc.addEventListener('touchcancel', release, options)

  return () => {
    release()
    doc.removeEventListener('touchstart', onTouchStart, options)
    doc.removeEventListener('touchmove', onTouchMove, options)
    doc.removeEventListener('touchend', release, options)
    doc.removeEventListener('touchcancel', release, options)
  }
}
