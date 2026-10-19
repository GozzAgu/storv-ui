import { describe, expect, it } from 'vitest'
import {
  NEW_ACCOUNT_TRIAL_DAYS,
  isTrialActive,
  resolveEffectiveSubscriptionPlan,
  staffLimitReachedMessage,
  storeLimitReachedMessage,
  trialDaysLeft,
  trialEndsAtMs,
} from '~/types/subscription'
import { shouldRequestTrial } from '~/utils/account-trial-client'
import { getTrialSummary } from '~/utils/subscription-billing-ui'
import { decideTrialStart } from '~/server/utils/account-trial'

const DAY = 86_400_000
const now = Date.UTC(2026, 9, 17, 12)

describe('the free trial switch', () => {
  it('gives new accounts 90 days', () => {
    expect(NEW_ACCOUNT_TRIAL_DAYS).toBe(90)
  })
})

describe('trialEndsAtMs', () => {
  it('reads every shape the trial end arrives in', () => {
    const ms = now + 10 * DAY
    expect(trialEndsAtMs({ toMillis: () => ms })).toBe(ms)
    expect(trialEndsAtMs({ seconds: ms / 1000 })).toBe(ms)
    expect(trialEndsAtMs({ _seconds: ms / 1000 })).toBe(ms)
    expect(trialEndsAtMs(new Date(ms).toISOString())).toBe(ms)
    expect(trialEndsAtMs(ms)).toBe(ms)
    expect(trialEndsAtMs(null)).toBeNull()
    expect(trialEndsAtMs('not a date')).toBeNull()
  })
})

describe('effective plan during a trial', () => {
  const onTrial = { subscription: 'storvv_micro', trialEndsAt: new Date(now + 40 * DAY) }

  it('unlocks Enterprise while the trial runs', () => {
    expect(isTrialActive(onTrial, now)).toBe(true)
    expect(resolveEffectiveSubscriptionPlan(onTrial, now)).toBe('storvv_enterprise')
    expect(trialDaysLeft(onTrial, now)).toBe(40)
  })

  it('falls back to Micro the moment it ends', () => {
    const ended = { ...onTrial, trialEndsAt: new Date(now - 1) }
    expect(isTrialActive(ended, now)).toBe(false)
    expect(resolveEffectiveSubscriptionPlan(ended, now)).toBe('storvv_micro')
    expect(trialDaysLeft(ended, now)).toBe(0)
  })

  it('counts a part day as a day left', () => {
    expect(trialDaysLeft({ ...onTrial, trialEndsAt: new Date(now + 3 * 3_600_000) }, now)).toBe(1)
  })

  it('never treats a paying account as a trial', () => {
    const paying = { subscription: 'storvv_medium', trialEndsAt: new Date(now + 40 * DAY) }
    expect(isTrialActive(paying, now)).toBe(false)
    expect(resolveEffectiveSubscriptionPlan(paying, now)).toBe('storvv_medium')
  })

  it('leaves accounts without a trial on their stored plan', () => {
    expect(resolveEffectiveSubscriptionPlan({ subscription: 'storvv_micro' }, now)).toBe(
      'storvv_micro'
    )
  })
})

describe('decideTrialStart (server)', () => {
  const owner = { role: 'superAdmin', createdAt: new Date(now - DAY) }

  it('starts a 90 day trial on a new owner account', () => {
    expect(decideTrialStart(owner, now)).toEqual({ start: true, trialEndsAtMs: now + 90 * DAY })
  })

  it('never moves an existing trial', () => {
    expect(decideTrialStart({ ...owner, trialEndsAt: new Date(now + DAY) }, now)).toEqual({
      start: false,
      reason: 'already_set',
    })
  })

  it('leaves accounts older than a week to the backfill', () => {
    expect(decideTrialStart({ ...owner, createdAt: new Date(now - 8 * DAY) }, now)).toEqual({
      start: false,
      reason: 'too_old',
    })
  })

  it('does nothing when trials are switched off', () => {
    expect(decideTrialStart(owner, now, 0)).toEqual({ start: false, reason: 'disabled' })
  })

  it('ignores staff and missing accounts', () => {
    expect(decideTrialStart({ ...owner, role: 'staff' }, now).start).toBe(false)
    expect(decideTrialStart(undefined, now).start).toBe(false)
  })

  it('goes by the sign-up date, so recreating the account doc does not restart the trial', () => {
    const recreated = { role: 'superAdmin', createdAt: new Date(now) }
    expect(decideTrialStart(recreated, now, undefined, now - 120 * DAY)).toEqual({
      start: false,
      reason: 'too_old',
    })
  })

  it('starts the trial when the login itself is new', () => {
    expect(decideTrialStart(owner, now, undefined, now - DAY)).toEqual({
      start: true,
      trialEndsAtMs: now + 90 * DAY,
    })
  })

  it('uses the sign-up date while the doc timestamp is still pending', () => {
    const pending = { role: 'superAdmin', createdAt: null }
    expect(decideTrialStart(pending, now, undefined, now - DAY).start).toBe(true)
    expect(decideTrialStart(pending, now, undefined, now - 30 * DAY).start).toBe(false)
  })
})

describe('shouldRequestTrial (app)', () => {
  it('asks for a new owner account with no trial yet', () => {
    expect(shouldRequestTrial({ role: 'superAdmin', createdAt: new Date(now - DAY) }, now)).toBe(
      true
    )
  })

  it('asks while the new account timestamp is still pending', () => {
    expect(shouldRequestTrial({ role: 'superAdmin', createdAt: null }, now)).toBe(true)
  })

  it('does not ask for staff, old accounts or accounts with a trial', () => {
    expect(shouldRequestTrial({ role: 'staff', createdAt: new Date(now) }, now)).toBe(false)
    expect(
      shouldRequestTrial({ role: 'superAdmin', createdAt: new Date(now - 30 * DAY) }, now)
    ).toBe(false)
    expect(
      shouldRequestTrial(
        { role: 'superAdmin', createdAt: new Date(now), trialEndsAt: new Date(now + DAY) },
        now
      )
    ).toBe(false)
  })
})

describe('getTrialSummary', () => {
  it('shows days left and what happens after', () => {
    const summary = getTrialSummary(
      { subscription: 'storvv_micro', trialEndsAt: now + 30 * DAY },
      now
    )
    expect(summary?.daysLeftLabel).toBe('Free trial · 30 days left')
    expect(summary?.endsLabel).toContain('Then Storvv Micro, free, unless you choose a plan.')
  })

  it('says 1 day, not 1 days', () => {
    const summary = getTrialSummary(
      { subscription: 'storvv_micro', trialEndsAt: now + DAY / 2 },
      now
    )
    expect(summary?.daysLeftLabel).toBe('Free trial · 1 day left')
  })

  it('is null once the trial ends or the account pays', () => {
    expect(
      getTrialSummary({ subscription: 'storvv_micro', trialEndsAt: now - DAY }, now)
    ).toBeNull()
    expect(
      getTrialSummary({ subscription: 'storvv_medium', trialEndsAt: now + 30 * DAY }, now)
    ).toBeNull()
    expect(getTrialSummary(null, now)).toBeNull()
  })
})

describe('limit messages on a trial', () => {
  it('do not point to add-ons, which a trial cannot buy', () => {
    expect(storeLimitReachedMessage('storvv_enterprise', 5, true)).toBe(
      'Your free trial includes up to 5 stores.'
    )
    expect(staffLimitReachedMessage('storvv_enterprise', 10, true)).toBe(
      'Your free trial includes up to 10 staff per store.'
    )
  })

  it('stay the same for paid accounts', () => {
    expect(storeLimitReachedMessage('storvv_enterprise', 5)).toContain('/month')
    expect(staffLimitReachedMessage('storvv_enterprise', 10)).toContain('/month')
  })
})
