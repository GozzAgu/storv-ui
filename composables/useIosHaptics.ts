import { useIsCapacitorIos } from '~/composables/useNativeTableLayout'

type ImpactStyleName = 'light' | 'medium' | 'heavy'

/**
 * Lightweight haptic feedback on iOS native. No-ops on web/Android without plugin.
 */
export function useIosHaptics() {
  const { isCapacitorIos } = useIsCapacitorIos()

  async function impact(style: ImpactStyleName = 'light') {
    if (!import.meta.client || !isCapacitorIos.value) return

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      } as const
      await Haptics.impact({ style: map[style] })
    } catch {
      /* plugin unavailable */
    }
  }

  async function selection() {
    if (!import.meta.client || !isCapacitorIos.value) return
    try {
      const { Haptics } = await import('@capacitor/haptics')
      await Haptics.selectionStart()
      await Haptics.selectionChanged()
      await Haptics.selectionEnd()
    } catch {
      /* ignore */
    }
  }

  async function notify(type: 'success' | 'warning' | 'error' = 'success') {
    if (!import.meta.client || !isCapacitorIos.value) return
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics')
      const map = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      } as const
      await Haptics.notification({ type: map[type] })
    } catch {
      /* ignore */
    }
  }

  return { impact, selection, notify }
}
