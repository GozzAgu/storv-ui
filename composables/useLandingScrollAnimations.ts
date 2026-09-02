/**
 * Fade/slide-in reveal for `.scroll-animate[data-section-id]` elements as they
 * enter the viewport. Call from each marketing page's `onMounted` (not the
 * shared layout) since every page observes a different set of sections.
 */
export function useLandingScrollAnimations() {
  function setup() {
    if (!import.meta.client) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -52px 0px',
      }
    )

    const animateElements = document.querySelectorAll('.scroll-animate[data-section-id]')
    animateElements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
      if (isInViewport) {
        el.classList.add('visible')
      }
      observer.observe(el)
    })

    return observer
  }

  return { setup }
}
