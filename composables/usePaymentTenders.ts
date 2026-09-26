import { mergePaymentTenders, DEFAULT_PAYMENT_TENDERS } from '~/utils/payment-tenders'

/**
 * Checkout tender labels for the signed-in account.
 * Reads `storeDetails.settings.payment.paymentMethods` (Settings → Payments).
 * Falls back to DEFAULT_PAYMENT_TENDERS when the account has not customized yet.
 */
export function usePaymentTenders() {
  const userStore = useUserStore()

  const paymentTenderOptions = computed(() => {
    const custom = userStore.userData?.storeDetails?.settings?.payment?.paymentMethods
    return mergePaymentTenders(custom)
  })

  const defaultPaymentMethod = computed(() => paymentTenderOptions.value[0] || 'Cash')

  return {
    paymentTenderOptions,
    defaultPaymentMethod,
    defaultPaymentTenders: DEFAULT_PAYMENT_TENDERS,
  }
}
