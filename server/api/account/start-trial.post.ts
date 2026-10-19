import { defineEventHandler } from 'h3'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { decideTrialStart } from '~/server/utils/account-trial'
import { requireAuth } from '~/server/utils/store-auth'
import { trialEndsAtMs } from '~/types/subscription'

/**
 * Starts the free trial on the caller's own new owner account. Safe to call more than once:
 * an existing trial is never moved, and accounts older than a week are left alone.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event, { allowPendingTwoFactor: true })

  let db: ReturnType<typeof getAdminFirestore>
  try {
    db = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'load')
  }

  // When the login was created, which the owner can't change (unlike their users/{uid} doc).
  let signedUpAtMs: number | null = null
  try {
    const created = Date.parse((await getAdminAuth().getUser(auth.uid)).metadata.creationTime)
    signedUpAtMs = Number.isFinite(created) ? created : null
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'load')
  }
  if (signedUpAtMs === null) {
    return { started: false, reason: 'too_old', trialEndsAt: null }
  }

  const ref = db.collection('users').doc(auth.uid)
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data()
    const decision = decideTrialStart(data, Date.now(), undefined, signedUpAtMs)
    if (!decision.start) {
      const existing = trialEndsAtMs(data?.trialEndsAt)
      return {
        started: false,
        reason: decision.reason,
        trialEndsAt: existing === null ? null : new Date(existing).toISOString(),
      }
    }
    tx.update(ref, { trialEndsAt: Timestamp.fromMillis(decision.trialEndsAtMs) })
    return {
      started: true,
      reason: null,
      trialEndsAt: new Date(decision.trialEndsAtMs).toISOString(),
    }
  })
})
