export type SubscriptionPlan = 'storvv_micro' | 'storvv_medium' | 'storvv_enterprise'

export const SUBSCRIPTION_PLANS: Array<{ id: SubscriptionPlan; name: string }> = [
  { id: 'storvv_micro', name: 'Storvv Micro' },
  { id: 'storvv_medium', name: 'Storvv Medium' },
  { id: 'storvv_enterprise', name: 'Storvv Enterprise' },
]

