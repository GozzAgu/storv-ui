import { computed } from 'vue'

/** Viewport inset and mount target for fixed dropdown menus. */
export function useDashboardFloatingMenu() {
  const menuViewportPadding = computed(() => 8)

  const menuTeleportTarget = computed(() => 'body')

  return {
    menuViewportPadding,
    menuTeleportTarget,
  }
}
