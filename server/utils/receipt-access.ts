import { createError } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireStoreReadAccess } from '~/server/utils/store-auth'

export interface ReceiptAccessParams {
  authUid: string
  ownerUserId: string
  storeId: string
  receiptId: string
  receiptNumber?: string
}

export async function assertReceiptDeliveryAccess(params: ReceiptAccessParams): Promise<void> {
  const ownerUserId = params.ownerUserId.trim()
  const storeId = params.storeId.trim()
  const receiptId = params.receiptId.trim()

  if (!ownerUserId || !storeId || !receiptId) {
    throw createError({
      statusCode: 400,
      message: 'ownerUserId, storeId and receiptId are required',
    })
  }

  await requireStoreReadAccess(params.authUid, ownerUserId, storeId)

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

  const receipt = receiptSnap.data() as { storeId?: string; receiptNumber?: string }
  if (receipt.storeId && receipt.storeId !== storeId) {
    throw createError({ statusCode: 409, message: 'Receipt store mismatch' })
  }

  const expectedNumber = params.receiptNumber?.trim()
  if (
    expectedNumber &&
    receipt.receiptNumber &&
    receipt.receiptNumber !== expectedNumber
  ) {
    throw createError({ statusCode: 409, message: 'Receipt number mismatch' })
  }
}
