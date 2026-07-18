import { isCapacitorNative } from '~/utils/capacitor-env'
import {
  isPaymentLinksComingSoon,
  isPaymentLinksNativeComingSoon,
  PAYMENT_LINKS_MARKETING_STATUS,
} from '~/utils/payment-links-launch'

function isNativeShellClient(): boolean {
  if (import.meta.server) return false
  return isCapacitorNative()
}

export function usePaymentLinksLaunch() {
  const { isNativeApp } = useCapacitorNativeApp()

  const showPaymentLinksComingSoon = computed(() => isPaymentLinksComingSoon())

  const showNativeComingSoon = computed(() => {
    if (!isPaymentLinksNativeComingSoon()) return false
    return isNativeApp.value || isNativeShellClient()
  })

  return {
    showPaymentLinksComingSoon,
    showNativeComingSoon,
    marketingStatus: PAYMENT_LINKS_MARKETING_STATUS,
  }
}
