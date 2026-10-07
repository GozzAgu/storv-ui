import { definePaymentsRoute } from '~/server/utils/payments/http'
import { setMemberPaymentPermissions } from '~/server/utils/payments/service'
import { readTotpCodeFromRequest, requireFreshTotp } from '~/server/utils/store-auth'

/** Owner grants or removes payments.view / confirm / refund for a member. Audit-logged. */
export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:permissions', limit: 20, windowMs: 600_000 } },
  async ({ event, db, auth, access, input }) => {
    if (access.isOwner) await requireFreshTotp(auth, await readTotpCodeFromRequest(event))
    return {
      permissions: await setMemberPaymentPermissions(db, access, {
        memberUid: input.memberUid,
        permissions: input.permissions,
      }),
    }
  }
)
