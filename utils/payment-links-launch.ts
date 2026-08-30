/** Shown on marketing pages (landing, plans copy). */
export const PAYMENT_LINKS_MARKETING_STATUS = 'Live'

/** When true, the dashboard payment links page shows a coming-soon screen. */
export const PAYMENT_LINKS_COMING_SOON = false

/** When true, native shows coming-soon teasers instead of the full payment links flow. */
export const PAYMENT_LINKS_NATIVE_COMING_SOON = false

/** Native bottom tab promotes Payment links (Analytics moves to More) when live. */
export function shouldPromoteNativePaymentLinksTab(): boolean {
  return !PAYMENT_LINKS_COMING_SOON && !PAYMENT_LINKS_NATIVE_COMING_SOON
}

export function isPaymentLinksComingSoon(): boolean {
  return PAYMENT_LINKS_COMING_SOON
}

export function isPaymentLinksNativeComingSoon(): boolean {
  return PAYMENT_LINKS_NATIVE_COMING_SOON
}
