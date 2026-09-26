import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'

function isActiveStaffStatus(status: unknown): boolean {
  return (status || 'active') === 'active'
}

/**
 * Staff accounts do not have a top-level users/{uid} doc and cannot read the
 * employer's users/{ownerId} doc (owner-only rules). This endpoint returns the
 * workspace fields staff need to inherit (plan, currency, store branding) after
 * verifying the caller is an active staff member under that owner.
 */
export default defineEventHandler(async (event) => {
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

  const activeStaffDoc = staffSnap.docs.find((d) => isActiveStaffStatus(d.data()?.status))
  if (!activeStaffDoc) {
    throw createError({
      statusCode: 403,
      message: 'Active staff membership required',
    })
  }

  // users/{ownerId}/stores/{storeId}/departments/{deptId}/staff/{staffId}
  const pathParts = activeStaffDoc.ref.path.split('/')
  const ownerIdFromPath = pathParts[0] === 'users' ? pathParts[1] : undefined
  const createdBy = String(activeStaffDoc.data()?.createdBy || '').trim()
  const ownerId = createdBy || ownerIdFromPath

  if (!ownerId) {
    throw createError({ statusCode: 404, message: 'Workspace owner not found' })
  }

  const ownerSnap = await adminDb.collection('users').doc(ownerId).get()
  if (!ownerSnap.exists) {
    throw createError({ statusCode: 404, message: 'Workspace owner not found' })
  }

  const data = ownerSnap.data() || {}
  const storeIdFromPath = pathParts[2] === 'stores' ? pathParts[3] : undefined
  const storeId = String(activeStaffDoc.data()?.storeId || storeIdFromPath || '').trim()

  // Index so client rules can eventually allow a direct owner-doc read for this staff uid.
  if (storeId) {
    await adminDb
      .collection('users')
      .doc(ownerId)
      .collection('workspaceMembers')
      .doc(auth.uid)
      .set(
        {
          authUid: auth.uid,
          storeId,
          status: 'active',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
  }

  return {
    ownerId,
    subscription: (data.subscription as SubscriptionPlan) || 'storvv_micro',
    subscriptionBillingCycle: data.subscriptionBillingCycle as
      | SubscriptionBillingCycle
      | undefined,
    preferences: data.preferences ?? undefined,
    storeDetails: data.storeDetails ?? undefined,
    storeLogoUrl: typeof data.storeLogoUrl === 'string' ? data.storeLogoUrl : undefined,
  }
})
