import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { resolveStaffWorkspaceOwnerId } from '~/server/utils/staff-workspace'
import type { MainStoreSummaryResponse } from '~/types/main-store-summary'
import { pickMainStore, summarizeStoreInventory } from '~/utils/main-store-summary'
import { resolveStaffPermissions, type LegacyStaffAccessFields } from '~/utils/staff-permissions'

function toMillis(value: unknown): number | null {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : null
  }
  return null
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Category and stock totals for the workspace's main store (the first one the owner created),
 * for staff working in another branch. Staff cannot read other branches in Firestore, so this
 * reads with the Admin SDK and returns totals only, never items. Money figures follow the
 * caller's "Financial figures" grant.
 */
export default defineEventHandler(async (event): Promise<MainStoreSummaryResponse> => {
  const auth = await requireAuth(event)

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'load')
  }

  const staffSnap = await adminDb
    .collectionGroup('staff')
    .where('authUid', '==', auth.uid)
    .limit(5)
    .get()
  const staffDoc = staffSnap.docs.find((d) => (d.data()?.status || 'active') === 'active')
  if (!staffDoc) {
    throw createError({ statusCode: 403, message: 'Active staff membership required' })
  }
  const ownerId = resolveStaffWorkspaceOwnerId(staffDoc.ref.path)
  if (!ownerId) {
    throw createError({ statusCode: 404, message: 'Workspace owner not found' })
  }
  const storeIdFromPath = staffDoc.ref.path.split('/')[3]
  const storeId = String(staffDoc.data()?.storeId || storeIdFromPath || '').trim()
  if (!storeId) {
    throw createError({ statusCode: 403, message: 'No branch assigned' })
  }

  const storesRef = adminDb.collection('users').doc(ownerId).collection('stores')
  const memberSnap = await storesRef.doc(storeId).collection('members').doc(auth.uid).get()
  const member = memberSnap.data() as (LegacyStaffAccessFields & { status?: string }) | undefined
  if (!member || member.status !== 'active') {
    throw createError({ statusCode: 403, message: 'Inactive store membership' })
  }
  const includeValue = resolveStaffPermissions(member).financials.view === true

  const storesSnap = await storesRef.get()
  const mainStore = pickMainStore(
    storesSnap.docs.map((doc) => {
      const data = doc.data() || {}
      return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name : '',
        status: typeof data.status === 'string' ? data.status : undefined,
        createdAtMs: toMillis(data.createdAt),
      }
    })
  )
  if (!mainStore) {
    throw createError({ statusCode: 404, message: 'Main store not found' })
  }

  const mainStoreRef = { id: mainStore.id, name: mainStore.name }
  if (mainStore.id === storeId) {
    return { mainStore: mainStoreRef, isOwnBranch: true, totals: null, categories: [] }
  }

  // Same filter as the owner's own category list, so the totals match theirs.
  const foldersSnap = await storesRef
    .doc(mainStore.id)
    .collection('inventoryFolders')
    .where('createdBy', '==', ownerId)
    .get()

  const { totals, categories } = summarizeStoreInventory(
    foldersSnap.docs.map((doc) => {
      const data = doc.data() || {}
      return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name : '',
        parentId: typeof data.parentId === 'string' ? data.parentId : null,
        itemCount: toCount(data.itemCount),
        totalValue: toCount(data.totalValue),
        lowStockCount: toCount(data.lowStockCount),
      }
    }),
    { includeValue }
  )

  return { mainStore: mainStoreRef, isOwnBranch: false, totals, categories }
})
