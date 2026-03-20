import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'

interface DeleteReceiptBody {
  ownerUserId?: string
  storeId?: string
  receiptId?: string
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<DeleteReceiptBody>(event)
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const receiptId = body.receiptId?.trim()

  if (!ownerUserId || !storeId || !receiptId) {
    throw createError({ statusCode: 400, message: 'ownerUserId, storeId and receiptId are required' })
  }

  // Keep delete strict: only owner can delete receipts.
  if (auth.uid !== ownerUserId) {
    throw createError({ statusCode: 403, message: 'Only super admins can delete receipts' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const receiptRef = adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('receipts')
    .doc(receiptId)

  const result = await adminDb.runTransaction(async (tx) => {
    const receiptSnap = await tx.get(receiptRef)
    if (!receiptSnap.exists) {
      throw createError({ statusCode: 404, message: 'Receipt not found' })
    }

    const receipt = receiptSnap.data() as {
      itemIds?: string[]
      total?: number
      createdBy?: string
      storeId?: string
    }

    if (receipt.storeId && receipt.storeId !== storeId) {
      throw createError({ statusCode: 409, message: 'Receipt store mismatch' })
    }

    const itemIds = Array.isArray(receipt.itemIds) ? receipt.itemIds : []
    for (const itemId of itemIds) {
      const itemRef = adminDb
        .collection('users')
        .doc(ownerUserId)
        .collection('stores')
        .doc(storeId)
        .collection('inventoryItems')
        .doc(itemId)
      const itemSnap = await tx.get(itemRef)
      if (!itemSnap.exists) continue
      tx.update(itemRef, {
        dateOut: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    const customersQuery = adminDb
      .collection('users')
      .doc(ownerUserId)
      .collection('stores')
      .doc(storeId)
      .collection('customers')
      .where('receipts', 'array-contains', receiptId)
      .limit(1)

    const customersSnap = await tx.get(customersQuery)
    if (!customersSnap.empty && customersSnap.docs[0]) {
      const customerDoc = customersSnap.docs[0]
      const customerData = customerDoc.data() as {
        receipts?: string[]
        totalOrders?: number
        totalSpent?: number
      }
      const receipts = Array.isArray(customerData.receipts) ? customerData.receipts : []
      const updatedReceipts = receipts.filter((id) => id !== receiptId)

      if (updatedReceipts.length === 0) {
        tx.delete(customerDoc.ref)
      } else {
        const receiptTotal = Number(receipt.total || 0)
        tx.update(customerDoc.ref, {
          receipts: updatedReceipts,
          totalOrders: Math.max(0, Number(customerData.totalOrders || 1) - 1),
          totalSpent: Math.max(0, Number(customerData.totalSpent || receiptTotal) - receiptTotal),
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    tx.delete(receiptRef)

    return { deleted: true, itemCount: itemIds.length }
  })

  return {
    success: true,
    ...result,
  }
})
