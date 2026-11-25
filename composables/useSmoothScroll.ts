import { onBeforeUnmount, onMounted } from 'vue'
import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Eased, slightly weighted wheel scrolling for the marketing site (Lenis). Touch scrolling stays
 * native, and visitors who ask for reduced motion keep the browser's own scrolling.
 */
let lenis: Lenis | null = null

/** The running instance, or null (server, reduced motion, or not mounted yet). */
export function getSmoothScroll(): Lenis | null {
  return lenis
}

export function useSmoothScroll() {
  let media: MediaQueryList | null = null

  async function start() {
    if (lenis || media?.matches) return
    const { default: LenisCtor } = await import('lenis')
    if (lenis || media?.matches) return
    lenis = new LenisCtor({
      autoRaf: true,
      lerp: 0.1,
      // Menus, dialogs and anything else that scrolls on its own keep native scrolling
      allowNestedScroll: true,
      prevent: (node) => node.closest('[data-lenis-prevent], [role="dialog"], .mk-menu') !== null,
    })
  }

  function stop() {
    lenis?.destroy()
    lenis = null
  }

  function onMotionChange() {
    if (media?.matches) stop()
    else void start()
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', onMotionChange)
    void start()
  })

  onBeforeUnmount(() => {
    media?.removeEventListener('change', onMotionChange)
    stop()
  })

  return {
    /** Freeze page scrolling (an open menu or dialog), then let it go again. */
    lock: () => lenis?.stop(),
    unlock: () => lenis?.start(),
  }
}
