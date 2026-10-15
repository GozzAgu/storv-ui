import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import {
  pickOwnerWorkspaceFields,
  resolveStaffWorkspaceOwnerId,
} from '~/server/utils/staff-workspace'
import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'

function isActiveStaffStatus(status: unknown): boolean {
  return (status || 'active') === 'active'
}

/**
 * Staff accounts do not have a top-level users/{uid} doc and cannot read the
 * employer's users/{ownerId} doc (owner-only rules). This endpoint returns only the
 * allowlisted workspace fields staff inherit (plan, currency, store branding) after
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

  // The owner comes only from the path (only the owner can create docs under users/{ownerId});
  // `createdBy` is a plain field and must never decide which workspace a staff member joins.
  const ownerId = resolveStaffWorkspaceOwnerId(activeStaffDoc.ref.path)
  if (!ownerId) {
    throw createError({ statusCode: 404, message: 'Workspace owner not found' })
  }
  const pathParts = activeStaffDoc.ref.path.split('/')

  const ownerSnap = await adminDb.collection('users').doc(ownerId).get()
  if (!ownerSnap.exists) {
    throw createError({ statusCode: 404, message: 'Workspace owner not found' })
  }

  const data = ownerSnap.data() || {}
  const storeIdFromPath = pathParts[2] === 'stores' ? pathParts[3] : undefined
  const storeId = String(activeStaffDoc.data()?.storeId || storeIdFromPath || '').trim()

  // Roster index of active staff per owner. It grants no read access to users/{ownerId}.
  // `admin` mirrors the store member flag so transfer rules can recognise branch admins.
  if (storeId) {
    const memberSnap = await adminDb
      .collection('users')
      .doc(ownerId)
      .collection('stores')
      .doc(storeId)
      .collection('members')
      .doc(auth.uid)
      .get()
    const isBranchAdmin = memberSnap.data()?.admin === true
    await adminDb.collection('users').doc(ownerId).collection('workspaceMembers').doc(auth.uid).set(
      {
        authUid: auth.uid,
        storeId,
        status: 'active',
        admin: isBranchAdmin,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  }

  const fields = pickOwnerWorkspaceFields(data)
  return {
    ownerId,
    ...fields,
    subscription: fields.subscription as SubscriptionPlan,
    subscriptionBillingCycle: fields.subscriptionBillingCycle as
      | SubscriptionBillingCycle
      | undefined,
  }
})
