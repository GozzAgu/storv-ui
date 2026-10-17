import { NEW_ACCOUNT_TRIAL_DAYS } from '~/types/subscription'

export interface TrialOffer {
  /** "3 months" */
  length: string
  headline: string
  detail: string
}

/** Site copy for the free trial; null once NEW_ACCOUNT_TRIAL_DAYS is 0, so the site follows the switch. */
export function getTrialOffer(days = NEW_ACCOUNT_TRIAL_DAYS): TrialOffer | null {
  if (days <= 0) return null
  const months = days / 30
  const length = Number.isInteger(months)
    ? `${months} ${months === 1 ? 'month' : 'months'}`
    : `${days} days`
  return {
    length,
    headline: `Enterprise free for ${length}`,
    detail: 'Every new account. No card needed. Then Micro stays free, or pick a plan.',
  }
}
