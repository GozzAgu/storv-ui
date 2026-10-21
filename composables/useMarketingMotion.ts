import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/** One switch for every moving illustration on the marketing pages (WCAG 2.2.2). */
const paused = ref(false)
const reduced = ref(false)
let mediaBound = false

function bindReducedMotion() {
  if (mediaBound || typeof window === 'undefined') return
  mediaBound = true
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = media.matches
  media.addEventListener('change', (event) => (reduced.value = event.matches))
}

export function useMarketingMotion() {
  onMounted(bindReducedMotion)
  return {
    /** The visitor pressed pause. */
    paused,
    /** The visitor asked their system for less motion. */
    reduced,
    /** Nothing should move. */
    still: computed(() => paused.value || reduced.value),
    toggle: () => (paused.value = !paused.value),
  }
}

/**
 * Runs an SVG's own animations only while it is on screen and motion is allowed, so off-screen
 * illustrations cost nothing and pause/reduced motion freeze them on a tidy frame.
 */
export function useSvgMotion(svg: Ref<SVGSVGElement | null>) {
  const { still } = useMarketingMotion()
  const visible = ref(false)
  let observer: IntersectionObserver | null = null

  function apply() {
    const el = svg.value
    if (!el || typeof el.pauseAnimations !== 'function') return
    if (still.value || !visible.value) el.pauseAnimations()
    else el.unpauseAnimations()
  }

  onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
      visible.value = !!entry?.isIntersecting
      apply()
    })
    if (svg.value) observer.observe(svg.value)
    apply()
  })
  watch(still, apply)
  onBeforeUnmount(() => observer?.disconnect())
  return { visible }
}
