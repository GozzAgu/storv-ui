import { computed } from 'vue'
import { useCapacitorNativeApp } from '~/composables/useCapacitorNativeApp'

/**
 * Extra viewport inset for fixed dropdowns on Capacitor so menus clear the bottom tab bar.
 */
export function useDashboardFloatingMenu() {
  const { isNativeApp } = useCapacitorNativeApp()

  const menuViewportPadding = computed(() => (isNativeApp.value ? 72 : 8))

  const menuTeleportTarget = computed(() => 'body')

  return {
    isNativeApp,
    menuViewportPadding,
    menuTeleportTarget,
  }
}
