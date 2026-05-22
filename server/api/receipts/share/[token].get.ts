import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')?.trim()
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const adminDb = getAdminFirestore()
  const snap = await adminDb.collection('receiptShares').doc(token).get()

  if (!snap.exists) {
    throw createError({ statusCode: 404, message: 'Receipt link not found or expired' })
  }

  const data = snap.data()!
  const expiresAt = data.expiresAt?.toDate?.() ?? (data.expiresAt ? new Date(data.expiresAt) : null)
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 410, message: 'This receipt link has expired' })
  }

  let storeName = data.snapshot?.storeBranchName || ''
  if (!storeName && data.ownerUserId) {
    const userSnap = await adminDb.collection('users').doc(data.ownerUserId).get()
    storeName = userSnap.data()?.storeDetails?.storeName || ''
  }

  return {
    success: true,
    receipt: {
      ...data.snapshot,
      storeName,
      receiptId: data.receiptId,
    },
    expiresAt: expiresAt?.toISOString() ?? null,
  }
})
