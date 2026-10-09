import { defineEventHandler, readBody } from 'h3'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import { getPaystackSecret, paystackRequest } from '~/server/utils/payment-links'
import { assertDocId } from '~/server/utils/payments/access'
import { requirePaystackLiveAllowed } from '~/server/utils/payments/config'
import { toHttpError } from '~/server/utils/payments/http'
import {
  normalizeAccountInput,
  resolveAccountName,
  type PaystackCall,
} from '~/server/utils/payments/payout'

interface Body {
  ownerUserId?: unknown
  storeId?: unknown
  accountNumber?: unknown
  bankCode?: unknown
}

/**
 * Owner or manager of the named store: look up an account holder's name before connecting it
 * for payouts. This is a bank-name lookup, so it is store-scoped and rate limited.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event, { requireVerifiedEmail: true })
  await assertRateLimit(event, {
    id: 'payout:resolve-account',
    limit: 10,
    windowMs: 10 * 60_000,
    uid: auth.uid,
    requireDistributed: true,
  })
  const body = ((await readBody<Body>(event).catch(() => null)) ?? {}) as Body

  try {
    await requireStoreManageAccess(
      auth.uid,
      assertDocId(body.ownerUserId, 'ownerUserId'),
      assertDocId(body.storeId, 'storeId')
    )
    const { bankCode, accountNumber } = normalizeAccountInput(body)
    await requirePaystackLiveAllowed()
    const secretKey = getPaystackSecret(useRuntimeConfig())
    const paystack: PaystackCall = (path, init) =>
      paystackRequest(path, { method: init.method, body: init.body, secretKey })
    const accountName = await resolveAccountName(paystack, bankCode, accountNumber)
    return { success: true, accountName }
  } catch (err) {
    throw toHttpError(err)
  }
})
