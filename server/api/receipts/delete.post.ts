import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { requireStoreAdminGrant } from '~/server/utils/staff-admin'
import {
  computeCustomerAfterReceiptDelete,
  receiptDeleteBlockReason,
  receiptDeleteStockAction,
} from '~/server/utils/receipt-delete'
import { syncLoyaltyBestEffort } from '~/server/utils/loyalty/sync'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'

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
    throw createError({
      statusCode: 400,
      message: 'ownerUserId, storeId and receiptId are required',
    })
  }

  const adminDb = getAdminFirestore()
  await requireStoreAdminGrant(adminDb, auth.uid, ownerUserId, storeId, 'deleteSales')
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
      items?: Array<{ itemId?: string; quantity?: number; folderId?: string }>
      folderId?: string
      total?: number
      createdBy?: string
      storeId?: string
      status?: string
      paymentSummary?: unknown
      tradeLoanId?: unknown
    }

    if (receipt.storeId && receipt.storeId !== storeId) {
      throw createError({ statusCode: 409, message: 'Receipt store mismatch' })
    }
    const blocked = receiptDeleteBlockReason(receipt)
    if (blocked) throw createError({ statusCode: 409, message: blocked })

    const itemIds = Array.isArray(receipt.itemIds) ? receipt.itemIds : []
    const receiptLines = Array.isArray(receipt.items) ? receipt.items : []
    const linesByFolder = new Map<string, Array<{ itemId: string; quantity: number }>>()

    for (const line of receiptLines) {
      if (!line?.itemId) continue
      const folderId = (line.folderId || receipt.folderId || '').trim()
      if (!folderId) continue
      const bucket = linesByFolder.get(folderId) ?? []
      bucket.push({
        itemId: line.itemId,
        quantity: Math.max(1, Number(line.quantity ?? 1) || 1),
      })
      linesByFolder.set(folderId, bucket)
    }

    if (linesByFolder.size === 0 && itemIds.length > 0 && receipt.folderId) {
      linesByFolder.set(
        receipt.folderId,
        itemIds.map((itemId) => ({ itemId, quantity: 1 }))
      )
    }

    const inventoryItemsCol = () =>
      adminDb
        .collection('users')
        .doc(ownerUserId)
        .collection('stores')
        .doc(storeId)
        .collection('inventoryItems')

    const foldersCol = () =>
      adminDb
        .collection('users')
        .doc(ownerUserId)
        .collection('stores')
        .doc(storeId)
        .collection('inventoryFolders')

    // Firestore transactions must do every read before the first write.
    const stockAction = receiptDeleteStockAction(receipt.status)
    const itemWrites: Array<{
      ref: DocumentReference
      data: Record<string, unknown>
    }> = []

    if (stockAction !== 'none') {
      for (const [folderId, lines] of linesByFolder) {
        const folderSnap = await tx.get(foldersCol().doc(folderId))
        const folderData = folderSnap.exists
          ? (folderSnap.data() as {
              hasSerialNumbers?: boolean
              template?: { fields?: Array<{ name?: string }> }
            })
          : undefined
        const usesSerialNumbers = !!folderData?.hasSerialNumbers
        const templateFields = folderData?.template?.fields

        for (const line of lines) {
          const itemRef = inventoryItemsCol().doc(line.itemId)
          const itemSnap = await tx.get(itemRef)
          if (!itemSnap.exists) continue
          const raw = itemSnap.data() as Record<string, unknown>

          if (stockAction === 'release_hold') {
            if (`${raw.pendingSaleReceiptId || ''}` !== receiptId) continue
            itemWrites.push({
              ref: itemRef,
              data: {
                pendingSaleReceiptId: FieldValue.delete(),
                pendingSaleAt: FieldValue.delete(),
                updatedAt: FieldValue.serverTimestamp(),
              },
            })
          } else if (usesSerialNumbers) {
            itemWrites.push({
              ref: itemRef,
              data: { dateOut: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() },
            })
          } else {
            const resolved = resolveBulkStockFieldAndValueFromMap(raw, templateFields)
            if (!resolved) continue
            itemWrites.push({
              ref: itemRef,
              data: {
                [resolved.fieldKey]: resolved.value + line.quantity,
                dateOut: FieldValue.delete(),
                updatedAt: FieldValue.serverTimestamp(),
              },
            })
          }
        }
      }
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

    for (const write of itemWrites) tx.update(write.ref, write.data)

    if (!customersSnap.empty && customersSnap.docs[0]) {
      const customerDoc = customersSnap.docs[0]
      const customerData = customerDoc.data() as {
        receipts?: string[]
        totalOrders?: number
        totalSpent?: number
      }
      const customerResult = computeCustomerAfterReceiptDelete(
        customerData,
        receiptId,
        Number(receipt.total || 0)
      )

      if (customerResult.deleteCustomer) {
        tx.delete(customerDoc.ref)
      } else {
        tx.update(customerDoc.ref, {
          receipts: customerResult.receipts,
          totalOrders: customerResult.totalOrders,
          totalSpent: customerResult.totalSpent,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    tx.delete(receiptRef)

    return { deleted: true, itemCount: itemIds.length }
  })
  await syncLoyaltyBestEffort(adminDb, { ownerId: ownerUserId, storeId, actorUid: auth.uid }, [
    receiptId,
  ])

  return {
    success: true,
    ...result,
  }
})
