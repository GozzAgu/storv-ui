import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import { assertMerchantPayoutConnected } from '~/server/utils/payment-link-create'
import { createInquiryPaymentLink } from '~/server/utils/storefront-checkout-hold'

/**
 * Authenticated: create (or reuse) a Paystack payment link for a storefront inquiry
 * and return a shareable /pay/{token} URL.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const inquiryId = String(getRouterParam(event, 'id') || '').trim()
  if (!inquiryId) throw createError({ statusCode: 400, message: 'Missing inquiry id' })

  const body = (await readBody(event)) || {}
  const ownerUserId = String(body.ownerUserId || '').trim()
  const storeId = String(body.storeId || '').trim()
  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  await assertMerchantPayoutConnected(adminDb, ownerUserId, storeId)

  let businessName = String(body.businessName || '').trim()
  if (!businessName) {
    const ownerSnap = await adminDb.collection('users').doc(ownerUserId).get()
    businessName = String(ownerSnap.data()?.name || 'Storvv merchant')
  }

  const { token, invoiceNumber, amountKobo, reused } = await createInquiryPaymentLink({
    adminDb,
    ownerUserId,
    storeId,
    inquiryId,
    businessName,
    createdByUid: auth.uid,
  })

  const config = useRuntimeConfig()
  const appOrigin = String(config.public.appOrigin || '').replace(/\/$/, '')
  const requestOrigin = getRequestURL(event).origin
  const isLocal =
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.includes('0.0.0.0')
  const origin = isLocal ? requestOrigin : appOrigin || requestOrigin

  return {
    success: true,
    token,
    invoiceNumber,
    amount: amountKobo,
    reused,
    url: `${origin}/pay/${token}`,
  }
})
