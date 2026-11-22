import { describe, expect, it } from 'vitest'
import type { Firestore } from 'firebase-admin/firestore'
import {
  parseLegacyPaystackPlans,
  planFromPaystackPlanCode,
  resolveSubscriptionCharge,
} from '~/server/utils/paystack-subscription-charge'

const config = {
  paystackPlanEnterpriseAmount: 3_500_000,
  paystackPlanCodeEnterpriseMonthly: 'PLN_new_ent_monthly',
  paystackLegacyPlans:
    'PLN_old_ent_monthly:storvv_enterprise:monthly:2500000, PLN_old_ent_yearly:storvv_enterprise:yearly:20000000',
}

/** Just enough Firestore for a renewal: one owner holding the subscription code. */
function dbWithSubscriber(subscriptionCode: string): Firestore {
  return {
    collection: () => ({
      where: (_field: string, _op: string, value: string) => ({
        limit: () => ({
          get: async () =>
            value === subscriptionCode
              ? { empty: false, docs: [{ id: 'owner1' }] }
              : { empty: true, docs: [] },
        }),
      }),
    }),
  } as unknown as Firestore
}

const renewal = (planCode: string, amount: number) => ({
  reference: `ref-${planCode}-${amount}`,
  amount,
  currency: 'NGN',
  plan: { plan_code: planCode },
  subscription: { subscription_code: 'SUB_1' },
})

describe('grandfathered Paystack plans', () => {
  it('parses PLN_code:plan:cycle:amount entries and skips bad ones', () => {
    expect(
      parseLegacyPaystackPlans(
        'PLN_a:storvv_enterprise:monthly:2500000,bad,PLN_b:storvv_micro:monthly:1,PLN_c:storvv_medium:weekly:1,PLN_d:storvv_medium:yearly:-5'
      )
    ).toEqual([
      {
        planCode: 'PLN_a',
        planId: 'storvv_enterprise',
        billingCycle: 'monthly',
        amountKobo: 2_500_000,
      },
    ])
    expect(parseLegacyPaystackPlans(undefined)).toEqual([])
  })

  it('maps an old plan code to its plan, cycle and old price', () => {
    expect(planFromPaystackPlanCode('PLN_old_ent_yearly', config)).toEqual({
      planId: 'storvv_enterprise',
      billingCycle: 'yearly',
      legacyAmountKobo: 20_000_000,
    })
    expect(planFromPaystackPlanCode('PLN_new_ent_monthly', config)).toEqual({
      planId: 'storvv_enterprise',
      billingCycle: 'monthly',
    })
  })

  it('renews an existing subscriber at the old price', async () => {
    const result = await resolveSubscriptionCharge(
      dbWithSubscriber('SUB_1'),
      renewal('PLN_old_ent_monthly', 2_500_000),
      config
    )
    expect(result).toMatchObject({ ok: true, planId: 'storvv_enterprise', billingCycle: 'monthly' })
  })

  it('still refuses a wrong amount on an old plan, and the old price on the new plan', async () => {
    const db = dbWithSubscriber('SUB_1')
    await expect(
      resolveSubscriptionCharge(db, renewal('PLN_old_ent_monthly', 100), config)
    ).resolves.toMatchObject({ ok: false, problem: 'amount-mismatch' })
    await expect(
      resolveSubscriptionCharge(db, renewal('PLN_new_ent_monthly', 2_500_000), config)
    ).resolves.toMatchObject({ ok: false, problem: 'amount-mismatch' })
    await expect(
      resolveSubscriptionCharge(db, renewal('PLN_new_ent_monthly', 3_500_000), config)
    ).resolves.toMatchObject({ ok: true })
  })
})
