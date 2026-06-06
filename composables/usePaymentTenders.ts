import { mergePaymentTenders, DEFAULT_PAYMENT_TENDERS } from '~/utils/payment-tenders'

export function usePaymentTenders() {
  const userStore = useUserStore()

  const paymentTenderOptions = computed(() => {
    const custom = userStore.userData?.storeDetails?.settings?.payment?.paymentMethods
    return mergePaymentTenders(custom)
  })

  return {
    paymentTenderOptions,
    defaultPaymentTenders: DEFAULT_PAYMENT_TENDERS,
  }
}
