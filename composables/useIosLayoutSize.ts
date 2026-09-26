import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useIsCapacitorIos } from '~/composables/useNativeTableLayout'

/** iPad / large-tablet layout (Capacitor iOS or iPadOS Safari). */
export function isIpadLikeViewport(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  if (/iPad/i.test(ua)) return true

  // iPadOS 13+ reports as MacIntel with touch
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true

  const isCapIos = document.documentElement.classList.contains('capacitor-ios')
  if (isCapIos && window.matchMedia('(min-width: 768px)').matches) return true

  return false
}

/**
 * Compact (iPhone) vs comfortable (iPad) density for native iOS chrome.
 * Web desktop stays on the default compact control unless forced.
 */
export function useIosLayoutSize() {
  const { isCapacitorIos } = useIsCapacitorIos()
  const isIpadLayout = ref(false)

  function refresh() {
    isIpadLayout.value = isIpadLikeViewport()
    if (import.meta.client && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('capacitor-ipad', isIpadLayout.value)
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      refresh()
      const mq = window.matchMedia('(min-width: 768px)')
      mq.addEventListener('change', refresh)
      onUnmounted(() => mq.removeEventListener('change', refresh))
    })
  }

  const bulkSelectSize = computed<'compact' | 'comfortable'>(() =>
    isCapacitorIos.value && isIpadLayout.value ? 'comfortable' : 'compact'
  )

  return { isIpadLayout, bulkSelectSize, refreshIosLayoutSize: refresh }
}
