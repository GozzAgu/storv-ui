import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { getPaymentsV2Gate } from '~/server/utils/payments/config'
import { recordManualPayments } from '~/server/utils/payments/service'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import {
  applyStorefrontInquiryStatus,
  STOREFRONT_INQUIRY_TARGETS,
} from '~/server/utils/storefront-inquiry-status'
import type { StorefrontInquiryStatus } from '~/types/storefront'

/** Business confirm / reject / complete / cancel for a storefront request. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const inquiryId = String(getRouterParam(event, 'id') || '').trim()
  if (!inquiryId) throw createError({ statusCode: 400, message: 'Missing inquiry id' })

  const body = (await readBody(event)) || {}
  const ownerUserId = String(body.ownerUserId || '').trim()
  const storeId = String(body.storeId || '').trim()
  const status = String(body.status || '').trim() as StorefrontInquiryStatus
  const resolveNote =
    body.resolveNote != null ? String(body.resolveNote).trim().slice(0, 500) : undefined
  const paymentMethod =
    typeof body.paymentMethod === 'string'
      ? body.paymentMethod.replace(/\s+/g, ' ').trim().slice(0, 60)
      : ''

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  if (!STOREFRONT_INQUIRY_TARGETS.includes(status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const paymentsV2 = (await getPaymentsV2Gate()).enabled
  const result = await applyStorefrontInquiryStatus(adminDb, {
    ownerUserId,
    storeId,
    inquiryId,
    actorUid: auth.uid,
    status,
    resolveNote,
    paymentMethod,
    paymentsV2,
  })

  // Payments V2 keeps payments as their own records (confirmations, audit), so the
  // in-person payment is recorded the same way the sale screen does it.
  let paymentRecorded: boolean | undefined
  if (result.paidInPerson && paymentsV2 && result.receiptId && result.saleTotal > 0) {
    try {
      const access = await resolvePaymentsAccess(adminDb, auth.uid, ownerUserId, storeId)
      await recordManualPayments(adminDb, access, {
        receiptId: result.receiptId,
        tenders: [{ methodLabel: paymentMethod, amountKobo: Math.round(result.saleTotal * 100) }],
      })
      paymentRecorded = true
    } catch (err) {
      paymentRecorded = false
      console.error(
        JSON.stringify({
          tag: 'storefront-complete-payment-not-recorded',
          receiptId: result.receiptId,
          error: err instanceof Error ? err.message : 'unknown',
        })
      )
    }
  }

  return {
    success: true,
    id: inquiryId,
    status,
    receiptId: result.receiptId,
    receiptNumber: result.receiptNumber,
    folderId: result.folderId,
    ...(paymentRecorded !== undefined ? { paymentRecorded } : {}),
  }
})
