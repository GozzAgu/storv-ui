import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore'
import { storeCreatedAtMillis } from '~/types/subscription'
import { fullAccessOrder, planTierForPosition } from '~/utils/plan-access'
import { loadActiveStoreStaff } from '~/server/utils/plan-access'

const BATCH_LIMIT = 400

/**
 * Save `planTier` on each of an owner's stores and active staff memberships (see
 * planTierForPosition). Tiers depend on the stores and staff, not on the plan, so this only needs
 * to run when those change or the owner picks who keeps full access. Writes only what changed.
 */
export async function syncPlanTiers(
  db: Firestore,
  ownerId: string
): Promise<{ storesUpdated: number; membersUpdated: number }> {
  const storesSnap = await db
    .collection('users')
    .doc(ownerId)
    .collection('stores')
    .where('ownerId', '==', ownerId)
    .get()
  const stores = [...storesSnap.docs].sort(
    (a, b) =>
      storeCreatedAtMillis(a.data().createdAt) - storeCreatedAtMillis(b.data().createdAt) ||
      a.id.localeCompare(b.id)
  )

  const updates: Array<{ ref: DocumentReference; planTier: number }> = []
  const creates: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = []
  let storesUpdated = 0
  let membersUpdated = 0

  for (const [index, storeDoc] of stores.entries()) {
    const storeTier = planTierForPosition(index, 'store')
    if (storeDoc.data().planTier !== storeTier) {
      updates.push({ ref: storeDoc.ref, planTier: storeTier })
      storesUpdated++
    }

    const [staff, membersSnap] = await Promise.all([
      loadActiveStoreStaff(db, ownerId, storeDoc.id),
      storeDoc.ref.collection('members').get(),
    ])
    const members = new Map(membersSnap.docs.map((doc) => [doc.id, doc]))
    const staffById = new Map(staff.map((member) => [member.id, member]))
    for (const [position, staffId] of fullAccessOrder(
      staff,
      storeDoc.data().fullAccessStaffIds
    ).entries()) {
      const staffMember = staffById.get(staffId)
      const authUid = staffMember?.authUid
      const memberDoc = authUid ? members.get(authUid) : undefined
      const tier = planTierForPosition(position, 'staff')
      if (!memberDoc) {
        // Active staff with a login but no membership: create it here (clients can't write
        // memberships, so they can't add staff beyond the plan either).
        if (authUid && staffMember) {
          creates.push({
            ref: storeDoc.ref.collection('members').doc(authUid),
            data: await memberFromStaff(storeDoc.ref, ownerId, storeDoc.id, staffMember, tier),
          })
          creates.push({
            ref: db.collection('users').doc(ownerId).collection('workspaceMembers').doc(authUid),
            data: {
              authUid,
              storeId: storeDoc.id,
              status: 'active',
              updatedAt: FieldValue.serverTimestamp(),
            },
          })
          membersUpdated++
        }
        continue
      }
      if (memberDoc.data().planTier !== tier) {
        updates.push({ ref: memberDoc.ref, planTier: tier })
        membersUpdated++
      }
    }
  }

  for (let i = 0; i < creates.length; i += BATCH_LIMIT) {
    const batch = db.batch()
    for (const { ref, data } of creates.slice(i, i + BATCH_LIMIT))
      batch.set(ref, data, { merge: true })
    await batch.commit()
  }

  for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
    const batch = db.batch()
    for (const { ref, planTier } of updates.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { planTier })
    }
    await batch.commit()
  }
  return { storesUpdated, membersUpdated }
}

/** Membership for an active staff login, from their staff record (as the staff routes write it). */
async function memberFromStaff(
  store: DocumentReference,
  ownerId: string,
  storeId: string,
  staff: { id: string; departmentId: string; authUid?: string },
  planTier: number
): Promise<Record<string, unknown>> {
  const snap = await store
    .collection('departments')
    .doc(staff.departmentId)
    .collection('staff')
    .doc(staff.id)
    .get()
  const data = snap.data() ?? {}
  return {
    authUid: staff.authUid,
    staffId: staff.id,
    storeId,
    departmentId: staff.departmentId,
    status: 'active',
    ...(data.permissions
      ? { permissions: data.permissions }
      : {
          role: data.role || 'staff',
          ...(data.canManageInventory === true && { canManageInventory: true }),
          ...(data.canManageReceipts === true && { canManageReceipts: true }),
        }),
    createdBy: ownerId,
    planTier,
    updatedAt: FieldValue.serverTimestamp(),
  }
}

/** After a staff change: a failed refresh must not fail the change itself. */
export async function syncPlanTiersQuietly(db: Firestore, ownerId: string): Promise<void> {
  try {
    await syncPlanTiers(db, ownerId)
  } catch (err) {
    console.error('[plan-tiers] sync failed:', err)
  }
}
