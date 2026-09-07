import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { assertMerchantPayoutConnected } from '~/server/utils/payment-link-create'
import { createStorefrontCheckoutPaymentLink } from '~/server/utils/storefront-checkout-hold'
import { normalizeEntityName } from '~/utils/capitalize-text'
import { normalizeInquiryPhone, isValidInquiryPhone } from '~/utils/storefront-inquiry'
import type { StorefrontPublicProfile } from '~/types/storefront'

/**
 * Guest storefront checkout → creates a payment link for one listed item,
 * soft-holds the listing + inventory in one Firestore transaction, redirects
 * client to /pay/{token}. Inventory ids stay server-side only.
 */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
    .trim()
    .toLowerCase()
  if (!slug) throw createError({ statusCode: 400, message: 'Missing store slug' })

  await assertRateLimit(event, { id: 'storefront-checkout', limit: 8, windowMs: 60_000 })

  const body = (await readBody(event)) || {}
  const listingId = String(body.listingId || '').trim()
  const customerName = normalizeEntityName(String(body.customerName || '').trim())
  const customerPhone = normalizeInquiryPhone(String(body.customerPhone || ''))
  const customerEmail = String(body.customerEmail || '')
    .trim()
    .toLowerCase()

  if (!listingId) throw createError({ statusCode: 400, message: 'Missing product' })
  if (customerName.length < 2) {
    throw createError({ statusCode: 400, message: 'Enter your name' })
  }
  if (customerPhone && !isValidInquiryPhone(customerPhone)) {
    throw createError({ statusCode: 400, message: 'Enter a valid phone number' })
  }
  if (customerEmail && !customerEmail.includes('@')) {
    throw createError({ statusCode: 400, message: 'Enter a valid email' })
  }

  const adminDb = getAdminFirestore()
  const profileSnap = await adminDb.collection('storefronts').doc(slug).get()
  if (!profileSnap.exists) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  const profile = profileSnap.data() as StorefrontPublicProfile
  if (!profile.isPublished) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  if (profile.allowOnlineCheckout === false) {
    throw createError({ statusCode: 400, message: 'Online checkout is not enabled for this store' })
  }

  const ownerUid = String(profile.ownerUid || '')
  const storeId = String(profile.storeId || '')
  if (!ownerUid || !storeId) {
    throw createError({ statusCode: 500, message: 'Storefront is misconfigured' })
  }

  await assertMerchantPayoutConnected(adminDb, ownerUid, storeId)

  const businessName = String(profile.displayName || 'Storvv merchant')

  const { token, invoiceNumber, amountKobo } = await createStorefrontCheckoutPaymentLink({
    adminDb,
    ownerUserId: ownerUid,
    storeId,
    slug,
    listingId,
    businessName,
    customerName,
    customerPhone,
    customerEmail,
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
    url: `${origin}/pay/${token}`,
  }
})
