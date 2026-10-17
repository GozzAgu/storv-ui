import { NEW_ACCOUNT_TRIAL_DAYS, trialEndsAtMs } from '~/types/subscription'
import { resolveApiPath } from '~/utils/api-url'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'

const WINDOW_MS = 7 * 86_400_000
let inflight: Promise<string | null> | null = null

/** A young owner account with no trial yet; mirrors the server's own check. */
export function shouldRequestTrial(
  userData: { role?: string; trialEndsAt?: unknown; createdAt?: unknown } | null | undefined,
  now = Date.now()
): boolean {
  if (NEW_ACCOUNT_TRIAL_DAYS <= 0 || !userData || userData.role !== 'superAdmin') return false
  if (trialEndsAtMs(userData.trialEndsAt) !== null) return false
  const createdMs = trialEndsAtMs(userData.createdAt)
  // A doc written a moment ago may not have its server timestamp back yet: still young.
  return createdMs === null || now - createdMs <= WINDOW_MS
}

/** Asks the server to start the trial. Returns the trial end (ISO) or null; never throws. */
export async function requestTrialStart(): Promise<string | null> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const user = getFirebaseClientAuth()?.currentUser
      if (!user) return null
      const token = await user.getIdToken()
      const result = (await $fetch(resolveApiPath('/api/account/start-trial'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })) as { trialEndsAt: string | null }
      return result.trialEndsAt
    } catch (error) {
      console.warn('[trial] Could not start the free trial:', error)
      return null
    } finally {
      inflight = null
    }
  })()
  return inflight
}
