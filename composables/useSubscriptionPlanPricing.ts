import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { formatBillingCyclePriceLabel } from '~/utils/subscription-billing-ui'

type PlanPricingMap = Partial<
  Record<SubscriptionPlan, Partial<Record<SubscriptionBillingCycle, number>>>
>

const pricingCache = ref<PlanPricingMap | null>(null)
const pricingLoading = ref(false)
const pricingError = ref<string | null>(null)

/** Fetch Paystack plan amounts (kobo) from server config. */
export function useSubscriptionPlanPricing() {
  const { authFetch } = useAuthenticatedFetch()
  const { formatCurrency } = usePreferences()

  async function loadPricing(force = false) {
    if (pricingCache.value && !force) return pricingCache.value
    pricingLoading.value = true
    pricingError.value = null
    try {
      const data = (await authFetch('/api/paystack/plan-pricing')) as {
        plans?: PlanPricingMap
      }
      pricingCache.value = data.plans || {}
      return pricingCache.value
    } catch (err: unknown) {
      pricingError.value =
        err instanceof Error ? err.message : 'Could not load plan pricing'
      return null
    } finally {
      pricingLoading.value = false
    }
  }

  function getPlanAmountKobo(
    planId: SubscriptionPlan,
    cycle: SubscriptionBillingCycle
  ): number | null {
    const amount = pricingCache.value?.[planId]?.[cycle]
    return typeof amount === 'number' && amount >= 0 ? amount : null
  }

  function formatPlanPrice(
    planId: SubscriptionPlan,
    cycle: SubscriptionBillingCycle,
    currencySymbol?: string
  ): string | null {
    const kobo = getPlanAmountKobo(planId, cycle)
    if (kobo == null) return null
    const symbol = currencySymbol || '₦'
    return formatBillingCyclePriceLabel(kobo, cycle, symbol)
  }

  /** Prefer user currency formatting when amount is loaded. */
  function formatUpgradePrice(planId: SubscriptionPlan, cycle: SubscriptionBillingCycle): string | null {
    const kobo = getPlanAmountKobo(planId, cycle)
    if (kobo == null) return null
    const formatted = formatCurrency(kobo / 100)
    const suffix =
      cycle === 'yearly' ? '/ year' : cycle === 'quarterly' ? '/ quarter' : '/ month'
    return `${formatted} ${suffix}, auto-renews`
  }

  return {
    pricingCache,
    pricingLoading,
    pricingError,
    loadPricing,
    getPlanAmountKobo,
    formatPlanPrice,
    formatUpgradePrice,
  }
}
