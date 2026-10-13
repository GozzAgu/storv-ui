import type { UserData } from '~/composables/useUser'
import { resolveApiPath } from '~/utils/api-url'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'

/**
 * The owner fields staff inherit, from /api/workspace/owner-context. users/{ownerId} is owner-only
 * in Firestore rules: staff must never read the owner doc itself.
 */
export type OwnerWorkspaceContext = Pick<
  UserData,
  | 'name'
  | 'subscription'
  | 'subscriptionBillingCycle'
  | 'subscriptionStatus'
  | 'subscriptionCurrentPeriodEnd'
  | 'preferences'
  | 'storeDetails'
  | 'storeLogoUrl'
> & { ownerId: string }

const CACHE_MS = 60_000

let cached: { authUid: string; at: number; value: OwnerWorkspaceContext } | null = null
let inflight: { authUid: string; promise: Promise<OwnerWorkspaceContext | null> } | null = null

/** Cached per signed-in user; `force` skips the cache (e.g. after the owner changes settings). */
export async function fetchOwnerWorkspaceContext(
  options: { force?: boolean } = {}
): Promise<OwnerWorkspaceContext | null> {
  const user = getFirebaseClientAuth()?.currentUser
  if (!user) return null

  if (!options.force && cached?.authUid === user.uid && Date.now() - cached.at < CACHE_MS) {
    return cached.value
  }
  if (!options.force && inflight?.authUid === user.uid) return inflight.promise

  const promise = (async () => {
    try {
      const token = await user.getIdToken()
      const value = await $fetch<OwnerWorkspaceContext>(
        resolveApiPath('/api/workspace/owner-context'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      cached = { authUid: user.uid, at: Date.now(), value }
      return value
    } catch {
      return null
    } finally {
      inflight = null
    }
  })()
  inflight = { authUid: user.uid, promise }
  return promise
}

/** Owner context shaped as a (partial) UserData for code that renders the owner's details. */
export function ownerContextToUserData(context: OwnerWorkspaceContext): UserData {
  return {
    uid: context.ownerId,
    email: '',
    name: context.name ?? '',
    role: 'superAdmin',
    subscription: context.subscription,
    subscriptionBillingCycle: context.subscriptionBillingCycle,
    subscriptionStatus: context.subscriptionStatus,
    subscriptionCurrentPeriodEnd: context.subscriptionCurrentPeriodEnd,
    preferences: context.preferences,
    storeDetails: context.storeDetails,
    storeLogoUrl: context.storeLogoUrl,
    hasCompletedOnboarding: true,
    hasCompletedTutorial: true,
    createdAt: null,
    updatedAt: null,
  }
}

export function clearOwnerWorkspaceContextCache() {
  cached = null
  inflight = null
}
