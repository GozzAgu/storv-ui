import { useHaptics } from '~/composables/useHaptics'
import { isCapacitorNative } from '~/utils/capacitor-env'

/** Checkout discounts above this percentage of the unit price need confirmation on the device. */
export const STAFF_DISCOUNT_LIMIT_PERCENT = 10

export type SensitiveAction = 'refund' | 'void' | 'discount' | 'export-data' | 'reveal-customer'

const REASONS: Record<SensitiveAction, string> = {
  refund: 'Confirm this refund',
  void: 'Confirm cancelling this order',
  discount: 'Approve a discount above the staff limit',
  'export-data': 'Export store data, including customers and costs',
  'reveal-customer': 'Show customer contact details',
}

/**
 * Face ID / Touch ID (or device passcode) confirmation before high-risk actions in the
 * native app. On the web it resolves immediately: role permissions already gate these
 * actions there and browsers have no equivalent device check.
 */
export function useSensitiveAction() {
  const haptics = useHaptics()

  async function confirm(action: SensitiveAction): Promise<boolean> {
    if (!isCapacitorNative()) return true

    try {
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
      await BiometricAuth.authenticate({
        reason: REASONS[action],
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use passcode',
        androidTitle: 'Confirm it’s you',
        androidSubtitle: REASONS[action],
      })
      return true
    } catch {
      void haptics.notify('warning')
      return false
    }
  }

  return { confirm }
}
