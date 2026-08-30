export type ProductAnalyticsEvent =
  | 'sign_up'
  | 'login'
  | 'onboarding_complete'
  | 'first_inventory_item'
  | 'first_sale'
  | 'upgrade_started'
  | 'upgrade_success'
  | 'subscription_cancel'
  | 'payment_link_created'
  | 'receipt_email_sent'
  | 'nps_submitted'
  | 'churn_survey_submitted'
  | 'staff_invite_sent'

/** Typed wrapper around the Nuxt plugin's trackEvent helper. */
export function useProductAnalytics() {
  const nuxtApp = useNuxtApp()
  const trackEvent = nuxtApp.$trackEvent as
    | ((name: ProductAnalyticsEvent, params?: Record<string, unknown>) => void)
    | undefined

  return {
    trackEvent: (name: ProductAnalyticsEvent, params?: Record<string, unknown>) => {
      trackEvent?.(name, params)
    },
  }
}
