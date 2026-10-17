import { resolveApiPath } from '~/utils/api-url'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'

let inflight: Promise<void> | null = null
const syncedThisSession = new Set<string>()

/** Once per app session per owner, so a missed refresh (offline, a failed call) heals itself. */
export function requestPlanTierSyncOnce(ownerUid: string): void {
  if (syncedThisSession.has(ownerUid)) return
  syncedThisSession.add(ownerUid)
  void requestPlanTierSync()
}

/** Owner only: refresh the plan tiers Firestore rules check (see server/utils/plan-tiers.ts). Never throws. */
export function requestPlanTierSync(): Promise<void> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const user = getFirebaseClientAuth()?.currentUser
      if (!user) return
      const token = await user.getIdToken()
      await $fetch(resolveApiPath('/api/workspace/plan-tiers/sync'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (error) {
      console.warn('[plan-tiers] Could not refresh plan tiers:', error)
    } finally {
      inflight = null
    }
  })()
  return inflight
}
