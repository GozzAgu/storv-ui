import type { DecodedIdToken } from 'firebase-admin/auth'
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { getAdminAuth } from '~/server/utils/firebase-admin'
import {
  LEGACY_LINK_WINDOW_MS,
  STAFF_OWNER_CLAIM,
  stampStaffOwner,
} from '~/server/utils/staff-login-target'
import { trialEndsAtMs } from '~/types/subscription'

/**
 * Owner uid for a hierarchical staff doc:
 * users/{ownerId}/stores/{storeId}/departments/{deptId}/staff/{staffId}.
 * Returns null for any other shape (e.g. the legacy top-level `staff` collection).
 */
export function resolveStaffWorkspaceOwnerId(staffDocPath: string): string | null {
  const parts = staffDocPath.split('/')
  if (
    parts.length !== 8 ||
    parts[0] !== 'users' ||
    parts[2] !== 'stores' ||
    parts[4] !== 'departments' ||
    parts[6] !== 'staff' ||
    !parts[1]
  ) {
    return null
  }
  return parts[1]
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** Staff get the trial end as a string so it survives JSON. */
function trialEndsAtIso(value: unknown): string | undefined {
  const ms = trialEndsAtMs(value)
  return ms === null ? undefined : new Date(ms).toISOString()
}

/**
 * The only owner-doc fields staff may inherit. Allowlist: the owner doc also holds billing
 * references and (on older accounts) a legacy 2FA secret, which must never reach staff.
 */
export function pickOwnerWorkspaceFields(data: Record<string, unknown>) {
  return {
    name: optionalString(data.name),
    subscription: optionalString(data.subscription) || 'storvv_micro',
    subscriptionBillingCycle: optionalString(data.subscriptionBillingCycle),
    subscriptionStatus: optionalString(data.subscriptionStatus),
    subscriptionCurrentPeriodEnd: optionalString(data.subscriptionCurrentPeriodEnd),
    trialEndsAt: trialEndsAtIso(data.trialEndsAt),
    preferences: data.preferences ?? undefined,
    storeDetails: data.storeDetails ?? undefined,
    storeLogoUrl: optionalString(data.storeLogoUrl),
  }
}

/**
 * The staff record a signed-in staff login works under. Any owner can write a staff record with
 * someone else's login on it, so the business comes from the login's server-set `staffOwner`
 * claim; older logins without it are matched to the record created alongside them (and stamped).
 */
export async function findStaffDocForLogin(
  db: Firestore,
  decoded: DecodedIdToken
): Promise<QueryDocumentSnapshot | null> {
  const snap = await db.collectionGroup('staff').where('authUid', '==', decoded.uid).limit(10).get()
  const active = snap.docs.filter(
    (d) => (d.data()?.status || 'active') === 'active' && resolveStaffWorkspaceOwnerId(d.ref.path)
  )
  const claimed = decoded[STAFF_OWNER_CLAIM]
  if (typeof claimed === 'string' && claimed) {
    return active.find((d) => resolveStaffWorkspaceOwnerId(d.ref.path) === claimed) ?? null
  }
  if (active.length === 0) return null

  const auth = getAdminAuth()
  const loginCreated = Date.parse((await auth.getUser(decoded.uid)).metadata.creationTime)
  const match = active.find((d) => {
    const created = d.data()?.createdAt as { toMillis?: () => number } | undefined
    const ms = typeof created?.toMillis === 'function' ? created.toMillis() : NaN
    return Number.isFinite(ms) && Math.abs(ms - loginCreated) <= LEGACY_LINK_WINDOW_MS
  })
  if (!match) return null
  await stampStaffOwner(auth, decoded.uid, resolveStaffWorkspaceOwnerId(match.ref.path)!)
  return match
}
