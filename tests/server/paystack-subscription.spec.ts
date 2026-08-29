import { describe, expect, it } from 'vitest'
import {
  buildSubscriptionUserPatch,
  extractSubscriptionFromChargePayload,
} from '~/server/utils/paystack-subscription'

describe('paystack subscription utils', () => {
  it('builds active subscription patch', () => {
    const patch = buildSubscriptionUserPatch({
      userId: 'u1',
      planId: 'storvv_medium',
      billingCycle: 'monthly',
      reference: 'storvv_ref',
      paystackSubscriptionCode: 'SUB_abc',
      paystackSubscriptionEmailToken: 'tok',
      paystackCustomerCode: 'CUS_xyz',
    })
    expect(patch.subscription).toBe('storvv_medium')
    expect(patch.subscriptionBillingCycle).toBe('monthly')
    expect(patch.subscriptionStatus).toBe('active')
    expect(patch.paystackSubscriptionCode).toBe('SUB_abc')
    expect(patch.lastPaystackReference).toBe('storvv_ref')
    expect(typeof patch.subscriptionCurrentPeriodEnd).toBe('string')
  })

  it('extracts subscription fields from charge webhook payload', () => {
    const extracted = extractSubscriptionFromChargePayload({
      metadata: {
        userId: 'u1',
        planId: 'storvv_enterprise',
        billingCycle: 'yearly',
      },
      subscription: {
        subscription_code: 'SUB_123',
        email_token: 'tok_123',
        next_payment_date: '2027-01-01T00:00:00.000Z',
      },
      customer: { customer_code: 'CUS_456' },
    })
    expect(extracted.userId).toBe('u1')
    expect(extracted.planId).toBe('storvv_enterprise')
    expect(extracted.billingCycle).toBe('yearly')
    expect(extracted.subscriptionCode).toBe('SUB_123')
    expect(extracted.customerCode).toBe('CUS_456')
    expect(extracted.nextPaymentDate).toBe('2027-01-01T00:00:00.000Z')
  })
})
