import { isCapacitorNative } from '~/utils/capacitor-env'
import {
  isPaymentLinksComingSoon,
  isPaymentLinksNativeComingSoon,
  PAYMENT_LINKS_MARKETING_STATUS,
} from '~/utils/payment-links-launch'
import {
  shouldShowNativePaymentLinksTeaser,
  shouldShowPaymentLinksSummary,
} from '~/utils/payment-links-experience'

function isNativeShellClient(): boolean {
  if (import.meta.server) return false
  return isCapacitorNative()
}

export function usePaymentLinksLaunch() {
  const { isNativeApp } = useCapacitorNativeApp()
  const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
  const { canUse: canUseBusinessCapability } = useBusinessCapabilities()

  const canUsePaymentLinksExperience = computed(() =>
    canUseBusinessCapability('paymentLinks')
  )

  const canShowPaymentLinksFeature = computed(
    () =>
      canUsePaymentLinksExperience.value && canUseSubscriptionFeature('payment_links')
  )

  const showPaymentLinksComingSoon = computed(() => isPaymentLinksComingSoon())

  const showNativeComingSoon = computed(() =>
    shouldShowNativePaymentLinksTeaser({
      canUsePaymentLinksExperience: canUsePaymentLinksExperience.value,
      paymentLinksNativeComingSoon: isPaymentLinksNativeComingSoon(),
      isNativeShell: isNativeApp.value || isNativeShellClient(),
    })
  )

  const canShowPaymentLinksSummary = computed(() =>
    shouldShowPaymentLinksSummary({
      canShowPaymentLinksFeature: canShowPaymentLinksFeature.value,
      showNativeTeaser: showNativeComingSoon.value,
    })
  )

  return {
    canUsePaymentLinksExperience,
    canShowPaymentLinksFeature,
    canShowPaymentLinksSummary,
    showPaymentLinksComingSoon,
    showNativeComingSoon,
    marketingStatus: PAYMENT_LINKS_MARKETING_STATUS,
  }
}
