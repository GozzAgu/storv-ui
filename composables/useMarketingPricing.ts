import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { Building2, Rocket, Store } from '@lucide/vue'
import {
  BILLING_CYCLE_PERIOD_SUFFIX,
  deriveBillingAmount,
  deriveBillingListAmount,
  type SubscriptionBillingCycle,
} from '~/utils/subscription-billing'
import { SUBSCRIPTION_ADD_ON_PRICES_NGN, type SubscriptionAddOnKind } from '~/types/subscription'
import { fullMoneyFractionDigits } from '~/utils/format-money'

export type MarketingPlanId = 'micro' | 'medium' | 'enterprise'
type PaidPlan = Exclude<MarketingPlanId, 'micro'>

export interface MarketingPlan {
  id: MarketingPlanId
  name: string
  for: string
  icon: Component
  featured: boolean
  cta: string
  /** Short list for the home page teaser. */
  highlights: string[]
  features: string[]
}

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: 'micro',
    name: 'Micro',
    for: 'Solo shops getting organised',
    icon: Store,
    featured: false,
    cta: 'Start free',
    highlights: ['1 store and up to 2 staff', 'Inventory, sales and receipts', 'WhatsApp receipts'],
    features: [
      '1 store · 1 department · up to 2 staff',
      'Inventory with serial or quantity tracking',
      'Quick Sale, receipts, returns, and customers',
      'Write-offs and a 30-day stock out log',
      'WhatsApp receipts (10 a month)',
      'Help center',
      'Web dashboard · mobile apps coming soon',
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    for: 'Growing shops opening a second branch',
    icon: Rocket,
    featured: true,
    cta: 'Get Medium',
    highlights: [
      'Up to 2 stores, 5 staff each',
      'Reports with PDF and Excel exports',
      'Sales leads and customer balances',
    ],
    features: [
      'Everything in Micro',
      'Up to 2 stores · 5 staff per store',
      'Analytics with PDF and Excel exports',
      'Sales leads and customer balances',
      'Supplier returns and the full stock out log',
      'Stock transfers between your branches',
      'Activity log of every change',
      '50 WhatsApp receipts a month',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    for: 'Multi-branch retail teams',
    icon: Building2,
    featured: false,
    cta: 'Get Enterprise',
    highlights: [
      'Up to 5 stores, 10 staff each',
      'Add stores or staff seats anytime',
      'Stock loans and copy from branch',
    ],
    features: [
      'Everything in Medium',
      'Up to 5 stores · 10 staff per store',
      'Unlimited departments',
      'Copy categories from another branch',
      'Stock loans for serial-tracked items',
      'Unlimited WhatsApp receipts',
      'Priority support',
    ],
  },
]

/**
 * What Paystack charges, in naira. Everyone is billed in naira wherever they are. Add-ons are
 * monthly.
 */
export const NAIRA_PRICES = {
  medium: { monthly: 15000, yearly: 153000, yearlyList: 180000 },
  enterprise: { monthly: 35000, yearly: 357000, yearlyList: 420000 },
  addOns: {
    store: SUBSCRIPTION_ADD_ON_PRICES_NGN.store,
    staff: SUBSCRIPTION_ADD_ON_PRICES_NGN.staff,
  },
} as const

export const CYCLE_SAVINGS: Partial<Record<SubscriptionBillingCycle, string>> = {
  quarterly: 'Save 10%',
  yearly: 'Save 15%',
}

/** Plan prices for the marketing site, in naira: what checkout charges, wherever the visitor is. */
export function useMarketingPricing() {
  const cycle = ref<SubscriptionBillingCycle>('monthly')
  const currency = 'NGN'

  // "₦15,000" in every locale, not "NGN 15,000".
  const formatPrice = (naira: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      ...fullMoneyFractionDigits(naira),
    }).format(naira)

  function planAmount(plan: PaidPlan): number {
    if (cycle.value === 'yearly') return NAIRA_PRICES[plan].yearly
    return deriveBillingAmount(NAIRA_PRICES[plan].monthly, cycle.value)
  }

  const planPrice = (plan: PaidPlan) => formatPrice(planAmount(plan))

  function planListPrice(plan: PaidPlan): string | null {
    if (cycle.value === 'monthly') return null
    if (cycle.value === 'yearly') return formatPrice(NAIRA_PRICES[plan].yearlyList)
    return formatPrice(deriveBillingListAmount(NAIRA_PRICES[plan].monthly, 'quarterly'))
  }

  const addOnPrice = (kind: SubscriptionAddOnKind) => formatPrice(NAIRA_PRICES.addOns[kind])

  const periodSuffix = computed(() => BILLING_CYCLE_PERIOD_SUFFIX[cycle.value])

  const renewLabel = computed(() =>
    cycle.value === 'yearly' ? 'yearly' : cycle.value === 'quarterly' ? 'each quarter' : 'monthly'
  )

  return { cycle, currency, planPrice, planListPrice, addOnPrice, periodSuffix, renewLabel }
}
