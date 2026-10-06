/**
 * On phones, shrinks stat values that don't fit their cell (e.g. ₦12,450,000.00 in a
 * two-column metric grid) instead of truncating them. Values never go below 60% of the
 * design size; at that point the cell clips as before.
 */
const SELECTOR = '.s-metrics:not(.s-metrics--inline) .s-metrics__value, .s-stat__value'
const MIN_SCALE = 0.6

export default defineNuxtPlugin(() => {
  const phone = window.matchMedia('(max-width: 639px)')
  let lastFit = new WeakMap<HTMLElement, string>()
  let frame = 0

  function fit(el: HTMLElement) {
    const key = `${phone.matches}|${el.clientWidth}|${el.textContent}`
    if (lastFit.get(el) === key) return
    lastFit.set(el, key)

    el.style.removeProperty('font-size')
    if (!phone.matches || el.clientWidth === 0) return

    const base = parseFloat(getComputedStyle(el).fontSize)
    let size = base
    while (el.scrollWidth > el.clientWidth + 1 && size > base * MIN_SCALE) {
      size -= 1
      el.style.fontSize = `${size}px`
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
  phone.addEventListener('change', schedule)
  // Text widens once the web font swaps in without the cell or text changing, so re-measure all.
  function refitAll() {
    lastFit = new WeakMap()
    schedule()
  }
  void document.fonts?.ready.then(refitAll)
  document.fonts?.addEventListener('loadingdone', refitAll)
  schedule()
})
