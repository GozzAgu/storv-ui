import type { Component } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { Building2, Rocket, Store } from '@lucide/vue'
import {
  BILLING_CYCLE_PERIOD_SUFFIX,
  deriveBillingAmount,
  deriveBillingListAmount,
  type SubscriptionBillingCycle,
} from '~/utils/subscription-billing'
import { SUBSCRIPTION_ADD_ON_PRICES_NGN, type SubscriptionAddOnKind } from '~/types/subscription'

export type MarketingPlanId = 'micro' | 'medium' | 'enterprise'
type PaidPlan = Exclude<MarketingPlanId, 'micro'>
type PricingRegion = 'NG' | 'US' | 'GB' | 'EU'

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
    highlights: ['1 store and up to 2 staff', 'Inventory, sales and receipts', 'Storvv Assistant'],
    features: [
      '1 store · 1 department · up to 2 staff',
      'Inventory with serial or quantity tracking',
      'Quick Sale, receipts, returns, and customers',
      'WhatsApp receipts (10 a month)',
      'Help center and Storvv Assistant',
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
      'Activity log of every change',
      'Unlimited WhatsApp receipts',
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
      'Stock transfers between branches',
    ],
    features: [
      'Everything in Medium',
      'Up to 5 stores · 10 staff per store',
      'Unlimited departments',
      'Stock transfers between branches',
      'Copy categories from another branch',
      'Stock loans for serial-tracked items',
      'Priority support',
    ],
  },
]

const EU_COUNTRY_CODES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
])

/** NG mirrors what Paystack charges; other regions are display conversions. Add-ons are monthly. */
const PRICING_BY_REGION = {
  NG: {
    currency: 'NGN',
    medium: { monthly: 15000, yearly: 153000, yearlyList: 180000 },
    enterprise: { monthly: 25000, yearly: 200000, yearlyList: 300000 },
    addOns: {
      store: SUBSCRIPTION_ADD_ON_PRICES_NGN.store,
      staff: SUBSCRIPTION_ADD_ON_PRICES_NGN.staff,
    },
  },
  US: {
    currency: 'USD',
    medium: { monthly: 10, yearly: 102, yearlyList: 120 },
    enterprise: { monthly: 19, yearly: 190, yearlyList: 228 },
    addOns: { store: 3, staff: 1 },
  },
  GB: {
    currency: 'GBP',
    medium: { monthly: 8, yearly: 82, yearlyList: 96 },
    enterprise: { monthly: 15, yearly: 150, yearlyList: 180 },
    addOns: { store: 3, staff: 1 },
  },
  EU: {
    currency: 'EUR',
    medium: { monthly: 9, yearly: 92, yearlyList: 108 },
    enterprise: { monthly: 17, yearly: 170, yearlyList: 204 },
    addOns: { store: 3, staff: 1 },
  },
} as const

export const CYCLE_SAVINGS: Partial<Record<SubscriptionBillingCycle, string>> = {
  quarterly: 'Save 10%',
  yearly: 'Save 15%',
}

function detectRegion(locale: string): PricingRegion {
  const regionCode = locale.split('-')[1]?.toUpperCase()
  if (regionCode === 'NG' || regionCode === 'GB' || regionCode === 'US') return regionCode
  if (regionCode && EU_COUNTRY_CODES.has(regionCode)) return 'EU'

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (timeZone.startsWith('Africa/Lagos')) return 'NG'
  if (timeZone.startsWith('Europe/London')) return 'GB'
  if (timeZone.startsWith('Europe/')) return 'EU'
  return 'US'
}

/** Regional plan prices for the marketing site; the region is detected from the browser. */
export function useMarketingPricing() {
  const cycle = ref<SubscriptionBillingCycle>('monthly')
  const locale = ref('en-NG')
  const region = ref<PricingRegion>('NG')

  const pricing = computed(() => PRICING_BY_REGION[region.value])
  const currency = computed(() => pricing.value.currency)

  function formatPrice(amount: number) {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: pricing.value.currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function planPrice(plan: PaidPlan) {
    if (cycle.value === 'yearly') return formatPrice(pricing.value[plan].yearly)
    return formatPrice(deriveBillingAmount(pricing.value[plan].monthly, cycle.value))
  }

  function planListPrice(plan: PaidPlan): string | null {
    if (cycle.value === 'monthly') return null
    if (cycle.value === 'yearly') return formatPrice(pricing.value[plan].yearlyList)
    return formatPrice(deriveBillingListAmount(pricing.value[plan].monthly, 'quarterly'))
  }

  function addOnPrice(kind: SubscriptionAddOnKind) {
    return formatPrice(pricing.value.addOns[kind])
  }

  const periodSuffix = computed(() => BILLING_CYCLE_PERIOD_SUFFIX[cycle.value])

  const renewLabel = computed(() =>
    cycle.value === 'yearly' ? 'yearly' : cycle.value === 'quarterly' ? 'each quarter' : 'monthly'
  )

  onMounted(() => {
    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-NG'
    locale.value = browserLocale
    region.value = detectRegion(browserLocale)
  })

  return { cycle, currency, planPrice, planListPrice, addOnPrice, periodSuffix, renewLabel }
}
