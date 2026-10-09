import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { getPaystackSecret, paystackRequest } from '~/server/utils/payment-links'
import { assertDocId } from '~/server/utils/payments/access'
import { requirePaystackLiveAllowed } from '~/server/utils/payments/config'
import { toHttpError } from '~/server/utils/payments/http'
import { alertPayoutChanged } from '~/server/utils/payments/notify'
import {
  connectPayout,
  normalizeAccountInput,
  type PaystackCall,
} from '~/server/utils/payments/payout'
import { sendViaResend } from '~/server/utils/staff-invite-email'

interface Body {
  ownerUserId?: unknown
  storeId?: unknown
  businessName?: unknown
  bankCode?: unknown
  bankName?: unknown
  accountNumber?: unknown
  totpCode?: unknown
}

/**
 * Store owner only, with two-factor on and a fresh code: connect or replace the payout bank.
 * The account name comes from Paystack, never the client; an existing subaccount is updated in
 * place; the change is audit-logged and emailed to the owner.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event, { requireVerifiedEmail: true })
  await assertRateLimit(event, {
    id: 'payout:connect',
    limit: 5,
    windowMs: 60 * 60_000,
    uid: auth.uid,
    requireDistributed: true,
  })
  const body = ((await readBody<Body>(event).catch(() => null)) ?? {}) as Body

  try {
    const ownerId = assertDocId(body.ownerUserId, 'ownerUserId')
    const storeId = assertDocId(body.storeId, 'storeId')
    if (auth.uid !== ownerId) {
      throw createError({
        statusCode: 403,
        message: 'Only the store owner can change the payout account',
        data: { code: 'OWNER_ONLY' },
      })
    }
    if (!auth.twoFactorEnabled) {
      throw createError({
        statusCode: 403,
        message: 'Turn on two-factor authentication before connecting a payout account',
        data: { code: 'TFA_SETUP_REQUIRED' },
      })
    }
    await requireFreshTotp(auth, typeof body.totpCode === 'string' ? body.totpCode : undefined)
    const { bankCode, accountNumber } = normalizeAccountInput(body)

    const db = getAdminFirestore()
    const storeSnap = await db.collection('users').doc(ownerId).collection('stores').doc(storeId).get()
    if (!storeSnap.exists) throw createError({ statusCode: 404, message: 'Not found' })
    await requirePaystackLiveAllowed()

    const secretKey = getPaystackSecret(useRuntimeConfig())
    const paystack: PaystackCall = (path, init) =>
      paystackRequest(path, { method: init.method, body: init.body, secretKey })

    const result = await connectPayout(db, paystack, {
      ownerId,
      storeId,
      actorUid: auth.uid,
      bankCode,
      bankName: typeof body.bankName === 'string' ? body.bankName : '',
      accountNumber,
      businessName: typeof body.businessName === 'string' ? body.businessName : '',
    })

    await alertPayoutChanged(db, sendViaResend, {
      ownerId,
      storeId,
      ownerEmail: auth.email,
      bankName: result.payout.bankName,
      last4: result.payout.accountNumberLast4,
      previousLast4: result.previousLast4,
      replaced: result.replaced,
    })
    if (!result.saved) {
      throw createError({
        statusCode: 500,
        message: 'Paystack accepted the new account but Storvv could not save it. Please try again.',
        data: { code: 'PAYOUT_SAVE_FAILED' },
      })
    }

    return { success: true, payout: result.payout }
  } catch (err) {
    throw toHttpError(err)
  }
})
