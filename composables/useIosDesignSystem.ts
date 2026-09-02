import { computed } from 'vue'
import { useIsCapacitorIos } from '~/composables/useNativeTableLayout'
import { useIosTypography } from '~/composables/useIosTypography'

/**
 * Shared iOS-native layout and component class names.
 * Use with `useIosTypography()` for text roles.
 */
export function useIosDesignSystem() {
  const { isCapacitorIos } = useIsCapacitorIos()
  const { textClassOr } = useIosTypography()

  const isActive = computed(() => isCapacitorIos.value)

  const pageStackClass = computed(() =>
    isCapacitorIos.value ? 'dash-page-stack dash-page-stack--ios-settings' : 'dash-page-stack'
  )

  const cardClass = computed(() =>
    isCapacitorIos.value ? 'dash-card dash-card--padded ios-glass-card' : 'dash-card dash-card--padded'
  )

  const tableShellClass = computed(() =>
    isCapacitorIos.value ? 'data-table-shell dash-native-table--cards' : 'data-table-shell'
  )

  const primaryButtonClass = 'btn-primary ios-btn'
  const secondaryButtonClass = 'btn-secondary'
  const fabClass = 'ios-fab'

  function titleClass(webFallback = 'text-lg font-semibold text-gray-900 dark:text-gray-100') {
    return textClassOr('largeTitle', webFallback)
  }

  function headlineClass(webFallback = 'text-sm font-semibold text-gray-900 dark:text-gray-100') {
    return textClassOr('headline', webFallback)
  }

  function bodyClass(webFallback = 'text-sm text-gray-600 dark:text-gray-400') {
    return textClassOr('body', webFallback, { secondary: true })
  }

  function captionClass(webFallback = 'text-xs text-gray-500 dark:text-gray-400') {
    return textClassOr('caption', webFallback, { secondary: true })
  }

  return {
    isActive,
    pageStackClass,
    cardClass,
    tableShellClass,
    primaryButtonClass,
    secondaryButtonClass,
    fabClass,
    titleClass,
    headlineClass,
    bodyClass,
    captionClass,
  }
}
