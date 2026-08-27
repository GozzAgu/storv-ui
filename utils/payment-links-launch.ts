/** Shown on marketing pages (landing, plans copy). */
export const PAYMENT_LINKS_MARKETING_STATUS = 'Live'

/** When true, the dashboard payment links page shows a coming-soon screen. */
export const PAYMENT_LINKS_COMING_SOON = false

/** When true, the iOS/Android app also shows coming-soon in nav badges and summary cards. */
export const PAYMENT_LINKS_NATIVE_COMING_SOON = true

export function isPaymentLinksComingSoon(): boolean {
  return PAYMENT_LINKS_COMING_SOON
}

export function isPaymentLinksNativeComingSoon(): boolean {
  return PAYMENT_LINKS_NATIVE_COMING_SOON
}
