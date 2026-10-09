import { definePaymentsRoute } from '~/server/utils/payments/http'
import { readPaymentSettings } from '~/server/utils/payments/settings'
import { storeDocRef } from '~/server/utils/payments/audit-log'

/** What the caller may do with payments in this store. 404 when Payments V2 is off. */
export default definePaymentsRoute(
  { method: 'GET', rateLimit: { id: 'payments:access', limit: 120, windowMs: 60_000 } },
  async ({ db, access }) => {
    const settings = await readPaymentSettings(storeDocRef(db, access.ownerId, access.storeId))
    return {
      enabled: true,
      isOwner: access.isOwner,
      canRecord: access.canRecord,
      canView: access.canView,
      canConfirm: access.canConfirm,
      canRefund: access.canRefund,
      settings: access.isOwner ? settings : { cashConfirmation: settings.cashConfirmation },
    }
  }
)
