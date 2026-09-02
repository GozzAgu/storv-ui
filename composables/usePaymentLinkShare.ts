import { ref } from 'vue'
import {
  buildPaymentLinkShareMessage,
  openWhatsAppPaymentLink,
  sharePaymentLink,
  type PaymentLinkShareInput,
  type PaymentLinkShareResult,
} from '~/utils/payment-link-share'

/** UI helper for payment link share actions (native sheet + WhatsApp fallback). */
export function usePaymentLinkShare() {
  const sharing = ref(false)
  const lastResult = ref<PaymentLinkShareResult | null>(null)

  async function share(link: PaymentLinkShareInput): Promise<PaymentLinkShareResult> {
    sharing.value = true
    try {
      const result = await sharePaymentLink(link)
      lastResult.value = result
      return result
    } finally {
      sharing.value = false
    }
  }

  function shareWhatsApp(link: PaymentLinkShareInput) {
    openWhatsAppPaymentLink(link)
    lastResult.value = 'whatsapp'
  }

  return {
    sharing,
    lastResult,
    share,
    shareWhatsApp,
    buildMessage: buildPaymentLinkShareMessage,
  }
}
