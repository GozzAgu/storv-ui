import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'

interface ValidateSerialBody {
  ownerUserId?: string
  storeId?: string
  folderId?: string
  serialNo?: string
  brand?: string
  model?: string
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<ValidateSerialBody>(event)

  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const folderId = body.folderId?.trim()
  const serialNo = body.serialNo?.trim()
  const brand = body.brand?.trim()
  const model = body.model?.trim()

  if (!ownerUserId || !storeId || !folderId || !serialNo || !brand || !model) {
    throw createError({ statusCode: 400, message: 'ownerUserId, storeId, folderId, serialNo, brand and model are required' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const itemsRef = adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('inventoryItems')

  // Query by folder + serial first, then compare brand/model in memory.
  const snapshot = await itemsRef
    .where('folderId', '==', folderId)
    .where('serialNo', '==', serialNo)
    .get()

  const duplicateExists = snapshot.docs.some((doc) => {
    const data = doc.data() as { brand?: string; model?: string }
    return (data.brand || '').trim() === brand && (data.model || '').trim() === model
  })

  return {
    success: true,
    duplicateExists,
  }
})
