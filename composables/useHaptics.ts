import { isCapacitorNative } from '~/utils/capacitor-env'

type ImpactStyleName = 'light' | 'medium' | 'heavy'

/**
 * Lightweight haptic feedback in the Capacitor app. No-ops on web or without the plugin.
 */
export function useHaptics() {
  const enabled = () => import.meta.client && isCapacitorNative()

  async function impact(style: ImpactStyleName = 'light') {
    if (!enabled()) return
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
    if (!enabled()) return
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
    if (!enabled()) return
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
