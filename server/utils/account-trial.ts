import { NEW_ACCOUNT_TRIAL_DAYS, trialEndsAtMs } from '~/types/subscription'

/** Only accounts this young can start a trial themselves; older ones are handled by backfill. */
export const TRIAL_START_WINDOW_MS = 7 * 86_400_000

export type TrialStartDecision =
  | { start: true; trialEndsAtMs: number }
  | { start: false; reason: 'disabled' | 'not_owner' | 'already_set' | 'too_old' }

/**
 * Whether a new owner account should get its free trial now. Pure so it can be tested; the
 * route writes the result with the Admin SDK because owners cannot write `trialEndsAt`.
 *
 * `signedUpAtMs` is the Firebase Auth account's creation time. The account's age is taken from
 * the earlier of that and the doc's `createdAt`, so recreating the doc never makes it look new.
 */
export function decideTrialStart(
  ownerDoc: Record<string, unknown> | undefined,
  now: number,
  trialDays: number = NEW_ACCOUNT_TRIAL_DAYS,
  signedUpAtMs: number | null = null
): TrialStartDecision {
  if (trialDays <= 0) return { start: false, reason: 'disabled' }
  if (!ownerDoc || (ownerDoc.role && ownerDoc.role !== 'superAdmin')) {
    return { start: false, reason: 'not_owner' }
  }
  if (trialEndsAtMs(ownerDoc.trialEndsAt) !== null) return { start: false, reason: 'already_set' }
  const docCreatedMs = trialEndsAtMs(ownerDoc.createdAt)
  const createdMs =
    signedUpAtMs !== null && docCreatedMs !== null
      ? Math.min(signedUpAtMs, docCreatedMs)
      : signedUpAtMs ?? docCreatedMs
  if (createdMs === null || now - createdMs > TRIAL_START_WINDOW_MS) {
    return { start: false, reason: 'too_old' }
  }
  return { start: true, trialEndsAtMs: now + trialDays * 86_400_000 }
}
