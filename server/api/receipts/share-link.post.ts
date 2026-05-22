import { createError, defineEventHandler, readBody } from 'h3'
import { randomBytes } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'

interface ShareLinkBody {
  ownerUserId?: string
  storeId?: string
  receiptId?: string
}

const SHARE_TTL_DAYS = 30

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<ShareLinkBody>(event)

  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const receiptId = body.receiptId?.trim()

  if (!ownerUserId || !storeId || !receiptId) {
    throw createError({ statusCode: 400, message: 'ownerUserId, storeId and receiptId are required' })
  }

  await requireStoreReadAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const receiptSnap = await adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('receipts')
    .doc(receiptId)
    .get()

  if (!receiptSnap.exists) {
    throw createError({ statusCode: 404, message: 'Receipt not found' })
  }

  const receipt = receiptSnap.data()!
  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000)

  await adminDb.collection('receiptShares').doc(token).set({
    token,
    ownerUserId,
    storeId,
    receiptId,
    receiptNumber: receipt.receiptNumber || '',
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: auth.uid,
    snapshot: {
      receiptNumber: receipt.receiptNumber,
      customerName: receipt.customerName,
      date: receipt.date,
      total: receipt.total,
      items: receipt.items,
      paymentMethod: receipt.paymentMethod,
      status: receipt.status,
      storeBranchName: receipt.storeBranchName,
      storeLogoUrl: receipt.storeLogoUrl,
      isSwapIn: receipt.isSwapIn,
      swapInCredit: receipt.swapInCredit,
    },
  })

  const config = useRuntimeConfig()
  const origin = (config.public.appOrigin as string)?.replace(/\/$/, '') || ''
  const url = `${origin}/r/${token}`

  return { success: true, url, token, expiresAt: expiresAt.toISOString() }
})
