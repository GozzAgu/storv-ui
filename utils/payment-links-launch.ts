/** Shown on marketing pages (landing, plans copy). */
export const PAYMENT_LINKS_MARKETING_STATUS = 'In progress'

/** When true, the iOS/Android app shows a coming-soon screen instead of Paystack setup. */
export const PAYMENT_LINKS_NATIVE_COMING_SOON = true

export function isPaymentLinksNativeComingSoon(): boolean {
  return PAYMENT_LINKS_NATIVE_COMING_SOON
}
