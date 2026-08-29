/** Scroll target inside the native dashboard main scroller (iOS/Android). */
export function getDashboardNativeMainScroller(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>('.dashboard-native-main')
}

/**
 * Scroll to an element within the dashboard. On Capacitor, scrolls the
 * `.dashboard-native-main` container instead of the window.
 */
export function scrollDashboardToElement(
  selector: string,
  options: { block?: ScrollLogicalPosition; offset?: number } = {}
): void {
  if (typeof document === 'undefined') return

  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return

  const block = options.block ?? 'start'
  const offset = options.offset ?? 12
  const scroller = getDashboardNativeMainScroller()

  if (scroller?.contains(el)) {
    const scrollerRect = scroller.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const top =
      elRect.top - scrollerRect.top + scroller.scrollTop - (block === 'start' ? offset : 0)
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    return
  }

  el.scrollIntoView({ behavior: 'smooth', block })
}
