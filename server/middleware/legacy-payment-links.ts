import { createError, defineEventHandler } from 'h3'
import {
  isLegacyPaymentLinkRoute,
  LEGACY_PAYMENT_LINKS_GONE_MESSAGE,
  legacyPaymentLinksEnabled,
} from '~/server/utils/legacy-payment-links'

export default defineEventHandler((event) => {
  if (legacyPaymentLinksEnabled()) return
  if (isLegacyPaymentLinkRoute(event.path || '', event.method)) {
    throw createError({ statusCode: 410, message: LEGACY_PAYMENT_LINKS_GONE_MESSAGE })
  }
})
