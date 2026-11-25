import { onBeforeUnmount, onMounted } from 'vue'

/** Cards that carry the cursor spotlight and lit edge (styled in marketing-future.css). */
export const SPOTLIGHT_SELECTOR =
  '.mk-card, .mk-plan, .mk-contact-card, .mkf__card, .mkc__card, .mko__card'

/**
 * Tells the card under a mouse pointer where the pointer is, as `--mx` / `--my`, so its
 * spotlight and edge can follow it. One listener for the page; touch and pen are ignored.
 */
export function useCardSpotlight() {
  let frame = 0
  let last: PointerEvent | null = null

  function apply() {
    frame = 0
    const event = last
    if (!event) return
    const card = (event.target as Element | null)?.closest?.<HTMLElement>(SPOTLIGHT_SELECTOR)
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    card.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }

  function onMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    last = event
    if (!frame) frame = requestAnimationFrame(apply)
  }

  onMounted(() => document.addEventListener('pointermove', onMove, { passive: true }))
  onBeforeUnmount(() => {
    document.removeEventListener('pointermove', onMove)
    if (frame) cancelAnimationFrame(frame)
  })
}
