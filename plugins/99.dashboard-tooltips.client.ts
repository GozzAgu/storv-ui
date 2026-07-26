/**
 * Styled dashboard tooltips — opt-in only via `data-dashboard-tooltip`.
 * Do not use native `title` for hover hints; it shows unstyled browser chrome and clutters the UI.
 * Icon-only controls should use `aria-label`; truncated text can set `data-dashboard-tooltip` when needed.
 */
import { isCapacitorNative } from '~/utils/capacitor-env'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return
  if (isCapacitorNative()) return

  let activeEl: HTMLElement | null = null

  const tooltipEl = document.createElement('div')
  tooltipEl.className = 'dashboard-global-tooltip'
  tooltipEl.setAttribute('aria-hidden', 'true')
  tooltipEl.style.position = 'fixed'
  tooltipEl.style.pointerEvents = 'none'
  tooltipEl.style.zIndex = '5000'
  tooltipEl.style.opacity = '0'
  tooltipEl.style.visibility = 'hidden'

  const bubbleEl = document.createElement('div')
  bubbleEl.className = 'dashboard-global-tooltip-bubble'
  const arrowEl = document.createElement('div')
  arrowEl.className = 'dashboard-global-tooltip-arrow'
  tooltipEl.appendChild(bubbleEl)
  tooltipEl.appendChild(arrowEl)
  document.body.appendChild(tooltipEl)

  const getEligibleElement = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null
    const el = target.closest<HTMLElement>('[data-dashboard-tooltip]')
    if (!el) return null
    if (el.hasAttribute('data-tooltip-skip')) return null
    const text = el.getAttribute('data-dashboard-tooltip')?.trim()
    if (!text) return null
    return el
  }

  const findActiveTooltipHost = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null
    let el: Element | null = target
    while (el) {
      if (el instanceof HTMLElement && el === activeEl) return el
      el = el.parentElement
    }
    return null
  }

  const positionTooltip = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const tooltipRect = tooltipEl.getBoundingClientRect()
    const viewportPadding = 8
    const gap = 8

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding)
    )

    let top = rect.bottom + gap
    const fitsBelow = top + tooltipRect.height + viewportPadding <= window.innerHeight
    if (!fitsBelow) {
      top = Math.max(viewportPadding, rect.top - tooltipRect.height - gap)
      arrowEl.style.top = '100%'
      arrowEl.style.bottom = 'auto'
      arrowEl.style.transform = 'translateX(-50%)'
      arrowEl.style.borderLeft = '5px solid transparent'
      arrowEl.style.borderRight = '5px solid transparent'
      arrowEl.style.borderTop = '5px solid rgb(17 24 39)'
      arrowEl.style.borderBottom = '0'
    } else {
      arrowEl.style.bottom = '100%'
      arrowEl.style.top = 'auto'
      arrowEl.style.transform = 'translateX(-50%)'
      arrowEl.style.borderLeft = '5px solid transparent'
      arrowEl.style.borderRight = '5px solid transparent'
      arrowEl.style.borderBottom = '5px solid rgb(17 24 39)'
      arrowEl.style.borderTop = '0'
    }

    const anchorCenterX = rect.left + rect.width / 2
    const arrowLeft = Math.max(12, Math.min(tooltipRect.width - 12, anchorCenterX - left))
    arrowEl.style.left = `${arrowLeft}px`
    tooltipEl.style.left = `${Math.round(left)}px`
    tooltipEl.style.top = `${Math.round(top)}px`
  }

  const showTooltip = (text: string, el: HTMLElement) => {
    bubbleEl.textContent = text
    tooltipEl.style.visibility = 'visible'
    tooltipEl.style.opacity = '1'
    requestAnimationFrame(() => positionTooltip(el))
  }

  const hideTooltip = () => {
    tooltipEl.style.opacity = '0'
    tooltipEl.style.visibility = 'hidden'
  }

  const activate = (el: HTMLElement) => {
    const text = el.getAttribute('data-dashboard-tooltip')?.trim()
    if (!text) return
    if (activeEl && activeEl !== el) {
      deactivate(activeEl)
    }
    activeEl = el
    showTooltip(text, el)
  }

  const deactivate = (el: HTMLElement) => {
    if (activeEl !== el) return
    activeEl = null
    hideTooltip()
  }

  const onMouseOver = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Node)) return

    if (activeEl && !activeEl.contains(target)) {
      deactivate(activeEl)
    }

    const el = getEligibleElement(event.target)
    if (!el) return
    if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return
    activate(el)
  }

  const onMouseOut = (event: MouseEvent) => {
    if (!activeEl) return
    const rt = event.relatedTarget
    if (!(rt instanceof Node) || !document.documentElement.contains(rt)) {
      deactivate(activeEl)
      return
    }
    const host = findActiveTooltipHost(event.target)
    if (!host || host !== activeEl) return
    if (!host.contains(rt)) {
      deactivate(host)
    }
  }

  const onFocusIn = (event: FocusEvent) => {
    const el = getEligibleElement(event.target)
    if (!el) return
    activate(el)
  }

  const onFocusOut = (event: FocusEvent) => {
    const el = findActiveTooltipHost(event.target)
    if (!el) return
    const rt = event.relatedTarget
    if (rt instanceof Node && el.contains(rt)) return
    deactivate(el)
  }

  const onWindowChange = () => {
    if (activeEl) {
      positionTooltip(activeEl)
    }
  }

  document.addEventListener('mouseover', onMouseOver, false)
  document.addEventListener('mouseout', onMouseOut, true)
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('focusout', onFocusOut, true)
  window.addEventListener('scroll', onWindowChange, true)
  window.addEventListener('resize', onWindowChange)
})
