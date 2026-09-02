import { logEvent, type Analytics } from 'firebase/analytics'

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

const PRODUCT_EVENTS: ProductAnalyticsEvent[] = [
  'sign_up',
  'login',
  'onboarding_complete',
  'first_inventory_item',
  'first_sale',
  'upgrade_started',
  'upgrade_success',
  'subscription_cancel',
  'payment_link_created',
  'receipt_email_sent',
  'nps_submitted',
  'churn_survey_submitted',
  'staff_invite_sent',
]

function isProductEvent(name: string): name is ProductAnalyticsEvent {
  return (PRODUCT_EVENTS as string[]).includes(name)
}

export default defineNuxtPlugin((nuxtApp) => {
  const trackEvent = (name: ProductAnalyticsEvent, params?: Record<string, unknown>) => {
    if (!isProductEvent(name)) return

    const analytics = nuxtApp.$firebaseAnalytics as Analytics | undefined
    if (analytics) {
      try {
        logEvent(analytics, name, params)
      } catch (error) {
        if (import.meta.dev) console.warn('[analytics]', name, error)
      }
    }

    if (import.meta.dev) {
      console.info('[analytics]', name, params ?? {})
    }
  }

  return {
    provide: {
      trackEvent,
    },
  }
})
