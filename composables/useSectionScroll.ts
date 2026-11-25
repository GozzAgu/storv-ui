/**
 * Shared smooth-scroll helpers for the marketing site.
 *
 * `scrollToSection` only works for an id that exists on the CURRENT page. Nav
 * items that point at homepage-only sections (FAQ, pricing teaser, etc.) use
 * `goToSection` instead, which navigates to `/#id` first when needed - the
 * homepage's own onMounted hash handling then finishes the scroll.
 */
import { getSmoothScroll } from '~/composables/useSmoothScroll'

export function useSectionScroll() {
  const route = useRoute()

  function scrollToSection(sectionId: string) {
    if (!import.meta.client) return
    const element = document.getElementById(sectionId)
    if (!element) return
    const lenis = getSmoothScroll()
    if (lenis) {
      // Lenis ignores CSS scroll-margin, so read the section's own offset for the sticky header
      const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0
      lenis.scrollTo(element, { offset: -margin })
    } else {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function scrollToTop() {
    if (!import.meta.client) return
    const lenis = getSmoothScroll()
    if (lenis) lenis.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Scroll to `sectionId` if we're already on `/`; otherwise navigate there first. */
  function goToSection(sectionId: string) {
    if (route.path === '/') {
      scrollToSection(sectionId)
    } else {
      return navigateTo(`/#${sectionId}`)
    }
  }

  return { scrollToSection, scrollToTop, goToSection }
}
