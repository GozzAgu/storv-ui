/**
 * Shrinks stat values that don't fit their cell (e.g. ₦844,000,000.00 on a metric strip or stat
 * card) instead of truncating them, at every screen width. Money is never shortened, so the font
 * steps down instead, to no less than MIN_SCALE of the design size; past that the cell clips with
 * an ellipsis and the full value shows as a hover title.
 */
const SELECTOR = '.s-metrics:not(.s-metrics--inline) .s-metrics__value, .s-stat__value'
const MIN_SCALE = 0.55
/** Marks a title this plugin set, so it never removes a title a template put there. */
const OWN_TITLE = 'fitTitle'

export default defineNuxtPlugin(() => {
  let lastFit = new WeakMap<HTMLElement, string>()
  const watched = new WeakSet<HTMLElement>()
  let frame = 0

  // Cells change width without a window resize (sidebar collapse, panes opening), so watch each.
  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule())

  function fit(el: HTMLElement) {
    if (!watched.has(el)) {
      watched.add(el)
      resizeObserver?.observe(el)
    }

    const text = el.textContent?.trim() ?? ''
    const key = `${el.clientWidth}|${text}`
    if (lastFit.get(el) === key) return
    lastFit.set(el, key)

    el.style.removeProperty('font-size')
    if (el.clientWidth === 0) return

    const base = parseFloat(getComputedStyle(el).fontSize)
    let size = base
    while (el.scrollWidth > el.clientWidth + 1 && size > base * MIN_SCALE) {
      size -= 1
      el.style.fontSize = `${size}px`
    }

    const clipped = el.scrollWidth > el.clientWidth + 1
    if (clipped && (!el.title || el.dataset[OWN_TITLE])) {
      el.title = text
      el.dataset[OWN_TITLE] = '1'
    } else if (!clipped && el.dataset[OWN_TITLE]) {
      el.removeAttribute('title')
      delete el.dataset[OWN_TITLE]
    }
  }

  function schedule() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach(fit)
    })
  }

  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  window.addEventListener('resize', schedule, { passive: true })
  // Text widens once the web font swaps in without the cell or text changing, so re-measure all.
  function refitAll() {
    lastFit = new WeakMap()
    schedule()
  }
  void document.fonts?.ready.then(refitAll)
  document.fonts?.addEventListener('loadingdone', refitAll)
  schedule()
})
