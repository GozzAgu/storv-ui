import { computed, ref } from 'vue'
import { useIsCapacitorIos } from '~/composables/useNativeTableLayout'
import { applyIosSizeTier, isTabletTier, type IosSizeTier } from '~/utils/ios-size-tier'

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

/** Current width tier, kept in sync by the Capacitor plugin (`startIosSizeTierTracking`). */
export const iosSizeTier = ref<IosSizeTier>('phone')

/**
 * Compact (iPhone) vs comfortable (iPad) density for native iOS chrome.
 * Web desktop stays on the default compact control unless forced.
 */
export function useIosLayoutSize() {
  const { isCapacitorIos } = useIsCapacitorIos()
  const isIpadLayout = computed(() => isTabletTier(iosSizeTier.value))

  function refresh() {
    if (import.meta.client && typeof window !== 'undefined') {
      iosSizeTier.value = applyIosSizeTier()
    }
  }

  const bulkSelectSize = computed<'compact' | 'comfortable'>(() =>
    isCapacitorIos.value && isIpadLayout.value ? 'comfortable' : 'compact'
  )

  return { sizeTier: iosSizeTier, isIpadLayout, bulkSelectSize, refreshIosLayoutSize: refresh }
}
