/** Shared payment links visibility rules (web + iOS/Android). */

export function shouldShowNativePaymentLinksTeaser(options: {
  canUsePaymentLinksExperience: boolean
  paymentLinksNativeComingSoon: boolean
  isNativeShell: boolean
}): boolean {
  if (!options.canUsePaymentLinksExperience) return false
  if (!options.paymentLinksNativeComingSoon) return false
  return options.isNativeShell
}

export function shouldShowPaymentLinksSummary(options: {
  canShowPaymentLinksFeature: boolean
  showNativeTeaser: boolean
}): boolean {
  return options.canShowPaymentLinksFeature || options.showNativeTeaser
}
