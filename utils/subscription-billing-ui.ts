import type { UserData } from '~/composables/useUser'
import {
  getPlanDisplayName,
  normalizeSubscriptionPlan,
  resolveEffectiveSubscriptionPlan,
  type SubscriptionPlan,
} from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { BILLING_CYCLE_LABELS } from '~/types/subscription-billing'

export type BillingBannerVariant = 'past_due' | 'canceled_grace' | 'expired'

export type BillingBannerContent = {
  id: string
  variant: BillingBannerVariant
  title: string
  message: string
  actionLabel: string
  actionHref: string
}

function formatShortDate(iso: string | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Dismissible billing alerts for super admins in the dashboard shell. */
export function getSubscriptionBillingBanner(
  userData: UserData | null | undefined,
  isSuperAdmin: boolean
): BillingBannerContent | null {
  if (!isSuperAdmin || !userData) return null

  const status = userData.subscriptionStatus
  const storedPlan = normalizeSubscriptionPlan(userData.subscription)
  const effectivePlan = resolveEffectiveSubscriptionPlan(userData)
  const periodEndLabel = formatShortDate(userData.subscriptionCurrentPeriodEnd)
  const settingsHref = '/dashboard/settings?upgrade=1'

  if (status === 'past_due') {
    return {
      id: 'billing-past-due',
      variant: 'past_due',
      title: 'Subscription renewal failed',
      message:
        'Paystack could not charge your saved card. Update payment or choose a plan in Settings to avoid losing paid features.',
      actionLabel: 'Fix billing',
      actionHref: settingsHref,
    }
  }

  if (
    status === 'canceled' &&
    storedPlan !== 'storvv_micro' &&
    effectivePlan !== 'storvv_micro' &&
    periodEndLabel
  ) {
    return {
      id: 'billing-canceled-grace',
      variant: 'canceled_grace',
      title: 'Auto-renew is off',
      message: `Your ${getPlanDisplayName(storedPlan)} plan stays active until ${periodEndLabel}. After that you will move to Storvv Micro.`,
      actionLabel: 'View subscription',
      actionHref: '/dashboard/settings',
    }
  }

  if (
    storedPlan !== 'storvv_micro' &&
    effectivePlan === 'storvv_micro' &&
    (status === 'canceled' || status === 'expired')
  ) {
    return {
      id: 'billing-expired',
      variant: 'expired',
      title: 'Subscription ended',
      message:
        'Your account is on Storvv Micro. Upgrade again to restore analytics, extra branches, and other paid features.',
      actionLabel: 'Upgrade plan',
      actionHref: settingsHref,
    }
  }

  return null
}

export function formatPlanPriceKobo(kobo: number, currencySymbol = '₦'): string {
  if (!Number.isFinite(kobo) || kobo <= 0) return `${currencySymbol}0`
  const major = kobo / 100
  return `${currencySymbol}${major.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

export function formatBillingCyclePriceLabel(
  amountKobo: number,
  cycle: SubscriptionBillingCycle,
  currencySymbol = '₦'
): string {
  const price = formatPlanPriceKobo(amountKobo, currencySymbol)
  const suffix =
    cycle === 'yearly' ? '/ year' : cycle === 'quarterly' ? '/ quarter' : '/ month'
  return `${price} ${suffix}`
}

export function subscriptionStatusLabel(
  status: UserData['subscriptionStatus'] | undefined,
  storedPlan: SubscriptionPlan,
  effectivePlan: SubscriptionPlan
): string {
  if (status === 'past_due') return 'Payment failed'
  if (status === 'canceled' && effectivePlan !== 'storvv_micro') return 'Canceling'
  if (status === 'canceled') return 'Canceled'
  if (storedPlan === 'storvv_micro') return 'Free'
  if (status === 'active' || !status) return 'Active'
  return 'Active'
}
