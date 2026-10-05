// Paste into Runtime.evaluate (awaitPromise). Visits each route through the Nuxt router and reports
// horizontal overflow, interactive targets under 44px and nameless controls.
(async (routes) => {
  const router = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$router
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  const name = (el) =>
    (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent || el.getAttribute('title') || el.querySelector('img[alt]')?.alt || '').trim()
  const desc = (el) => {
    const cls = String(el.className?.baseVal ?? el.className).split(/\s+/).filter((c) => c.startsWith('s-')).slice(0, 2).join('.')
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}[${name(el).slice(0, 24)}]`
  }
  for (const path of routes) {
    await router.push(path)
    await sleep(2200)
    const vw = document.documentElement.clientWidth
    const report = { overflowPx: document.documentElement.scrollWidth - vw, wide: [], small: [], nameless: [] }
    const inScroller = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true
      }
      return false
    }
    for (const el of document.querySelectorAll('main *, .s-topbar *, .s-bottomnav *')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (r.right > vw + 1 && !inScroller(el)) report.wide.push(`${desc(el)} right=${Math.round(r.right)}`)
    }
    const interactive = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=menuitem], [tabindex="0"]')
    for (const el of interactive) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue
      if (el.closest('.s-skip-link, nuxt-route-announcer') || el.classList.contains('s-skip-link')) continue
      const inlineText = el.tagName === 'A' && getComputedStyle(el).display === 'inline'
      let target = el
      if (el.matches('input[type=checkbox], input[type=radio]')) target = el.closest('label') || el
      const tr = target.getBoundingClientRect()
      if (!inlineText && (tr.width < 43.5 || tr.height < 43.5)) report.small.push(`${desc(el)} ${Math.round(tr.width)}x${Math.round(tr.height)}`)
      if (!name(el) && !el.labels?.length && !el.matches('input[type=checkbox], input[type=radio]') && !el.id) report.nameless.push(desc(el))
    }
    report.small = [...new Set(report.small)].slice(0, 25)
    report.wide = report.wide.slice(0, 10)
    out[path] = report
  }
  return JSON.stringify(out)
})
