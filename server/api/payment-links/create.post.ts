import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import { normalizeEntityName } from '~/utils/capitalize-text'
import {
  assertMerchantPayoutConnected,
  lockPaymentLinkItems,
  writeLockedPaymentLink,
} from '~/server/utils/payment-link-create'

interface IncomingItem {
  itemId?: string
  folderId?: string
  quantity?: number
}
interface Body {
  ownerUserId?: string
  storeId?: string
  businessName?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  items?: IncomingItem[]
}

/**
 * Authenticated (owner/manager): create a payment link. Prices and stock are
 * read server-side from inventory; the amount is locked and cannot be tampered
 * with from the client.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<Body>(event)

  const ownerUserId = (body.ownerUserId || '').trim()
  const storeId = (body.storeId || '').trim()
  const customerName = normalizeEntityName((body.customerName || '').trim())
  const customerPhone = (body.customerPhone || '').trim()
  const customerEmail = (body.customerEmail || '').trim()
  const incoming = Array.isArray(body.items) ? body.items : []

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  if (!customerName) {
    throw createError({ statusCode: 400, message: 'Customer name is required' })
  }
  if (incoming.length === 0) {
    throw createError({ statusCode: 400, message: 'At least one item is required' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  await assertMerchantPayoutConnected(adminDb, ownerUserId, storeId)

  const { lockedItems, amountKobo } = await lockPaymentLinkItems(
    adminDb,
    ownerUserId,
    storeId,
    incoming.map((it) => ({
      itemId: (it.itemId || '').trim(),
      folderId: (it.folderId || '').trim(),
      quantity: Math.max(0, Math.floor(Number(it.quantity) || 0)),
    }))
  )

  let businessName = (body.businessName || '').trim()
  if (!businessName) {
    const ownerSnap = await adminDb.collection('users').doc(ownerUserId).get()
    businessName = String(ownerSnap.data()?.name || 'Storvv merchant')
  }

  const { token, invoiceNumber } = await writeLockedPaymentLink({
    adminDb,
    ownerUserId,
    storeId,
    businessName,
    customerName,
    customerPhone,
    customerEmail,
    lockedItems,
    amountKobo,
    createdBy: auth.uid,
    source: 'dashboard',
  })

  const origin = getRequestURL(event).origin
  return {
    success: true,
    token,
    invoiceNumber,
    amount: amountKobo,
    url: `${origin}/pay/${token}`,
  }
})
