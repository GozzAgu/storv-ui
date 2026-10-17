import type { DocumentReference, Firestore } from 'firebase-admin/firestore'
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
      const authUid = staffById.get(staffId)?.authUid
      const memberDoc = authUid ? members.get(authUid) : undefined
      if (!memberDoc) continue
      const tier = planTierForPosition(position, 'staff')
      if (memberDoc.data().planTier !== tier) {
        updates.push({ ref: memberDoc.ref, planTier: tier })
        membersUpdated++
      }
    }
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

/** After a staff change: a failed refresh must not fail the change itself. */
export async function syncPlanTiersQuietly(db: Firestore, ownerId: string): Promise<void> {
  try {
    await syncPlanTiers(db, ownerId)
  } catch (err) {
    console.error('[plan-tiers] sync failed:', err)
  }
}
