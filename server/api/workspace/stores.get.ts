import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { resolveStaffWorkspaceOwnerId } from '~/server/utils/staff-workspace'
import { normalizeStaffAdminGrants } from '~/utils/staff-permissions'
import { resolveEffectiveSubscriptionPlan, type SubscriptionPlan } from '~/types/subscription'

function isActiveStaffStatus(status: unknown): boolean {
  return (status || 'active') === 'active'
}

/**
 * List every branch under the workspace for the owner, or for a branch admin the owner
 * has given the stock-transfers extra. Staff cannot read other stores' docs in Firestore
 * unless complex rules line up; this endpoint is the reliable source for the transfer picker.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'load')
  }

  let ownerId = auth.uid
  let callerIsOwner = true

  const ownerSnap = await adminDb.collection('users').doc(auth.uid).get()
  if (!ownerSnap.exists || ownerSnap.data()?.role !== 'superAdmin') {
    callerIsOwner = false
    const staffSnap = await adminDb
      .collectionGroup('staff')
      .where('authUid', '==', auth.uid)
      .limit(5)
      .get()
    const activeStaffDoc = staffSnap.docs.find((d) => isActiveStaffStatus(d.data()?.status))
    if (!activeStaffDoc) {
      throw createError({ statusCode: 403, message: 'Active staff membership required' })
    }
    const resolved = resolveStaffWorkspaceOwnerId(activeStaffDoc.ref.path)
    if (!resolved) {
      throw createError({ statusCode: 404, message: 'Workspace owner not found' })
    }
    ownerId = resolved
    const pathParts = activeStaffDoc.ref.path.split('/')
    const storeIdFromPath = pathParts[2] === 'stores' ? pathParts[3] : undefined
    const storeId = String(activeStaffDoc.data()?.storeId || storeIdFromPath || '').trim()
    if (!storeId) {
      throw createError({ statusCode: 403, message: 'No branch assigned' })
    }
    const memberSnap = await adminDb
      .collection('users')
      .doc(ownerId)
      .collection('stores')
      .doc(storeId)
      .collection('members')
      .doc(auth.uid)
      .get()
    const member = memberSnap.data()
    if (!member || member.status !== 'active' || member.admin !== true) {
      throw createError({
        statusCode: 403,
        message: 'Only the store owner or a branch admin can list branches',
      })
    }
    if (normalizeStaffAdminGrants(member.adminGrants).stockTransfers !== true) {
      throw createError({
        statusCode: 403,
        message: 'Ask the store owner to turn on Transfer stock to other branches for you',
      })
    }
    // Keep the workspace index current so client rules reads keep working too.
    await adminDb.collection('users').doc(ownerId).collection('workspaceMembers').doc(auth.uid).set(
      {
        authUid: auth.uid,
        storeId,
        status: 'active',
        admin: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  }

  const ownerData = callerIsOwner
    ? ownerSnap.data() || {}
    : (await adminDb.collection('users').doc(ownerId).get()).data() || {}
  const plan: SubscriptionPlan = resolveEffectiveSubscriptionPlan(ownerData)
  if (plan !== 'storvv_enterprise') {
    throw createError({
      statusCode: 403,
      message: 'Listing branches for transfers needs the Storvv Enterprise plan',
    })
  }

  const storesSnap = await adminDb.collection('users').doc(ownerId).collection('stores').get()
  const stores = storesSnap.docs
    .map((doc) => {
      const data = doc.data() || {}
      return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name : '',
        branchName: typeof data.branchName === 'string' ? data.branchName : undefined,
        city: typeof data.city === 'string' ? data.city : undefined,
        area: typeof data.area === 'string' ? data.area : undefined,
        status: typeof data.status === 'string' ? data.status : undefined,
        ownerId: typeof data.ownerId === 'string' ? data.ownerId : ownerId,
        createdAt: data.createdAt ?? null,
      }
    })
    .filter((store) => store.status !== 'inactive' && store.status !== 'deleted')
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))

  return { ownerId, stores }
})
