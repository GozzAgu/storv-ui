import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Client-only `matchMedia('(min-width: Xpx)')`. False on SSR / before mount.
 * Use 1024 for Tailwind `lg`.
 */
export function useMinWidthQuery(minWidthPx: number) {
  const matches = ref(false)
  let mq: MediaQueryList | null = null
  let onChange: (() => void) | null = null

  onMounted(() => {
    mq = window.matchMedia(`(min-width: ${minWidthPx}px)`)
    onChange = () => {
      matches.value = mq!.matches
    }
    onChange()
    mq.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    if (mq && onChange) mq.removeEventListener('change', onChange)
  })

  return matches
}
