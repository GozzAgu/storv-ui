import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue'

function getReducedMotionPreference(): boolean {
  if (!import.meta.client || typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Shared reduced-motion flag for landing micro-interactions. */
export function useLandingReducedMotion() {
  const prefersReducedMotion = ref(getReducedMotionPreference())

  onMounted(() => {
    if (!import.meta.client) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      prefersReducedMotion.value = mq.matches
    }
    onChange()
    mq.addEventListener('change', onChange)
    onBeforeUnmount(() => mq.removeEventListener('change', onChange))
  })

  return prefersReducedMotion
}

/**
 * Pointer-driven spotlight + mild parallax for the landing hero.
 * Sets CSS vars --hero-mx / --hero-my (normalized -0.5..0.5) and spotlight coords.
 */
export function useLandingHeroMotion(root: Ref<HTMLElement | null>) {
  const prefersReducedMotion = useLandingReducedMotion()
  const mx = ref(0)
  const my = ref(0)
  const spotlightX = ref(50)
  const spotlightY = ref(40)
  let raf = 0
  let targetX = 0
  let targetY = 0

  const styleVars = computed(() => ({
    '--hero-mx': String(mx.value),
    '--hero-my': String(my.value),
    '--hero-spot-x': `${spotlightX.value}%`,
    '--hero-spot-y': `${spotlightY.value}%`,
  }))

  function tick() {
    raf = 0
    mx.value += (targetX - mx.value) * 0.12
    my.value += (targetY - my.value) * 0.12
    if (Math.abs(targetX - mx.value) > 0.001 || Math.abs(targetY - my.value) > 0.001) {
      raf = requestAnimationFrame(tick)
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (prefersReducedMotion.value || !root.value) return
    const rect = root.value.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const nx = (event.clientX - rect.left) / rect.width
    const ny = (event.clientY - rect.top) / rect.height
    targetX = nx - 0.5
    targetY = ny - 0.5
    spotlightX.value = Math.min(100, Math.max(0, nx * 100))
    spotlightY.value = Math.min(100, Math.max(0, ny * 100))
    if (!raf) raf = requestAnimationFrame(tick)
  }

  function onPointerLeave() {
    targetX = 0
    targetY = 0
    spotlightX.value = 50
    spotlightY.value = 40
    if (!raf) raf = requestAnimationFrame(tick)
  }

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  return {
    prefersReducedMotion,
    styleVars,
    onPointerMove,
    onPointerLeave,
  }
}

/** Count from 0 to `end` once when `active` becomes true. */
export function useLandingCountUp(end: number, active: Ref<boolean>, durationMs = 1100) {
  const prefersReducedMotion = useLandingReducedMotion()
  const value = ref(0)
  let started = false
  let raf = 0

  function run() {
    if (started || !active.value) return
    started = true
    if (prefersReducedMotion.value) {
      value.value = end
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      value.value = Math.round(end * eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  watch(
    active,
    (isActive) => {
      if (isActive) run()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  return value
}
